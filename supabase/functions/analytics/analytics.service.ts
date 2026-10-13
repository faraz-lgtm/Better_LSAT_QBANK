import type {
  AnalyticsRepository,
  CompletedPreptestRow,
  OverviewPageHistorySessionRow,
  OverviewPagePriorityAggregateRow,
  OverviewPageScoreRow,
  OverviewPageSectionSessionRow,
  PracticeSessionListRow,
  QuestionExplanationMetaRow,
} from './analytics.repository.ts'
import type { PracticeSessionKind } from '../practice/practice.repository.ts'
import { isStudentVisiblePrepTest } from '../_shared/prep-test-visibility.ts'
import { hasEnoughPlatformAnswerSample } from '../_shared/platform-answer-sample.ts'
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
const POPULARITY_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

/** A–E bar heights (0–100). Zeros when platform sample is below the display threshold. */
export function answerPopularityPctTuple(
  selections: readonly string[],
): [number, number, number, number, number] {
  const counts: Record<(typeof POPULARITY_LETTERS)[number], number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  }
  let total = 0
  for (const raw of selections) {
    const letter = raw.trim().toUpperCase().slice(0, 1)
    if (letter !== 'A' && letter !== 'B' && letter !== 'C' && letter !== 'D' && letter !== 'E') {
      continue
    }
    counts[letter] += 1
    total += 1
  }
  if (!hasEnoughPlatformAnswerSample(total)) return [0, 0, 0, 0, 0]
  return POPULARITY_LETTERS.map((letter) => Math.round((100 * counts[letter]) / total)) as [
    number,
    number,
    number,
    number,
    number,
  ]
}

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

/** Section/drill BR is stored in metadata; PrepTest uses the session column. */
export function resolveSessionBlindReviewRawScore(
  kind: PracticeSessionKind,
  columnValue: number | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
): number | null {
  if (typeof columnValue === 'number' && Number.isFinite(columnValue)) {
    return Math.round(columnValue)
  }
  const meta = metadata ?? {}
  const fromMeta =
    kind === 'SECTION'
      ? meta.sectionBlindReviewRawScore
      : kind === 'DRILL'
        ? meta.drillBlindReviewRawScore
        : null
  if (typeof fromMeta === 'number' && Number.isFinite(fromMeta)) {
    return Math.round(fromMeta)
  }
  return null
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
    | {
        is_experimental?: boolean | null
        section_type?: 'LR' | 'RC' | 'LG' | null
        question_count?: number | null
      }
    | {
        is_experimental?: boolean | null
        section_type?: 'LR' | 'RC' | 'LG' | null
        question_count?: number | null
      }[]
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
  const sec = relOne(session.admin_sections ?? null)
  if (typeof sec?.question_count === 'number' && sec.question_count > 0) {
    return Math.round(sec.question_count)
  }
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

export type AnalyticsPageBundleView = 'dashboard' | 'overview' | 'drills'

/** Overview UI only previews a few rows; full lists live on dedicated pages. */
const OVERVIEW_HISTORY_LIMIT = 8
/** Dashboard continue strip only needs a handful of in-progress drills. */
const DASHBOARD_DRILL_LIMIT = 12

type ScoreLookupValue = { scaled_score: number | null; percentile: number | null } | null

export function buildScoreLookupsFromRows(rows: OverviewPageScoreRow[]): {
  byRaw: Map<string, ScoreLookupValue>
  byScaled: Map<string, ScoreLookupValue>
} {
  const byRaw = new Map<string, ScoreLookupValue>()
  const byScaled = new Map<string, ScoreLookupValue & { raw_score: number }>()
  for (const row of rows) {
    byRaw.set(`${row.prep_test_id}:${row.raw_score}`, {
      scaled_score: row.scaled_score,
      percentile: row.percentile,
    })
    if (row.scaled_score == null) continue
    const scaledKey = `${row.prep_test_id}:${Math.round(row.scaled_score)}`
    const existing = byScaled.get(scaledKey)
    if (!existing || row.raw_score < existing.raw_score) {
      byScaled.set(scaledKey, {
        scaled_score: row.scaled_score,
        percentile: row.percentile,
        raw_score: row.raw_score,
      })
    }
  }
  const byScaledOut = new Map<string, ScoreLookupValue>()
  for (const [key, value] of byScaled) {
    byScaledOut.set(key, {
      scaled_score: value.scaled_score,
      percentile: value.percentile,
    })
  }
  return { byRaw, byScaled: byScaledOut }
}

function mapOverviewHistorySessions(
  rows: OverviewPageHistorySessionRow[],
  typeNameById: Map<string, string>,
  typeSectionById: Map<string, 'LR' | 'RC' | 'LG'>,
) {
  return rows.map((s) => {
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
      blindReviewRawScore: resolveSessionBlindReviewRawScore(
        s.kind,
        s.blind_review_raw_score,
        metadata,
      ),
      blindReviewScaledScore: s.blind_review_scaled_score,
      blindReviewPercentile: s.blind_review_percentile,
      bookmarked: s.bookmarked,
      excluded: s.excluded,
      metadata,
      prepTestTitle: s.prep_test_title,
      sectionTitle: s.section_title,
      sectionType: s.section_type ?? fromMeta ?? typeSection,
    }
  })
}

