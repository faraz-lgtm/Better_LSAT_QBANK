import type {
  AnalyticsRepository,
  CompletedPreptestRow,
  PracticeSessionListRow,
  QuestionExplanationMetaRow,
} from './analytics.repository.ts'
import type { PracticeSessionKind } from '../practice/practice.repository.ts'
import { isStudentVisiblePrepTest } from '../_shared/prep-test-visibility.ts'

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

type AnswerEventSlice = {
  practice_session_id: string
  question_id: string
  is_correct: boolean
  section_type: 'LR' | 'RC' | 'LG' | null
  created_at: string
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

function latestAnswersAcrossSessions(
  events: AnswerEventSlice[],
): Map<string, { is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }> {
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const map = new Map<string, { is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }>()
  for (const e of sorted) {
    map.set(e.question_id, { is_correct: e.is_correct, section_type: e.section_type })
  }
  return map
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
  admin_sections?:
    | { is_experimental?: boolean | null }
    | { is_experimental?: boolean | null }[]
    | null
}): boolean {
  const sec = relOne(session.admin_sections ?? null)
  return sec?.is_experimental === true
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

function lrRcMissesFromAnswers(
  answers: Iterable<{ is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }>,
): { lrMiss: number; rcMiss: number; hadLr: boolean; hadRc: boolean } {
  let lrMiss = 0
  let rcMiss = 0
  let hadLr = false
  let hadRc = false
  for (const v of answers) {
    if (v.section_type === 'LR') {
      hadLr = true
      if (!v.is_correct) lrMiss += 1
    }
    if (v.section_type === 'RC') {
      hadRc = true
      if (!v.is_correct) rcMiss += 1
    }
  }
  return { lrMiss, rcMiss, hadLr, hadRc }
}

function priorityLevel(gap: number, attempts: number): 'high' | 'medium' | 'low' {
  if (attempts < 3) return 'low'
  if (gap >= 15) return 'high'
  if (gap >= 8) return 'medium'
  return 'low'
}

function difficultyLabel(n: number | null): 'Easiest' | 'Easy' | 'Medium' | 'Hard' | 'Hardest' {
  if (n == null || n <= 1) return 'Easiest'
  if (n === 2) return 'Easy'
  if (n === 3) return 'Medium'
  if (n === 4) return 'Hard'
  return 'Hardest'
}

function latestEventsByQuestion(
  events: {
    question_id: string
    is_correct: boolean
    selected_answer: string
    practice_session_id: string
    created_at: string
  }[],
): Map<string, { is_correct: boolean; selected_answer: string }> {
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const map = new Map<string, { is_correct: boolean; selected_answer: string }>()
  for (const e of sorted) {
    map.set(e.question_id, { is_correct: e.is_correct, selected_answer: e.selected_answer })
  }
  return map
}

function eventsAtCompletion(
  events: {
    question_id: string
    is_correct: boolean
    selected_answer: string
    practice_session_id: string
    created_at: string
  }[],
  completedAt: string,
): Map<string, { is_correct: boolean; selected_answer: string }> {
  const cutoff = new Date(completedAt).getTime()
  const before = events.filter((e) => new Date(e.created_at).getTime() <= cutoff)
  return latestEventsByQuestion(before)
}

function eventsAfterCompletion(
  events: {
    question_id: string
    is_correct: boolean
    selected_answer: string
    practice_session_id: string
    created_at: string
  }[],
  completedAt: string,
): Map<string, { is_correct: boolean; selected_answer: string }> {
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
        const sessionIds = [row.id, ...attemptSections.map((s) => s.id)]
        const events = sessionIds.length
          ? await deps.repository.listAnswerEventsForSessions(sessionIds, userId)
          : []
        const answers = latestAnswersAcrossSessions(events)
        const { lrMiss, rcMiss, hadLr, hadRc } = lrRcMissesFromAnswers(answers.values())
        if (hadLr) {
          lrSum += lrMiss
          ptWithLr += 1
        }
        if (hadRc) {
          rcSum += rcMiss
          ptWithRc += 1
        }
      }

      if (ptWithLr === 0 && ptWithRc === 0 && allSectionSessions.length > 0) {
        const sectionIds = allSectionSessions.map((s) => s.id)
        const sectionEvents = sectionIds.length
          ? await deps.repository.listAnswerEventsForSessions(sectionIds, userId)
          : []
        const eventsBySession = latestByQuestion(sectionEvents)
        for (const session of allSectionSessions) {
          const sectionType =
            typeof session.metadata.sectionType === 'string' ? session.metadata.sectionType : null
          const answers = eventsBySession.get(session.id)
          if (answers && answers.size > 0) {
            const { lrMiss, rcMiss, hadLr, hadRc } = lrRcMissesFromAnswers(answers.values())
            if (hadLr) {
              lrSum += lrMiss
              ptWithLr += 1
            } else if (sectionType === 'LR') {
              const total = Array.isArray(session.metadata.questionIds)
                ? session.metadata.questionIds.length
                : 0
              const correct = session.raw_score ?? 0
              if (total > 0) {
                lrSum += total - correct
                ptWithLr += 1
              }
            }
            if (hadRc) {
              rcSum += rcMiss
              ptWithRc += 1
            } else if (sectionType === 'RC') {
              const total = Array.isArray(session.metadata.questionIds)
                ? session.metadata.questionIds.length
                : 0
              const correct = session.raw_score ?? 0
              if (total > 0) {
                rcSum += total - correct
                ptWithRc += 1
              }
            }
          } else {
            const total = Array.isArray(session.metadata.questionIds)
              ? session.metadata.questionIds.length
              : 0
            const correct = session.raw_score ?? 0
            if (total > 0 && (sectionType === 'LR' || sectionType === 'RC')) {
              const missed = total - correct
              if (sectionType === 'LR') {
                lrSum += missed
                ptWithLr += 1
              } else {
                rcSum += missed
                ptWithRc += 1
              }
            }
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

    async getPriorities(userId: string) {
      const events = await deps.repository.listAnswerEventsWithTypes(userId)
      const diffEvents = await deps.repository.listAnswerEventsWithTypeDifficulty(userId)
      const byType = new Map<string, { correct: number; total: number; questionIds: Set<string> }>()
      const difficultyByType = new Map<string, number[]>()
      for (const e of events) {
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

      const items = [...byType.entries()].map(([questionTypeId, { correct, total, questionIds }]) => {
        const meta = typeById.get(questionTypeId)
        const accuracyPct = total > 0 ? round1((100 * correct) / total) : 0
        const goal = meta?.goal_accuracy != null ? Number(meta.goal_accuracy) : null
        const gap = goal != null ? round1(goal - accuracyPct) : null
        const pl = gap != null ? priorityLevel(gap, total) : priorityLevel(0, total)
        const diffs = difficultyByType.get(questionTypeId) ?? []
        const difficulty =
          diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : null
        const avgPerTest =
          meta?.avg_per_test != null ? Number(meta.avg_per_test) : null
        const uniqueCount = questionIds.size > 0 ? questionIds.size : total
        return {
          questionTypeId,
          name: meta?.name ?? 'Unknown type',
          sectionType: meta?.section_type ?? null,
          attemptCount: total,
          correctCount: correct,
          accuracyPct,
          goalAccuracy: goal,
          gap,
          priorityLevel: pl,
          difficulty,
          averagePerTest: avgPerTest,
          reviewCount: uniqueCount,
        }
      })

      items.sort((a, b) => {
        const ga = a.gap ?? -999
        const gb = b.gap ?? -999
        if (gb !== ga) return gb - ga
        return b.attemptCount - a.attemptCount
      })
      return { priorities: items }
    },

    async getSessions(
      userId: string,
      query: { kind?: PracticeSessionKind; bookmarked?: boolean; limit: number; offset: number },
    ) {
      const [sessions, total] = await Promise.all([
        deps.repository.listSessions({
          userId,
          kind: query.kind,
          bookmarked: query.bookmarked,
          limit: query.limit,
          offset: query.offset,
        }),
        deps.repository.countSessions({
          userId,
          kind: query.kind,
          bookmarked: query.bookmarked,
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

      return {
        sessions: sessions.map((s: PracticeSessionListRow) => {
          const apt = relOne(s.admin_prep_tests)
          const sec = relOne(s.admin_sections)
          let metadata = s.metadata ?? {}
          if (s.kind === 'DRILL') {
            const existingName =
              typeof metadata.questionTypeName === 'string' ? metadata.questionTypeName.trim() : ''
            const typeId =
              typeof metadata.questionTypeId === 'string' ? metadata.questionTypeId.trim() : ''
            const resolvedName = existingName || (typeId ? typeNameById.get(typeId)?.trim() ?? '' : '')
            if (resolvedName && resolvedName !== existingName) {
              metadata = { ...metadata, questionTypeName: resolvedName }
            }
          }
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
            sectionType: sec?.section_type ?? null,
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
      const atCompletion = eventsAtCompletion(events, completedAt)
      const afterCompletion = eventsAfterCompletion(events, completedAt)

      const questionsRaw = await deps.repository.listPrepTestQuestionsWithMeta(prepTestId)
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
      }> = []

      for (const row of questionsRaw) {
        const qid = String(row.id)
        const sec = relOne(
          row.admin_sections as
            | {
                section_type: 'LR' | 'RC' | 'LG' | null
                section_number: number | null
                is_experimental?: boolean | null
              }
            | {
                section_type: 'LR' | 'RC' | 'LG' | null
                section_number: number | null
                is_experimental?: boolean | null
              }[]
            | null,
        )
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
