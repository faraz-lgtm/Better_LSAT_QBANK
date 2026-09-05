import type {
  AnalyticsRepository,
  CompletedPreptestRow,
  PracticeSessionListRow,
  QuestionExplanationMetaRow,
} from './analytics.repository.ts'
import type { PracticeSessionKind } from '../practice/practice.repository.ts'
import { isStudentVisiblePrepTest } from '../_shared/prep-test-visibility.ts'
import { allocateQuestionTargetTimesByGroup } from '../_shared/question-target-time.ts'
import {
  adjustGoalAccuracyByDifficulty,
  assignRelativePriorityTiers,
  extraCorrectNeededPerTest,
  goalAccuracyFromScore,
  legacyPriorityLevel,
  MIN_ATTEMPTS_TO_UNLOCK_PRIORITY,
} from './goal-accuracy.ts'

const PREPTEST_EXPLANATION_CATALOG_LIMIT = 8000

export type ExplanationsSummaryRow = {
  questionId: string
  prepTestTitle: string
  sectionType: 'LR' | 'RC' | 'LG' | null
  questionNumber: number | null
  topicName: string
  hasWrittenExplanation: boolean
  hasVideo: boolean
  lastAttemptedAt: string
}

export type ExplanationDetailPayload = {
  questionId: string
  prepTestTitle: string
  sectionType: 'LR' | 'RC' | 'LG' | null
  questionNumber: number | null
  topicName: string
  explanationHtml: string | null
  videoUrl: string | null
}

function relOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

type PrepTestSectionRel = {
  id?: string | null
  section_type: 'LR' | 'RC' | 'LG' | null
  section_number: number | null
  is_experimental?: boolean | null
}

function prepTestSectionGroupKey(sec: PrepTestSectionRel | null): string {
  if (sec?.id) return sec.id
  return `${sec?.section_number ?? 'x'}:${sec?.section_type ?? 'LR'}:${sec?.is_experimental === true ? 'exp' : 'scored'}`
}

function formatQuestionResultTitle(
  moduleId: string | null,
  prepTestTitle: string,
  sectionNumber: number | null,
  questionNumber: number,
): string {
  const moduleMatch = moduleId?.match(/^LSAC(\d+)$/i)
  const pt = moduleMatch ? `PT ${moduleMatch[1]}` : prepTestTitle.trim() || 'PrepTest'
  const section = sectionNumber != null ? `S${sectionNumber}` : 'S?'
  return `${pt}  .  ${section}  .  Q${questionNumber}`
}

function latestByQuestion(
  events: {
    practice_session_id: string
    question_id: string
    is_correct: boolean
    section_type: 'LR' | 'RC' | 'LG' | null
  }[],
): Map<string, Map<string, { is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }>> {
  const bySession = new Map<
    string,
    Map<string, { is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }>
  >()
  for (const e of events) {
    let m = bySession.get(e.practice_session_id)
    if (!m) {
      m = new Map()
      bySession.set(e.practice_session_id, m)
    }
    m.set(e.question_id, { is_correct: e.is_correct, section_type: e.section_type })
  }
  return bySession
}

function filterSectionSessionsForAttempt<
  T extends { started_at: string; completed_at: string },
>(
  sessions: T[],
  prepTestStartedAt: string | null,
  prepTestCompletedAt: string | null,
): T[] {
  const startMs = prepTestStartedAt ? Date.parse(prepTestStartedAt) : Number.NaN
  const endMs = prepTestCompletedAt ? Date.parse(prepTestCompletedAt) : Number.NaN
  return sessions.filter((s) => {
    const startedMs = Date.parse(s.started_at)
    if (!Number.isFinite(startedMs)) return false
    if (Number.isFinite(startMs) && startedMs < startMs) return false
    if (Number.isFinite(endMs)) {
      const completedMs = Date.parse(s.completed_at)
      if (Number.isFinite(completedMs) && completedMs > endMs + 60_000) return false
    }
    return true
  })
}

function sectionSessionIsExperimental(session: {
  metadata?: Record<string, unknown>
  admin_sections?:
    | { is_experimental?: boolean | null; section_type?: 'LR' | 'RC' | 'LG' | null }
    | { is_experimental?: boolean | null; section_type?: 'LR' | 'RC' | 'LG' | null }[]
    | null
}): boolean {
  if (session.metadata?.isExperimental === true) return true
  const title =
    typeof session.metadata?.sectionTitle === 'string' ? session.metadata.sectionTitle : ''
  if (/\bEXP\b/i.test(title) || /experimental/i.test(title)) return true
  const sec = relOne(session.admin_sections ?? null)
  return sec?.is_experimental === true
}

/** Current LawHub LSAT: one scored LR (~24–26) and one scored RC (~26–28). */
const LAWHUB_SCORED_SECTION_QUESTION_MAX = { LR: 26, RC: 28 } as const

type SectionSessionForMisses = {
  id: string
  started_at: string
  completed_at: string
  raw_score: number | null
  metadata: Record<string, unknown>
  admin_sections?:
    | { is_experimental?: boolean | null; section_type?: 'LR' | 'RC' | 'LG' | null }
    | { is_experimental?: boolean | null; section_type?: 'LR' | 'RC' | 'LG' | null }[]
    | null
}