export function buildPrioritiesFromAggregates(
  rows: OverviewPagePriorityAggregateRow[],
  userGoalScore: number | null,
) {
  const scoreDerivedGoal =
    userGoalScore != null ? goalAccuracyFromScore(userGoalScore) : null

  const draft = rows.map((row) => {
    const total = row.attempt_count
    const correct = row.correct_count
    const avgPerTest = row.avg_per_test != null ? Number(row.avg_per_test) : null
    const unlocked = total >= MIN_ATTEMPTS_TO_UNLOCK_PRIORITY
    const accuracyPct = total > 0 ? round1((100 * correct) / total) : null
    const difficulty =
      row.avg_difficulty != null && Number.isFinite(row.avg_difficulty)
        ? Math.round(row.avg_difficulty)
        : null

    let goalAccuracy: number | null = null
    if (unlocked) {
      if (scoreDerivedGoal != null) {
        goalAccuracy = adjustGoalAccuracyByDifficulty(scoreDerivedGoal, difficulty)
      } else if (row.goal_accuracy != null) {
        goalAccuracy = adjustGoalAccuracyByDifficulty(Number(row.goal_accuracy), difficulty)
      }
    }

    const gap =
      unlocked && goalAccuracy != null && accuracyPct != null
        ? round1(goalAccuracy - accuracyPct)
        : null
    const priorityScore =
      gap != null && avgPerTest != null && avgPerTest > 0 ? round1(gap * avgPerTest) : null
    const rankable =
      unlocked && priorityScore != null && avgPerTest != null && avgPerTest > 0
    const uniqueCount = row.unique_question_count > 0 ? row.unique_question_count : total

    return {
      questionTypeId: row.question_type_id,
      name: row.name ?? 'Unknown type',
      sectionType: row.section_type,
      attemptCount: total,
      correctCount: correct,
      accuracyPct,
      goalAccuracy,
      gap,
      priorityScore,
      extraCorrectNeededPerTest: unlocked ? extraCorrectNeededPerTest(gap, avgPerTest) : null,
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
}

export function createAnalyticsService(deps: { repository: AnalyticsRepository }) {
  const service = {
    async getOverview(
      userId: string,
      opts?: {
        completedSince?: string
        /** When set (and no completedSince filter), skips a duplicate prep-test fetch. */
        completedPreptests?: CompletedPreptestRow[]
        countStats?: {
          totalQuestionsAnswered: number
          drillCorrect: number
          drillTotal: number
          practiceStudyMinutes: number
          lessonStudyMinutes: number
        }
        sectionSessions?: OverviewPageSectionSessionRow[]
        scoreRowsByRaw?: Map<string, ScoreLookupValue>
        scoreRowsByScaled?: Map<string, ScoreLookupValue>
      },
    ) {
      const sinceOpts = opts?.completedSince ? { completedSince: opts.completedSince } : undefined
      const canUsePagePreload = !sinceOpts
      const [countStats, completedPreptests, allSectionSessions] = await Promise.all([
        canUsePagePreload && opts?.countStats
          ? Promise.resolve(opts.countStats)
          : deps.repository.getOverviewCountStats(userId, sinceOpts),
        canUsePagePreload && opts?.completedPreptests
          ? Promise.resolve(opts.completedPreptests)
          : deps.repository.listCompletedPreptests(userId, sinceOpts),
        canUsePagePreload && opts?.sectionSessions
          ? Promise.resolve(opts.sectionSessions)
          : deps.repository.listCompletedSectionSessions(userId, sinceOpts),
      ])
      const totalQuestionsAnswered = countStats.totalQuestionsAnswered
      const drillStats = { correct: countStats.drillCorrect, total: countStats.drillTotal }
      const practiceStudyMinutes = countStats.practiceStudyMinutes
      const lessonStudyMinutes = countStats.lessonStudyMinutes

      const rawPairs: Array<{ prepTestId: string; rawScore: number }> = []
      const addRawPair = (prepTestId: string | null | undefined, rawScore: number | null | undefined) => {
        if (!prepTestId || rawScore == null || !Number.isFinite(rawScore)) return
        rawPairs.push({ prepTestId, rawScore })
      }

      const attemptSectionsForRow = new Map<string, typeof allSectionSessions>()
      for (const row of completedPreptests) {
        if (!row.prep_test_id) continue
        const attemptSections = latestScoredSectionSessionsBySectionId(
          filterSectionSessionsForAttempt(
            allSectionSessions.filter((s) => s.prep_test_id === row.prep_test_id),
            row.started_at,
            row.completed_at,
          ),
        )
        attemptSectionsForRow.set(row.id, attemptSections)
        if (attemptSections.length > 0) {
          addRawPair(
            row.prep_test_id,
            attemptSections.reduce((sum, s) => sum + (s.raw_score ?? 0), 0),
          )
        }
        addRawPair(row.prep_test_id, row.raw_score)
        addRawPair(row.prep_test_id, row.blind_review_raw_score)
      }

      const standaloneByPrepTest = new Map<string, typeof allSectionSessions>()
      for (const session of allSectionSessions) {
        if (!session.prep_test_id || sectionSessionIsExperimental(session)) continue
        const list = standaloneByPrepTest.get(session.prep_test_id) ?? []
        list.push(session)
        standaloneByPrepTest.set(session.prep_test_id, list)
      }
      for (const [prepTestId, sessions] of standaloneByPrepTest) {
        const scored = latestScoredSectionSessionsBySectionId(sessions)
        addRawPair(
          prepTestId,
          scored.reduce((sum, s) => sum + (s.raw_score ?? 0), 0),
        )
      }

      const scoreLookup =
        opts?.scoreRowsByRaw ?? (await deps.repository.listScoreRowsForRaw(rawPairs))
      const scoreForRaw = (prepTestId: string, rawScore: number) =>
        scoreLookup.get(`${prepTestId}:${rawScore}`) ?? null

      type ResolvedAttempt = {
        scaled: number | null
        percentile: number | null
        prepTestId: string | null
      }
      const draftScores: ResolvedAttempt[] = []
      const scaledLookupPairs: Array<{ prepTestId: string; scaledScore: number }> = []
      for (const row of completedPreptests) {
        let scaled = row.scaled_score
        let percentile = row.percentile
        const prepTestId = row.prep_test_id

        if (prepTestId) {
          const attemptSections = attemptSectionsForRow.get(row.id) ?? []
          if (attemptSections.length > 0) {
            const rawTotal = attemptSections.reduce((sum, s) => sum + (s.raw_score ?? 0), 0)
            const scoreRow = scoreForRaw(prepTestId, rawTotal)
            if (scoreRow?.scaled_score != null) {
              scaled = scoreRow.scaled_score
              percentile = scoreRow.percentile
            } else if (scaled == null && row.raw_score != null) {
              const fallback = scoreForRaw(prepTestId, row.raw_score)
              if (fallback?.scaled_score != null) {
                scaled = fallback.scaled_score
                percentile = fallback.percentile
              }
            }
          } else if (scaled == null && row.raw_score != null) {
            const scoreRow = scoreForRaw(prepTestId, row.raw_score)
            if (scoreRow?.scaled_score != null) {
              scaled = scoreRow.scaled_score
              percentile = scoreRow.percentile
            }
          }

          if (scaled != null && percentile == null) {
            scaledLookupPairs.push({ prepTestId, scaledScore: Math.round(scaled) })
          }
        }

        draftScores.push({ scaled, percentile, prepTestId })
      }

      const scaledLookup =
        opts?.scoreRowsByScaled ??
        (await deps.repository.listScoreRowsForScaled(scaledLookupPairs))
      const scoreForScaled = (prepTestId: string, scaledScore: number) =>
        scaledLookup.get(`${prepTestId}:${Math.round(scaledScore)}`) ?? null

      const resolvedScores: { scaled: number; percentile: number | null; prepTestId: string | null }[] =
        []
      for (const draft of draftScores) {
        let { scaled, percentile, prepTestId } = draft
        if (scaled != null && percentile == null && prepTestId) {
          const byScaled = scoreForScaled(prepTestId, scaled)
          if (byScaled?.percentile != null) percentile = byScaled.percentile
        }
        if (scaled != null) {
          resolvedScores.push({ scaled, percentile, prepTestId })
        }
      }

      if (resolvedScores.length === 0) {
        for (const [prepTestId, sessions] of standaloneByPrepTest) {
          const scored = latestScoredSectionSessionsBySectionId(sessions)
          const rawTotal = scored.reduce((sum, s) => sum + (s.raw_score ?? 0), 0)
          if (rawTotal <= 0) continue
          const scoreRow = scoreForRaw(prepTestId, rawTotal)
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
      const averageScaledScore = scaledScores.length
        ? round1(scaledScores.reduce((a, b) => a + b, 0) / scaledScores.length)
        : null

      type ScoreCandidate = { scaled: number; percentile: number | null; prepTestId: string | null }
      const higherScore = (a: ScoreCandidate | null, b: ScoreCandidate | null): ScoreCandidate | null => {
        if (a == null) return b
        if (b == null) return a
        return b.scaled > a.scaled ? b : a
      }

      let bestResolved: ScoreCandidate | null = resolvedScores.length
        ? resolvedScores.reduce((best, cur) => (cur.scaled > best.scaled ? cur : best))
        : null

      for (const row of completedPreptests) {
        if (row.scaled_score != null) {
          bestResolved = higherScore(bestResolved, {
            scaled: row.scaled_score,
            percentile: row.percentile,
            prepTestId: row.prep_test_id,
          })
        }
        let brScaled = row.blind_review_scaled_score
        let brPercentile = row.blind_review_percentile
        if (brScaled == null && row.blind_review_raw_score != null && row.prep_test_id) {
          const brRow = scoreForRaw(
            row.prep_test_id,
            row.blind_review_raw_score,
          )
          if (brRow?.scaled_score != null) {
            brScaled = brRow.scaled_score
            brPercentile = brRow.percentile
          }
        }
        if (brScaled != null) {
          bestResolved = higherScore(bestResolved, {
            scaled: brScaled,
            percentile: brPercentile,
            prepTestId: row.prep_test_id,
          })
        }
      }

      const bestScaledScore = bestResolved?.scaled ?? null
      let bestPercentile = bestResolved?.percentile ?? null

      // Average of percentiles is not LSAT-meaningful — use conversion for the average scaled score.
      let averagePercentile: number | null = null
      const followUpScaledPairs: Array<{ prepTestId: string; scaledScore: number }> = []
      if (bestPercentile == null && bestResolved?.prepTestId != null && bestScaledScore != null) {
        followUpScaledPairs.push({
          prepTestId: bestResolved.prepTestId,
          scaledScore: Math.round(bestScaledScore),
        })
      }
      const avgScaledRounded = averageScaledScore != null ? Math.round(averageScaledScore) : null
      const prepTestIdsForAvg =
        avgScaledRounded != null
          ? [
              ...new Set(
                resolvedScores
                  .map((r) => r.prepTestId)
                  .filter((id): id is string => typeof id === 'string' && id.length > 0),
              ),
            ]
          : []
      if (avgScaledRounded != null) {
        for (const prepTestId of prepTestIdsForAvg) {
          followUpScaledPairs.push({ prepTestId, scaledScore: avgScaledRounded })
        }
      }
      if (followUpScaledPairs.length > 0) {
        const followUpLookup =
          opts?.scoreRowsByScaled ??
          (await deps.repository.listScoreRowsForScaled(followUpScaledPairs))
        const followUpForScaled = (prepTestId: string, scaledScore: number) =>
          followUpLookup.get(`${prepTestId}:${Math.round(scaledScore)}`) ?? null
        if (bestPercentile == null && bestResolved?.prepTestId != null && bestScaledScore != null) {
          bestPercentile =
            followUpForScaled(bestResolved.prepTestId, bestScaledScore)?.percentile ?? null
        }
        if (avgScaledRounded != null) {
          for (const prepTestId of prepTestIdsForAvg) {
            const byScaled = followUpForScaled(prepTestId, avgScaledRounded)
            if (byScaled?.percentile != null) {
              averagePercentile = byScaled.percentile
              break
            }
          }
        }
      }
      if (averagePercentile == null && averageScaledScore != null) {
        const percentileValues = resolvedScores
          .map((r) => r.percentile)
          .filter((p): p is number => p !== null && p !== undefined)
        if (percentileValues.length) {
          averagePercentile = round1(
            percentileValues.reduce((a, b) => a + b, 0) / percentileValues.length,
          )
        }
      }
      const drillAccuracyPct =
        drillStats.total > 0 ? round1((100 * drillStats.correct) / drillStats.total) : null

      let lrSum = 0
      let rcSum = 0
      let ptWithLr = 0
      let ptWithRc = 0

      const attemptSectionsByRowId = new Map<string, typeof allSectionSessions>()
      const emptyEvents = new Map<
        string,
        Map<string, { is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }>
      >()
      const needsEventFallbackIds = new Set<string>()
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
        attemptSectionsByRowId.set(row.id, attemptSections)
        const { lrMiss, rcMiss } = lawHubLrRcMissesForAttempt(attemptSections, emptyEvents)
        if (lrMiss == null) {
          const lrSession = pickLawHubScoredSection(attemptSections, 'LR')
          if (lrSession) needsEventFallbackIds.add(lrSession.id)
        } else {
          lrSum += lrMiss
          ptWithLr += 1
        }
        if (rcMiss == null) {
          const rcSession = pickLawHubScoredSection(attemptSections, 'RC')
          if (rcSession) needsEventFallbackIds.add(rcSession.id)
        } else {
          rcSum += rcMiss
          ptWithRc += 1
        }
      }

      let eventsBySession = emptyEvents
      if (needsEventFallbackIds.size > 0) {
        const attemptEvents = await deps.repository.listAnswerEventsForSessions(
          [...needsEventFallbackIds],
          userId,
        )
        eventsBySession = latestByQuestion(attemptEvents)
        // Recompute only attempts that needed event fallback.
        lrSum = 0
        rcSum = 0
        ptWithLr = 0
        ptWithRc = 0
        for (const row of completedPreptests) {
          if (!row.prep_test_id) continue
          const attemptSections = attemptSectionsByRowId.get(row.id) ?? []
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
      }

      if (ptWithLr === 0 && ptWithRc === 0 && allSectionSessions.length > 0) {
        const scoredStandalone = allSectionSessions.filter((s) => !sectionSessionIsExperimental(s))
        const unresolvedIds = scoredStandalone
          .filter((session) => {
            const sectionType = sectionTypeOfSession(session)
            if (sectionType !== 'LR' && sectionType !== 'RC') return false
            return missedFromLawHubSection(session, sectionType, emptyEvents) == null
          })
          .map((s) => s.id)
        if (unresolvedIds.length > 0) {
          const extraEvents = await deps.repository.listAnswerEventsForSessions(unresolvedIds, userId)
          eventsBySession = latestByQuestion(extraEvents)
        }
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

    async getTrajectory(
      userId: string,
      opts?: {
        completedPreptests?: CompletedPreptestRow[]
        scoreRowsByRaw?: Map<string, ScoreLookupValue>
      },
    ) {
      const rows = opts?.completedPreptests ?? (await deps.repository.listCompletedPreptests(userId))
      const rawPairs: Array<{ prepTestId: string; rawScore: number }> = []
      for (const r of rows) {
        if (!r.prep_test_id) continue
        if (r.scaled_score == null && r.raw_score != null) {
          rawPairs.push({ prepTestId: r.prep_test_id, rawScore: r.raw_score })
        }
        if (r.blind_review_scaled_score == null && r.blind_review_raw_score != null) {
          rawPairs.push({ prepTestId: r.prep_test_id, rawScore: r.blind_review_raw_score })
        }
      }
      const scoreLookup =
        opts?.scoreRowsByRaw ?? (await deps.repository.listScoreRowsForRaw(rawPairs))
      const points = []
      for (const r of rows) {
        let scaledScore = r.scaled_score
        let percentile = r.percentile
        if (scaledScore == null && r.raw_score != null && r.prep_test_id) {
          const scoreRow = scoreLookup.get(`${r.prep_test_id}:${r.raw_score}`) ?? null
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
          const brRow = scoreLookup.get(`${r.prep_test_id}:${r.blind_review_raw_score}`) ?? null
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
      options?: { includeKinds?: PracticeSessionKind[]; skipDifficulty?: boolean },
    ) {
      const includeKinds = options?.includeKinds
      const includeKindSet =
        includeKinds && includeKinds.length > 0 ? new Set(includeKinds) : null

      const [events, diffEvents, userGoalScore] = await Promise.all([
        deps.repository.listAnswerEventsWithTypes(userId),
        options?.skipDifficulty
          ? Promise.resolve([] as Awaited<
              ReturnType<AnalyticsRepository['listAnswerEventsWithTypeDifficulty']>
            >)
          : deps.repository.listAnswerEventsWithTypeDifficulty(userId),
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
        incompleteOnly?: boolean
        limit: number
        offset: number
        /** Skip COUNT(*) when the caller only needs the page rows (e.g. overview preview). */
        skipCount?: boolean
      },
    ) {
      const listInput = {
        userId,
        kind: query.kind,
        bookmarked: query.bookmarked,
        completedOnly: query.completedOnly,
        incompleteOnly: query.incompleteOnly,
        limit: query.limit,
        offset: query.offset,
      }
      const [sessions, total] = query.skipCount
        ? [await deps.repository.listSessions(listInput), null as number | null]
        : await Promise.all([
          deps.repository.listSessions(listInput),
          deps.repository.countSessions({
            userId,
            kind: query.kind,
            bookmarked: query.bookmarked,
            completedOnly: query.completedOnly,
            incompleteOnly: query.incompleteOnly,
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

      const mapped = sessions.map((s: PracticeSessionListRow) => {
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
          blindReviewRawScore: resolveSessionBlindReviewRawScore(
            s.kind,
            s.blind_review_raw_score,
            metadata,
          ),
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
      })
      return {
        sessions: mapped,
        // When count is skipped, report at least the page size so callers know more may exist.
        total: total ?? (mapped.length >= query.limit ? query.offset + mapped.length + 1 : query.offset + mapped.length),
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
      const popularityByQuestion = await deps.repository.listLatestAnswerSelectionsByQuestionIds(
        questionsRaw.map((row) => String(row.id)),
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
        answerPopularity: [number, number, number, number, number]
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
          answerPopularity: answerPopularityPctTuple(popularityByQuestion.get(qid) ?? []),
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

    async getPageBundle(userId: string, view: AnalyticsPageBundleView) {
      if (view === 'drills') {
        const [sessions, priorities] = await Promise.all([
          service.getSessions(userId, { kind: 'DRILL', limit: DASHBOARD_DRILL_LIMIT, offset: 0 }),
          service.getPriorities(userId),
        ])
        return {
          view,
          sessions,
          priorities: priorities.priorities,
        }
      }

      if (view === 'dashboard') {
        // Overview already includes best timed + untimed-review scores; skip trajectory.
        // Only in-progress drills are shown on the dashboard continue strip.
        const [overview, sessions, priorities] = await Promise.all([
          service.getOverview(userId),
          service.getSessions(userId, {
            kind: 'DRILL',
            incompleteOnly: true,
            limit: DASHBOARD_DRILL_LIMIT,
            offset: 0,
          }),
          service.getPriorities(userId, { skipDifficulty: true }),
        ])
        return {
          view,
          overview,
          trajectory: [],
          sessions,
          priorities: priorities.priorities,
        }
      }

      // One DB round-trip for overview page inputs; business logic stays in the service.
      const page = await deps.repository.fetchOverviewPageData(userId, OVERVIEW_HISTORY_LIMIT)
      const { byRaw, byScaled } = buildScoreLookupsFromRows(page.scoreRows)
      const typeNameById = new Map(page.historyQuestionTypes.map((t) => [t.id, t.name]))
      const typeSectionById = new Map(
        page.historyQuestionTypes
          .filter((t): t is typeof t & { section_type: 'LR' | 'RC' | 'LG' } =>
            t.section_type === 'LR' || t.section_type === 'RC' || t.section_type === 'LG',
          )
          .map((t) => [t.id, t.section_type]),
      )

      const [overview, trajectory] = await Promise.all([
        service.getOverview(userId, {
          completedPreptests: page.completedPreptests,
          countStats: page.countStats,
          sectionSessions: page.sectionSessions,
          scoreRowsByRaw: byRaw,
          scoreRowsByScaled: byScaled,
        }),
        service.getTrajectory(userId, {
          completedPreptests: page.completedPreptests,
          scoreRowsByRaw: byRaw,
        }),
      ])

      const priorities = buildPrioritiesFromAggregates(page.priorityRows, page.goalScore)
      const mapHistoryPage = (rows: OverviewPageHistorySessionRow[]) => {
        const sessions = mapOverviewHistorySessions(rows, typeNameById, typeSectionById)
        return {
          sessions,
          total:
            sessions.length >= OVERVIEW_HISTORY_LIMIT
              ? sessions.length + 1
              : sessions.length,
          limit: OVERVIEW_HISTORY_LIMIT,
          offset: 0,
        }
      }

      return {
        view: 'overview' as const,
        overview,
        trajectory,
        priorities: priorities.priorities,
        drillSessions: mapHistoryPage(page.history.drill),
        sectionSessions: mapHistoryPage(page.history.section),
        prepTestSessions: mapHistoryPage(page.history.preptest),
      }
    },
  }
  return service
}

export type AnalyticsService = ReturnType<typeof createAnalyticsService>