function sectionTypeOfSession(session: SectionSessionForMisses): 'LR' | 'RC' | null {
  const fromMeta = session.metadata.sectionType
  if (fromMeta === 'LR' || fromMeta === 'RC') return fromMeta
  const sec = relOne(session.admin_sections ?? null)
  if (sec?.section_type === 'LR' || sec?.section_type === 'RC') return sec.section_type
  return null
}

function rawQuestionCountOfSession(session: SectionSessionForMisses): number {
  const meta = session.metadata
  if (typeof meta.questionCount === 'number' && meta.questionCount > 0) {
    return Math.round(meta.questionCount)
  }
  if (Array.isArray(meta.questionIds) && meta.questionIds.length > 0) {
    return meta.questionIds.length
  }
  return 0
}

function lawHubQuestionCountOfSession(
  session: SectionSessionForMisses,
  kind: 'LR' | 'RC',
): number {
  const raw = rawQuestionCountOfSession(session)
  if (raw <= 0) return 0
  return Math.min(LAWHUB_SCORED_SECTION_QUESTION_MAX[kind], raw)
}

function pickLawHubScoredSection(
  sessions: SectionSessionForMisses[],
  kind: 'LR' | 'RC',
): SectionSessionForMisses | null {
  const ofKind = sessions
    .filter((s) => sectionTypeOfSession(s) === kind && !sectionSessionIsExperimental(s))
    .sort(
      (a, b) =>
        Date.parse(a.started_at) - Date.parse(b.started_at) || a.id.localeCompare(b.id),
    )
  if (ofKind.length === 0) return null
  const inRange = ofKind.filter(
    (s) => rawQuestionCountOfSession(s) <= LAWHUB_SCORED_SECTION_QUESTION_MAX[kind],
  )
  const pool = inRange.length > 0 ? inRange : ofKind
  return pool[0] ?? null
}

/**
 * Missed count for one LawHub scored section (never both LR sections / experimental).
 * Prefer raw_score vs section question count; fall back to that section's answer events.
 */
function missedFromLawHubSection(
  session: SectionSessionForMisses | null,
  kind: 'LR' | 'RC',
  eventsBySession: Map<
    string,
    Map<string, { is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }>
  >,
): number | null {
  if (!session) return null
  const cap = LAWHUB_SCORED_SECTION_QUESTION_MAX[kind]
  const total = lawHubQuestionCountOfSession(session, kind)
  if (total > 0) {
    const correct = Math.max(0, Math.min(total, session.raw_score ?? 0))
    return Math.min(cap, Math.max(0, total - correct))
  }
  const answers = eventsBySession.get(session.id)
  if (answers && answers.size > 0) {
    let miss = 0
    for (const v of answers.values()) {
      if (v.section_type === kind || (v.section_type == null && sectionTypeOfSession(session) === kind)) {
        if (!v.is_correct) miss += 1
      }
    }
    return Math.min(cap, miss)
  }
  return null
}

function lawHubLrRcMissesForAttempt(
  attemptSections: SectionSessionForMisses[],
  eventsBySession: Map<
    string,
    Map<string, { is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }>
  >,
): { lrMiss: number | null; rcMiss: number | null } {
  const lrSession = pickLawHubScoredSection(attemptSections, 'LR')
  const rcSession = pickLawHubScoredSection(attemptSections, 'RC')
  return {
    lrMiss: missedFromLawHubSection(lrSession, 'LR', eventsBySession),
    rcMiss: missedFromLawHubSection(rcSession, 'RC', eventsBySession),
  }
}

/** Latest completed section session per section_id within an attempt window. */
function latestScoredSectionSessionsBySectionId<
  T extends {
    section_id: string | null
    completed_at: string
    raw_score: number | null
    admin_sections?:
      | { is_experimental?: boolean | null }
      | { is_experimental?: boolean | null }[]
      | null
  },
>(sessions: T[]): T[] {
  const bySection = new Map<string, T>()
  for (const session of sessions) {
    if (!session.section_id || sectionSessionIsExperimental(session)) continue
    const existing = bySection.get(session.section_id)
    if (!existing || Date.parse(session.completed_at) >= Date.parse(existing.completed_at)) {
      bySection.set(session.section_id, session)
    }
  }
  return [...bySection.values()]
}

function difficultyLabel(n: number | null): 'Easiest' | 'Easy' | 'Medium' | 'Hard' | 'Hardest' {
  if (n == null || n <= 1) return 'Easiest'
  if (n === 2) return 'Easy'
  if (n === 3) return 'Medium'
  if (n === 4) return 'Hard'
  return 'Hardest'
}

type AnswerEventLite = {
  question_id: string
  is_correct: boolean
  selected_answer: string
  practice_session_id: string
  created_at: string
  time_spent_seconds?: number | null
}

function latestEventsByQuestion(
  events: AnswerEventLite[],
): Map<string, { is_correct: boolean; selected_answer: string; time_spent_seconds?: number | null }> {
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const map = new Map<string, { is_correct: boolean; selected_answer: string; time_spent_seconds?: number | null }>()
  for (const e of sorted) {
    map.set(e.question_id, {
      is_correct: e.is_correct,
      selected_answer: e.selected_answer,
      time_spent_seconds: e.time_spent_seconds,
    })
  }
  return map
}

function eventsAtCompletion(
  events: AnswerEventLite[],
  completedAt: string,
): Map<string, { is_correct: boolean; selected_answer: string; time_spent_seconds?: number | null }> {
  const cutoff = new Date(completedAt).getTime()
  const before = events.filter((e) => new Date(e.created_at).getTime() <= cutoff)
  return latestEventsByQuestion(before)
}

function eventsAfterCompletion(
  events: AnswerEventLite[],
  completedAt: string,
): Map<string, { is_correct: boolean; selected_answer: string; time_spent_seconds?: number | null }> {
  const cutoff = new Date(completedAt).getTime()
  const after = events.filter((e) => new Date(e.created_at).getTime() > cutoff)
  return latestEventsByQuestion(after)
}

function headlineFromQuestionMeta(row: QuestionExplanationMetaRow): {
  prepTestTitle: string
  sectionType: 'LR' | 'RC' | 'LG' | null
  questionNumber: number | null
  topicName: string
} {
  const qt = relOne(row.question_types)
  const sec = relOne(row.admin_sections)
  const pt = sec ? relOne(sec.admin_prep_tests) : null
  return {
    prepTestTitle: pt?.title?.trim() || 'PrepTest',
    sectionType: sec?.section_type ?? null,
    questionNumber: row.question_number,
    topicName: qt?.name?.trim() || '—',
  }
}

export function createAnalyticsService(deps: { repository: AnalyticsRepository }) {
  return {
    async getOverview(userId: string) {
      const [
        totalQuestionsAnswered,
        drillStats,
        completedPreptests,
        allSectionSessions,
        practiceStudyMinutes,
        lessonStudyMinutes,
      ] = await Promise.all([
        deps.repository.countAnswerEvents(userId),
        deps.repository.countDrillAnswerEvents(userId),
        deps.repository.listCompletedPreptests(userId),
        deps.repository.listCompletedSectionSessions(userId),
        deps.repository.sumCompletedSessionStudyMinutes(userId),
        deps.repository.sumCompletedLessonStudyMinutes(userId),
      ])

      const resolvedScores: { scaled: number; percentile: number | null; prepTestId: string | null }[] =
        []
      for (const row of completedPreptests) {
        let scaled = row.scaled_score
        let percentile = row.percentile
        const prepTestId = row.prep_test_id

        if (prepTestId) {
          const attemptSections = latestScoredSectionSessionsBySectionId(
            filterSectionSessionsForAttempt(
              allSectionSessions.filter((s) => s.prep_test_id === prepTestId),
              row.started_at,
              row.completed_at,
            ),
          )
          if (attemptSections.length > 0) {
            const rawTotal = attemptSections.reduce((sum, s) => sum + (s.raw_score ?? 0), 0)
            const scoreRow = await deps.repository.getScoreRowForRaw(prepTestId, rawTotal)
            if (scoreRow?.scaled_score != null) {
              scaled = scoreRow.scaled_score
              percentile = scoreRow.percentile
            } else if (scaled == null && row.raw_score != null) {
              const fallback = await deps.repository.getScoreRowForRaw(prepTestId, row.raw_score)
              if (fallback?.scaled_score != null) {
                scaled = fallback.scaled_score
                percentile = fallback.percentile
              }
            }
          } else if (scaled == null && row.raw_score != null) {
            const scoreRow = await deps.repository.getScoreRowForRaw(prepTestId, row.raw_score)
            if (scoreRow?.scaled_score != null) {
              scaled = scoreRow.scaled_score
              percentile = scoreRow.percentile
            }
          }

          if (scaled != null && percentile == null) {
            const byScaled = await deps.repository.getScoreRowForScaled(prepTestId, Math.round(scaled))
            if (byScaled?.percentile != null) percentile = byScaled.percentile
          }
        }

        if (scaled != null) {
          resolvedScores.push({ scaled, percentile, prepTestId })
        }
      }

      if (resolvedScores.length === 0) {
        const byPrepTest = new Map<string, typeof allSectionSessions>()
        for (const session of allSectionSessions) {
          if (!session.prep_test_id || sectionSessionIsExperimental(session)) continue
          const list = byPrepTest.get(session.prep_test_id) ?? []
          list.push(session)
          byPrepTest.set(session.prep_test_id, list)
        }
        for (const [prepTestId, sessions] of byPrepTest) {
          const scored = latestScoredSectionSessionsBySectionId(sessions)
          const rawTotal = scored.reduce((sum, s) => sum + (s.raw_score ?? 0), 0)
          if (rawTotal <= 0) continue
          const scoreRow = await deps.repository.getScoreRowForRaw(prepTestId, rawTotal)
          if (scoreRow?.scaled_score != null) {
            resolvedScores.push({
              scaled: scoreRow.scaled_score,
              percentile: scoreRow.percentile,
              prepTestId,
            })
          }
        }
      }

      const scaledScores = resolvedScores.map((r) => r.scaled)
      const bestScaledScore = scaledScores.length ? Math.max(...scaledScores) : null
      const averageScaledScore = scaledScores.length
        ? round1(scaledScores.reduce((a, b) => a + b, 0) / scaledScores.length)
        : null

      const bestResolved = resolvedScores.length
        ? resolvedScores.reduce((best, cur) => (cur.scaled > best.scaled ? cur : best))
        : null
      let bestPercentile = bestResolved?.percentile ?? null
      if (bestPercentile == null && bestResolved?.prepTestId != null && bestScaledScore != null) {
        const byScaled = await deps.repository.getScoreRowForScaled(
          bestResolved.prepTestId,
          Math.round(bestScaledScore),
        )
        bestPercentile = byScaled?.percentile ?? null
      }

      // Average of percentiles is not LSAT-meaningful — use conversion for the average scaled score.
      let averagePercentile: number | null = null
      if (averageScaledScore != null) {
        const avgScaledRounded = Math.round(averageScaledScore)
        const prepTestIds = [
          ...new Set(
            resolvedScores
              .map((r) => r.prepTestId)
              .filter((id): id is string => typeof id === 'string' && id.length > 0),
          ),
        ]
        for (const prepTestId of prepTestIds) {
          const byScaled = await deps.repository.getScoreRowForScaled(prepTestId, avgScaledRounded)
          if (byScaled?.percentile != null) {
            averagePercentile = byScaled.percentile
            break
          }
        }
        if (averagePercentile == null) {
          const percentileValues = resolvedScores
            .map((r) => r.percentile)
            .filter((p): p is number => p !== null && p !== undefined)
          if (percentileValues.length) {
            averagePercentile = round1(
              percentileValues.reduce((a, b) => a + b, 0) / percentileValues.length,
            )
          }
        }
      }
      const drillAccuracyPct =
        drillStats.total > 0 ? round1((100 * drillStats.correct) / drillStats.total) : null

      let lrSum = 0
      let rcSum = 0
      let ptWithLr = 0
      let ptWithRc = 0

      for (const row of completedPreptests) {
        if (!row.prep_test_id) continue
        const sectionSessions = allSectionSessions.filter(
          (s) => s.prep_test_id === row.prep_test_id && !sectionSessionIsExperimental(s),
        )
        const attemptSections = filterSectionSessionsForAttempt(
          sectionSessions,
          row.started_at,
          row.completed_at,
        )
        // Only load answer events for scored section sessions — never the parent PrepTest
        // session (that still contains experimental LR and can inflate misses to ~51).
        const sectionIds = attemptSections.map((s) => s.id)
        const events = sectionIds.length
          ? await deps.repository.listAnswerEventsForSessions(sectionIds, userId)
          : []
        const eventsBySession = latestByQuestion(events)
        const { lrMiss, rcMiss } = lawHubLrRcMissesForAttempt(attemptSections, eventsBySession)
        if (lrMiss != null) {
          lrSum += lrMiss
          ptWithLr += 1
        }
        if (rcMiss != null) {
          rcSum += rcMiss
          ptWithRc += 1
        }
      }

      if (ptWithLr === 0 && ptWithRc === 0 && allSectionSessions.length > 0) {
        const scoredStandalone = allSectionSessions.filter((s) => !sectionSessionIsExperimental(s))
        const sectionIds = scoredStandalone.map((s) => s.id)
        const sectionEvents = sectionIds.length
          ? await deps.repository.listAnswerEventsForSessions(sectionIds, userId)
          : []
        const eventsBySession = latestByQuestion(sectionEvents)
        for (const session of scoredStandalone) {
          const sectionType = sectionTypeOfSession(session)
          if (sectionType !== 'LR' && sectionType !== 'RC') continue
          const missed = missedFromLawHubSection(session, sectionType, eventsBySession)
          if (missed == null) continue
          if (sectionType === 'LR') {
            lrSum += missed
            ptWithLr += 1
          } else {
            rcSum += missed
            ptWithRc += 1
          }
        }
      }

      const averageLrMissedPerPrepTest = ptWithLr > 0 ? round1(lrSum / ptWithLr) : null
      const averageRcMissedPerPrepTest = ptWithRc > 0 ? round1(rcSum / ptWithRc) : null

      return {
        bestScaledScore,
        averageScaledScore,
        bestPercentile,
        averagePercentile,
        completedPrepTestCount: completedPreptests.length,
        totalQuestionsAnswered,
        drillAccuracyPct,
        totalDrillQuestionsAnswered: drillStats.total,
        averageLrMissedPerPrepTest,
        averageRcMissedPerPrepTest,
        totalStudyMinutes: (practiceStudyMinutes ?? 0) + (lessonStudyMinutes ?? 0),
      }
    },

    async getTrajectory(userId: string) {
      const rows = await deps.repository.listCompletedPreptests(userId)
      const points = []
      for (const r of rows) {
        let scaledScore = r.scaled_score
        let percentile = r.percentile
        if (scaledScore == null && r.raw_score != null && r.prep_test_id) {
          const scoreRow = await deps.repository.getScoreRowForRaw(r.prep_test_id, r.raw_score)
          if (scoreRow?.scaled_score != null) {
            scaledScore = scoreRow.scaled_score
            percentile = scoreRow.percentile
          }
        }
        let blindReviewScaledScore = r.blind_review_scaled_score
        let blindReviewPercentile = r.blind_review_percentile
        if (
          blindReviewScaledScore == null &&
          r.blind_review_raw_score != null &&
          r.prep_test_id
        ) {
          const brRow = await deps.repository.getScoreRowForRaw(r.prep_test_id, r.blind_review_raw_score)
          if (brRow?.scaled_score != null) {
            blindReviewScaledScore = brRow.scaled_score
            blindReviewPercentile = brRow.percentile
          }
        }
        const apt = relOne(r.admin_prep_tests)
        points.push({
          sessionId: r.id,
          prepTestTitle: apt?.title ?? 'PrepTest',
          moduleId: apt?.module_id ?? null,
          rawScore: r.raw_score,
          scaledScore,
          percentile,
          regularRawScore: r.raw_score,
          regularScaledScore: scaledScore,
          blindReviewRawScore: r.blind_review_raw_score,
          blindReviewScaledScore,
          blindReviewPercentile,
          completedAt: r.completed_at,
        })
      }
      return points
    },

    async getPriorities(
      userId: string,
      options?: { includeKinds?: PracticeSessionKind[] },
    ) {
      const includeKinds = options?.includeKinds
      const includeKindSet =
        includeKinds && includeKinds.length > 0 ? new Set(includeKinds) : null

      const [events, diffEvents, userGoalScore] = await Promise.all([
        deps.repository.listAnswerEventsWithTypes(userId),
        deps.repository.listAnswerEventsWithTypeDifficulty(userId),
        deps.repository.getUserGoalScore(userId),
      ])

      // Option B: goal accuracy from onboarding target score (global until peer data exists).
      // Fall back to static question_types.goal_accuracy only when the user has no goal_score.
      const scoreDerivedGoal =
        userGoalScore != null ? goalAccuracyFromScore(userGoalScore) : null

      const byType = new Map<string, { correct: number; total: number; questionIds: Set<string> }>()
      const difficultyByType = new Map<string, number[]>()
      for (const e of events) {
        if (includeKindSet && !includeKindSet.has(e.session_kind)) continue
        const cur = byType.get(e.question_type_id) ?? {
          correct: 0,
          total: 0,
          questionIds: new Set<string>(),
        }
        cur.total += 1
        if (e.is_correct) cur.correct += 1
        if (e.question_id) cur.questionIds.add(e.question_id)
        byType.set(e.question_type_id, cur)
      }
      for (const e of diffEvents) {
        if (!e.question_type_id || e.difficulty == null) continue
        const arr = difficultyByType.get(e.question_type_id) ?? []
        arr.push(e.difficulty)
        difficultyByType.set(e.question_type_id, arr)
      }
      const ids = [...byType.keys()]
      const types = await deps.repository.listQuestionTypesByIds(ids)
      const typeById = new Map(types.map((t) => [t.id, t]))

      const draft = [...byType.entries()].map(([questionTypeId, { correct, total, questionIds }]) => {
        const meta = typeById.get(questionTypeId)
        const avgPerTest =
          meta?.avg_per_test != null ? Number(meta.avg_per_test) : null
        const unlocked = total >= MIN_ATTEMPTS_TO_UNLOCK_PRIORITY
        // Guard divide-by-zero / no data: accuracy is null until there is at least one attempt.
        const accuracyPct = total > 0 ? round1((100 * correct) / total) : null

        const diffs = difficultyByType.get(questionTypeId) ?? []
        const difficulty =
          diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : null

        let goalAccuracy: number | null = null
        if (unlocked) {
          if (scoreDerivedGoal != null) {
            goalAccuracy = adjustGoalAccuracyByDifficulty(scoreDerivedGoal, difficulty)
          } else if (meta?.goal_accuracy != null) {
            goalAccuracy = adjustGoalAccuracyByDifficulty(Number(meta.goal_accuracy), difficulty)
          }
        }

        const gap =
          unlocked && goalAccuracy != null && accuracyPct != null
            ? round1(goalAccuracy - accuracyPct)
            : null

        const priorityScore =
          gap != null && avgPerTest != null && avgPerTest > 0
            ? round1(gap * avgPerTest)
            : null

        const rankable =
          unlocked &&
          priorityScore != null &&
          avgPerTest != null &&
          avgPerTest > 0

        const uniqueCount = questionIds.size > 0 ? questionIds.size : total
        const extraCorrectNeeded = unlocked
          ? extraCorrectNeededPerTest(gap, avgPerTest)
          : null

        return {
          questionTypeId,
          name: meta?.name ?? 'Unknown type',
          sectionType: meta?.section_type ?? null,
          attemptCount: total,
          correctCount: correct,
          accuracyPct,
          goalAccuracy,
          gap,
          priorityScore,
          extraCorrectNeededPerTest: extraCorrectNeeded,
          unlocked,
          rankable,
          difficulty,
          averagePerTest: avgPerTest,
          reviewCount: uniqueCount,
          goalScoreUsed: unlocked ? userGoalScore : null,
        }
      })

      const withTiers = assignRelativePriorityTiers(draft)
      const items = withTiers.map(({ rankable: _rankable, ...row }) => ({
        ...row,
        priorityTier: row.priorityTier,
        // Legacy field for existing drill/dashboard UI (highest/high → high).
        priorityLevel: legacyPriorityLevel(row.priorityTier),
      }))

      items.sort((a, b) => {
        const sa = a.priorityScore ?? Number.NEGATIVE_INFINITY
        const sb = b.priorityScore ?? Number.NEGATIVE_INFINITY
        if (sb !== sa) return sb - sa
        const ga = a.gap ?? Number.NEGATIVE_INFINITY
        const gb = b.gap ?? Number.NEGATIVE_INFINITY
        if (gb !== ga) return gb - ga
        return b.attemptCount - a.attemptCount
      })

      return {
        priorities: items,
        goalScore: userGoalScore,
        goalAccuracyFromScore: scoreDerivedGoal,
      }
    },

    async getSessions(
      userId: string,
      query: {
        kind?: PracticeSessionKind
        bookmarked?: boolean
        completedOnly?: boolean
        limit: number
        offset: number
      },
    ) {
      const [sessions, total] = await Promise.all([
        deps.repository.listSessions({
          userId,
          kind: query.kind,
          bookmarked: query.bookmarked,
          completedOnly: query.completedOnly,
          limit: query.limit,
          offset: query.offset,
        }),
        deps.repository.countSessions({
          userId,
          kind: query.kind,
          bookmarked: query.bookmarked,
          completedOnly: query.completedOnly,
        }),
      ])

      const drillTypeIds = [
        ...new Set(
          sessions.flatMap((s: PracticeSessionListRow) => {
            if (s.kind !== 'DRILL') return []
            const id = s.metadata?.questionTypeId
            return typeof id === 'string' && id.trim() ? [id.trim()] : []
          }),
        ),
      ]
      const typeRows =
        drillTypeIds.length > 0 ? await deps.repository.listQuestionTypesByIds(drillTypeIds) : []
      const typeNameById = new Map(typeRows.map((t) => [t.id, t.name]))

      const typeSectionById = new Map(typeRows.map((t) => [t.id, t.section_type]))

      return {
        sessions: sessions.map((s: PracticeSessionListRow) => {
          const apt = relOne(s.admin_prep_tests)
          const sec = relOne(s.admin_sections)
          let metadata = s.metadata ?? {}
          let typeSection: 'LR' | 'RC' | 'LG' | null = null
          if (s.kind === 'DRILL') {
            const existingName =
              typeof metadata.questionTypeName === 'string' ? metadata.questionTypeName.trim() : ''
            const typeId =
              typeof metadata.questionTypeId === 'string' ? metadata.questionTypeId.trim() : ''
            const resolvedName = existingName || (typeId ? typeNameById.get(typeId)?.trim() ?? '' : '')
            if (resolvedName && resolvedName !== existingName) {
              metadata = { ...metadata, questionTypeName: resolvedName }
            }
            if (typeId) {
              const st = typeSectionById.get(typeId)
              if (st === 'LR' || st === 'RC' || st === 'LG') typeSection = st
            }
          }
          const metaSection = metadata.sectionType
          const fromMeta =
            metaSection === 'LR' || metaSection === 'RC' || metaSection === 'LG' ? metaSection : null
          return {
            id: s.id,
            kind: s.kind,
            prepTestId: s.prep_test_id,
            startedAt: s.started_at,
            completedAt: s.completed_at,
            rawScore: s.raw_score,
            scaledScore: s.scaled_score,
            percentile: s.percentile,
            blindReviewRawScore: s.blind_review_raw_score,
            blindReviewScaledScore: s.blind_review_scaled_score,
            blindReviewPercentile: s.blind_review_percentile,
            bookmarked: s.bookmarked,
            excluded: s.excluded,
            metadata,
            prepTestTitle: apt?.title ?? null,
            sectionTitle: sec?.title ?? null,
            // Drills often lack admin_sections; fall back to metadata / question type.
            sectionType: sec?.section_type ?? fromMeta ?? typeSection,
          }
        }),
        total,
        limit: query.limit,
        offset: query.offset,
      }
    },

    async getKindBreakdown(userId: string, sessionKind: PracticeSessionKind) {
      const rows = await deps.repository.fetchKindSectionAccuracy(userId, sessionKind)
      const bySection = new Map<'LR' | 'RC' | 'LG', { correct: number; total: number }>()
      for (const r of rows) {
        const st = r.section_type
        if (!st) continue
        const cur = bySection.get(st) ?? { correct: 0, total: 0 }
        cur.total += 1
        if (r.is_correct) cur.correct += 1
        bySection.set(st, cur)
      }
      const sections = (['LR', 'RC', 'LG'] as const)
        .map((key) => {
          const v = bySection.get(key)
          if (!v || v.total === 0) return null
          return {
            sectionType: key,
            accuracyPct: round1((100 * v.correct) / v.total),
            correct: v.correct,
            total: v.total,
          }
        })
        .filter(Boolean)

      const totalCount = await deps.repository.countAnswerEventsByKind(userId, sessionKind)
      return { sessionKind, totalAnswered: totalCount, sections }
    },

    /** Catalog of PrepTest questions with admin-authored explanation or video (not tied to practice history). */
    async listExplanations(_userId: string): Promise<{ explanations: ExplanationsSummaryRow[] }> {
      const metas = await deps.repository.listAdminQuestionsWithExplanationContent(PREPTEST_EXPLANATION_CATALOG_LIMIT)
      const explanations: ExplanationsSummaryRow[] = []
      for (const meta of metas) {
        const head = headlineFromQuestionMeta(meta)
        const expl = meta.explanation?.trim() ?? ''
        const vid = meta.video_url?.trim() ?? ''
        const sec = relOne(meta.admin_sections)
        explanations.push({
          questionId: meta.id,
          prepTestTitle: head.prepTestTitle,
          sectionType: head.sectionType ?? sec?.section_type ?? null,
          questionNumber: head.questionNumber,
          topicName: head.topicName,
          hasWrittenExplanation: expl.length > 0,
          hasVideo: vid.length > 0,
          lastAttemptedAt: meta.updated_at ?? new Date().toISOString(),
        })
      }
      explanations.sort((a, b) => {
        const byPt = a.prepTestTitle.localeCompare(b.prepTestTitle)
        if (byPt !== 0) return byPt
        const st = (a.sectionType ?? '').localeCompare(b.sectionType ?? '')
        if (st !== 0) return st
        return (a.questionNumber ?? 0) - (b.questionNumber ?? 0)
      })
      return { explanations }
    },

    async getPrepTestSessionDetail(userId: string, sessionId: string) {
      const session = await deps.repository.resolveCompletedPrepTestSession(userId, sessionId)
      if (!session) {
        throw new Error('PrepTest session not found or not completed')
      }
      const apt = relOne(session.admin_prep_tests)
      if (!isStudentVisiblePrepTest(apt?.module_id ?? null)) {
        throw new Error('PrepTest session not found or not completed')
      }
      const prepTestId = session.prep_test_id
      if (!prepTestId) throw new Error('PrepTest session missing prep_test_id')

      const sectionSessions = await deps.repository.listSectionSessionsForPrepTest(userId, prepTestId)
      const sectionIds = sectionSessions.map((s) => s.id)
      const events = await deps.repository.listAnswerEventsForSessions(sectionIds, userId)
      const latest = latestEventsByQuestion(events)

      const completedAt = session.completed_at
      if (!completedAt) throw new Error('PrepTest session not found or not completed')
      const atCompletion = eventsAtCompletion(events, completedAt)
      const afterCompletion = eventsAfterCompletion(events, completedAt)

      const questionsRaw = await deps.repository.listPrepTestQuestionsWithMeta(prepTestId)
      const sectionRel = (row: Record<string, unknown>) =>
        relOne(
          row.admin_sections as PrepTestSectionRel | PrepTestSectionRel[] | null,
        )
      const targetTimeSecondsByQuestion = allocateQuestionTargetTimesByGroup(
        questionsRaw.map((row) => {
          const sec = sectionRel(row)
          return {
            id: String(row.id),
            difficulty: typeof row.difficulty === 'number' ? row.difficulty : null,
            groupKey: prepTestSectionGroupKey(sec),
          }
        }),
      )
      let correct = 0
      let total = 0
      const questionRows: Array<{
        id: string
        number: number
        title: string
        tags: string[]
        difficulty: ReturnType<typeof difficultyLabel>
        difficultyDots: number
        actualCorrect: boolean
        blindReviewCorrect: boolean
        blindReviewUnanswered: boolean
        isUnanswered: boolean
        correctLetter: string
        selectedLetter: string | null
        sectionType: 'LR' | 'RC' | 'LG' | null
        sectionNumber: number | null
        isExperimental: boolean
        targetTimeSeconds: number
        yourTimeSeconds?: number
      }> = []

      for (const row of questionsRaw) {
        const qid = String(row.id)
        const sec = sectionRel(row)
        const qt = relOne(row.question_types as { name: string } | { name: string }[] | null)
        const diff = typeof row.difficulty === 'number' ? row.difficulty : null
        const initial = atCompletion.get(qid)
        const final = latest.get(qid)
        const blindReviewEvent = afterCompletion.get(qid)
        const isExperimental = sec?.is_experimental === true
        if (!isExperimental) {
          total += 1
          if (initial?.is_correct) correct += 1
        }
        const qNum =
          typeof row.question_number === 'number'
            ? row.question_number
            : questionRows.length + 1
        const title = formatQuestionResultTitle(
          apt?.module_id ?? null,
          apt?.title ?? 'PrepTest',
          sec?.section_number ?? null,
          qNum,
        )
        const isUnanswered = !initial || !String(initial.selected_answer ?? '').trim()
        let blindReviewUnanswered = false
        let blindReviewCorrect = false
        if (blindReviewEvent) {
          blindReviewUnanswered = !String(blindReviewEvent.selected_answer ?? '').trim()
          blindReviewCorrect = blindReviewUnanswered ? false : blindReviewEvent.is_correct
        } else if (isUnanswered) {
          blindReviewUnanswered = true
        } else {
          blindReviewCorrect = initial?.is_correct ?? false
        }
        questionRows.push({
          id: qid,
          number: qNum,
          title,
          tags: qt?.name ? [qt.name] : [],
          difficulty: difficultyLabel(diff),
          difficultyDots: diff ?? 3,
          actualCorrect: initial?.is_correct ?? false,
          blindReviewCorrect,
          blindReviewUnanswered,
          isUnanswered,
          correctLetter:
            typeof row.correct_answer === 'string'
              ? row.correct_answer.trim().toUpperCase().slice(0, 1)
              : 'A',
          selectedLetter: final?.selected_answer ?? initial?.selected_answer ?? null,
          sectionType: sec?.section_type ?? null,
          sectionNumber: sec?.section_number ?? null,
          isExperimental,
          targetTimeSeconds: targetTimeSecondsByQuestion[qid] ?? 0,
          yourTimeSeconds:
            isUnanswered ||
            typeof initial?.time_spent_seconds !== 'number' ||
            !Number.isFinite(initial.time_spent_seconds)
              ? undefined
              : Math.max(0, Math.round(initial.time_spent_seconds)),
        })
      }

      const incorrect = total - correct
      const scaled = session.scaled_score ?? session.raw_score ?? 0
      const blindScaled = session.blind_review_scaled_score ?? session.blind_review_raw_score ?? scaled

      return {
        sessionId: session.id,
        prepTestId,
        prepTestTitle: apt?.title ?? 'PrepTest',
        moduleId: apt?.module_id ?? null,
        completedAt: session.completed_at,
        startedAt: session.started_at,
        excluded: session.excluded,
        totalQuestions: total,
        scaledScore: scaled,
        blindReviewScore: blindScaled,
        correct,
        incorrect,
        percentile: session.percentile,
        blindReviewPercentile: session.blind_review_percentile,
        blindReviewCompletedAt: session.blind_review_completed_at,
        questions: questionRows,
      }
    },

    async getExplanationDetail(_userId: string, questionId: string): Promise<ExplanationDetailPayload> {
      const row = await deps.repository.getQuestionExplanationPayload(questionId)
      if (!row) throw new Error('Question not found')

      const head = headlineFromQuestionMeta(row)
      const expl = row.explanation?.trim() ?? ''
      const vid = row.video_url?.trim() ?? ''
      return {
        questionId: row.id,
        prepTestTitle: head.prepTestTitle,
        sectionType: head.sectionType,
        questionNumber: head.questionNumber,
        topicName: head.topicName,
        explanationHtml: expl.length > 0 ? (row.explanation ?? null) : null,
        videoUrl: vid.length > 0 ? (row.video_url ?? null) : null,
      }
    },

    async getQuestionTypeReview(
      userId: string,
      questionTypeId: string,
      options?: { limit?: number },
    ) {
      const limit = Math.min(100, Math.max(1, options?.limit ?? 100))
      const types = await deps.repository.listQuestionTypesByIds([questionTypeId])
      const meta = types[0] ?? null

      const events = await deps.repository.listAnswerEventsForQuestionType(userId, questionTypeId)
      // Events are ordered created_at desc — keep first (latest) per question.
      const latestByQuestion = new Map<string, (typeof events)[number]>()
      for (const event of events) {
        if (!latestByQuestion.has(event.question_id)) {
          latestByQuestion.set(event.question_id, event)
        }
      }
      const latestEvents = [...latestByQuestion.values()].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      )
      const page = latestEvents.slice(0, limit)

      const questionMetaRows = await deps.repository.listQuestionsExplanationMetaByIds(
        page.map((e) => e.question_id),
      )
      const questionMetaById = new Map(questionMetaRows.map((row) => [row.id, row]))
      const correctCount = latestEvents.filter((event) => event.is_correct).length

      const attempts = page.map((event) => {
        const qMeta = questionMetaById.get(event.question_id)
        const head = qMeta ? headlineFromQuestionMeta(qMeta) : null
        const sec = qMeta ? relOne(qMeta.admin_sections) : null
        const pt = sec ? relOne(sec.admin_prep_tests) : null
        const questionNumber = head?.questionNumber ?? null
        const prepTestTitle = head?.prepTestTitle ?? null
        const moduleId = pt?.module_id ?? null
        const title =
          questionNumber != null
            ? formatQuestionResultTitle(
              moduleId,
              prepTestTitle ?? 'PrepTest',
              sec?.section_number ?? null,
              questionNumber,
            )
            : 'Question'

        return {
          answerEventId: event.id,
          questionId: event.question_id,
          practiceSessionId: event.practice_session_id,
          sessionKind: event.session_kind,
          isCorrect: event.is_correct,
          selectedAnswer: event.selected_answer,
          difficulty: event.difficulty,
          sectionType: event.section_type ?? head?.sectionType ?? null,
          createdAt: event.created_at,
          title,
          questionNumber,
          prepTestTitle,
        }
      })

      return {
        questionTypeId,
        name: meta?.name ?? 'Unknown type',
        sectionType: meta?.section_type ?? null,
        attemptCount: latestEvents.length,
        correctCount,
        attempts,
      }
    },
  }
}

export type AnalyticsService = ReturnType<typeof createAnalyticsService>
