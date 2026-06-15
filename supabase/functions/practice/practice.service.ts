import { extractPrepTestQuestionRef } from '../_shared/prep-question-ref.ts'
import type {
  AnswerEventRow,
  DrillPoolQuestionRow,
  PracticeRepository,
  PracticeSessionKind,
  PracticeSessionRow,
  QuestionDetailRow,
} from './practice.repository.ts'
import {
  mapDrillQuestionRows,
  pickDrillQuestionIds,
  prepTestNumberFromModuleId,
  type DrillQuestionPayload,
} from './practice.mapper.ts'
import type { PrepTestDetailRow, PrepTestPoolRow } from './practice.repository.ts'

export class PracticeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PracticeValidationError'
  }
}

export class PracticeForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PracticeForbiddenError'
  }
}

function normalizeAnswer(value: string): string {
  return value.trim().toUpperCase().slice(0, 1)
}

function isValidKind(value: unknown): value is PracticeSessionKind {
  return value === 'PREPTEST' || value === 'SECTION' || value === 'DRILL'
}

function latestAnswerByQuestion(events: AnswerEventRow[]): Map<string, AnswerEventRow> {
  const byQuestion = new Map<string, AnswerEventRow>()
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]!
    if (!byQuestion.has(e.question_id)) {
      byQuestion.set(e.question_id, e)
    }
  }
  return byQuestion
}

function drillQuestionIdsFromMetadata(metadata: Record<string, unknown>): string[] {
  const raw = metadata.questionIds
  if (!Array.isArray(raw)) return []
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

function flaggedQuestionIdsFromMetadata(metadata: Record<string, unknown>): string[] {
  const raw = metadata.flaggedQuestionIds
  if (!Array.isArray(raw)) return []
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

function parseFlaggedQuestionIdsInput(value: unknown): string[] | null {
  if (value === undefined) return null
  if (!Array.isArray(value)) throw new PracticeValidationError('flaggedQuestionIds must be an array')
  const ids = value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
  return [...new Set(ids)]
}

function assertFlaggedQuestionIdsAllowed(
  session: PracticeSessionRow,
  flaggedQuestionIds: string[],
): void {
  if (session.kind !== 'DRILL' && session.kind !== 'SECTION') {
    throw new PracticeValidationError('flaggedQuestionIds is only supported for drill and section sessions')
  }
  const allowed = new Set(drillQuestionIdsFromMetadata(session.metadata))
  for (const id of flaggedQuestionIds) {
    if (!allowed.has(id)) {
      throw new PracticeValidationError('flaggedQuestionIds contains a question not in this session')
    }
  }
}

function assertQuestionAllowedForSession(
  session: PracticeSessionRow,
  question: QuestionDetailRow,
): void {
  const sec = question.admin_sections
  if (session.kind === 'PREPTEST') {
    if (!session.prep_test_id) throw new PracticeValidationError('PrepTest session missing prep_test_id')
    if (!sec || sec.prep_test_id !== session.prep_test_id) {
      throw new PracticeValidationError('Question does not belong to this PrepTest')
    }
  } else if (session.kind === 'SECTION') {
    if (!session.section_id) throw new PracticeValidationError('Section session missing section_id')
    if (question.section_id !== session.section_id) {
      throw new PracticeValidationError('Question does not belong to this section')
    }
  } else if (session.kind === 'DRILL') {
    const allowed = drillQuestionIdsFromMetadata(session.metadata)
    if (!allowed.includes(question.id)) {
      throw new PracticeValidationError('Question does not belong to this drill session')
    }
  }
}

function parseSectionType(value: unknown): 'LR' | 'RC' | null {
  return value === 'LR' || value === 'RC' ? value : null
}

function parseQuestionCount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(25, Math.floor(n))
}

function filterPoolByStatus(
  pool: DrillPoolQuestionRow[],
  status: unknown,
  answeredIds: Set<string>,
): DrillPoolQuestionRow[] {
  if (status !== 'fresh') return pool
  return pool.filter((q) => !answeredIds.has(q.id))
}

export type DrillSessionMetadata = {
  sectionType: 'LR' | 'RC'
  questionCount: number
  timing: string
  showAnswers: string
  selection?: string
  questionTypeId?: string | null
  tagLabel?: string | null
  difficulty?: string | null
  status?: string
  questionIds: string[]
  title?: string | null
  lessonId?: string | null
  source?: string | null
  flaggedQuestionIds?: string[]
}

export type DrillAnswerState = {
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
}

export type DrillSessionResponse = {
  session: PracticeSessionRow
  metadata: DrillSessionMetadata
  questions: DrillQuestionPayload[]
  answers: DrillAnswerState[]
  drillLabel: string | null
}

export type SectionSessionMetadata = {
  sectionType: 'LR' | 'RC'
  timing: string
  showAnswers: string
  questionIds: string[]
  prepTestTitle?: string | null
  sectionTitle?: string | null
  answeredQuestionIds?: string[]
  flaggedQuestionIds?: string[]
}

export type SectionPoolItem = {
  id: string
  sectionId: string | null
  sectionNumber: number | null
  sectionType: 'LR' | 'RC'
  title: string | null
  moduleId: string | null
  prepTestId: string
  prepTestTitle: string | null
  questionCount: number
  timeMinutes: number
}

export type SectionPoolTypeCounts = {
  all: number
  lr: number
  rc: number
}

export type SectionPoolListResult = {
  sections: SectionPoolItem[]
  total: number
  page: number
  pageSize: number
  sectionTypeCounts: SectionPoolTypeCounts
}

export type SectionSessionResponse = {
  session: PracticeSessionRow
  metadata: SectionSessionMetadata
  section: SectionPoolItem
  questions: DrillQuestionPayload[]
  answers: DrillAnswerState[]
  sessionLabel: string | null
}

function sectionTypeForPool(value: string | null | undefined): 'LR' | 'RC' | null {
  return value === 'LR' || value === 'RC' ? value : null
}

function defaultTimeMinutes(sectionType: 'LR' | 'RC'): number {
  return sectionType === 'LR' ? 35 : 35
}

export type PrepTestPracticeStatus = 'fresh' | 'in_progress' | 'completed'

export type PrepTestPoolBlindReviewStatus = 'eligible' | 'in_progress'

export type PrepTestPoolAttempt = {
  sessionId: string
  completedAt: string
  scaledScore: number | null
  blindReviewScaledScore: number | null
  attemptNumber: number
}

export type PrepTestPoolItem = {
  id: string
  moduleId: string
  title: string | null
  prepTestNumber: string | null
  questionCount: number
  sectionCount: number
  practiceableSectionCount: number
  timeMinutes: number
  status: PrepTestPracticeStatus
  scaledScore: number | null
  blindReviewScaledScore: number | null
  blindReviewStatus: PrepTestPoolBlindReviewStatus | null
  completedAt: string | null
  attempts: PrepTestPoolAttempt[]
  openPrepTestSessionId: string | null
}

export type PrepTestPoolStatusCounts = {
  all: number
  fresh: number
  in_progress: number
  completed: number
}

export type PrepTestPoolListResult = {
  prepTests: PrepTestPoolItem[]
  total: number
  page: number
  pageSize: number
  statusCounts: PrepTestPoolStatusCounts
}

export type PrepTestDetailSection = {
  id: string
  sectionId: string | null
  sectionNumber: number | null
  sectionType: 'LR' | 'RC' | 'LG'
  title: string | null
  questionCount: number
  timeMinutes: number
  practiceable: boolean
  unlocked: boolean
  answeredCount: number
  completed: boolean
  activeSectionSessionId: string | null
}

export type PrepTestSessionMetadata = {
  timing: string
  format: string
  sectionIds: string[]
  prepTestTitle?: string | null
  answeredQuestionIds?: string[]
  blindReviewActive?: boolean
  blindReviewSkipped?: boolean
}

export type PrepTestDetailResponse = {
  prepTest: {
    id: string
    moduleId: string
    title: string | null
    prepTestNumber: string | null
    label: string
    questionCount: number
    totalMinutes: number
    sectionCount: number
    practiceableSectionCount: number
  }
  sections: PrepTestDetailSection[]
  prepTestSession: PracticeSessionRow | null
  status: PrepTestPracticeStatus
  allPracticeableSectionsComplete: boolean
  timingOptions: { id: string; label: string }[]
  formatOptions: { id: string; label: string }[]
  defaultTimingId: string
  defaultFormatId: string
}

export type BlindReviewStatus = 'eligible' | 'in_progress' | 'completed'

export type BlindReviewPoolItem = {
  id: string
  moduleId: string
  title: string | null
  prepTestNumber: string | null
  label: string
  questionCount: number
  status: BlindReviewStatus
  scaledScore: number | null
  blindReviewScaledScore: number | null
  completedAt: string | null
  blindReviewCompletedAt: string | null
  prepTestSessionId: string | null
  attempts: PrepTestPoolAttempt[]
}

export type BlindReviewPoolStatusCounts = {
  all: number
  eligible: number
  in_progress: number
  completed: number
}

export type BlindReviewPoolListResult = {
  prepTests: BlindReviewPoolItem[]
  total: number
  page: number
  pageSize: number
  statusCounts: BlindReviewPoolStatusCounts
}

export type BlindReviewDetailSection = PrepTestDetailSection & {
  sectionSessionId: string | null
}

export type BlindReviewDetailResponse = {
  prepTest: PrepTestDetailResponse['prepTest']
  sections: BlindReviewDetailSection[]
  blindReview: {
    status: BlindReviewStatus
    scaledScore: number | null
    blindReviewScaledScore: number | null
    blindReviewPercentile: number | null
    prepTestSessionId: string
  }
}

function practiceableSectionsFromRow(
  sections: Array<{ id: string; sectionType: 'LR' | 'RC' | 'LG'; questionCount: number }>,
): Array<{ id: string; sectionType: 'LR' | 'RC'; questionCount: number }> {
  return sections
    .filter((s) => (s.sectionType === 'LR' || s.sectionType === 'RC') && s.questionCount > 0)
    .map((s) => ({ id: s.id, sectionType: s.sectionType as 'LR' | 'RC', questionCount: s.questionCount }))
}

function prepTestLabel(moduleId: string, title: string | null, prepTestNumber: string | null): string {
  if (prepTestNumber) return `PT ${prepTestNumber}`
  return title?.trim() || moduleId
}

function answeredIdsFromMetadata(metadata: Record<string, unknown>): number {
  const ids = metadata.answeredQuestionIds
  return Array.isArray(ids) ? ids.length : 0
}

function questionIdsFromMetadata(metadata: Record<string, unknown>): number {
  const ids = metadata.questionIds
  return Array.isArray(ids) ? ids.length : 0
}

function prepTestSessionsFrom(sessions: PracticeSessionRow[]): PracticeSessionRow[] {
  return sessions.filter((s) => s.kind === 'PREPTEST')
}

function sortedPrepTestSessions(sessions: PracticeSessionRow[]): PracticeSessionRow[] {
  return prepTestSessionsFrom(sessions).sort(
    (a, b) => Date.parse(b.started_at) - Date.parse(a.started_at),
  )
}

/** Newest completed PrepTest session still awaiting blind review, or null if the latest attempt is fully done. */
function prepTestSessionAwaitingBlindReview(sessions: PracticeSessionRow[]): PracticeSessionRow | null {
  const prepTests = sortedPrepTestSessions(sessions)
  const newest = prepTests[0]
  if (newest?.completed_at && isPrepTestFullyComplete(newest)) {
    return null
  }
  return prepTests.find((s) => s.completed_at && !isPrepTestFullyComplete(s)) ?? null
}

function isPrepTestFullyComplete(session: PracticeSessionRow): boolean {
  if (!session.completed_at) return false
  if (session.blind_review_completed_at) return true
  return session.metadata.blindReviewSkipped === true
}

function prepTestBlindReviewStatus(
  session: PracticeSessionRow,
): PrepTestPoolBlindReviewStatus | null {
  if (!session.completed_at || isPrepTestFullyComplete(session)) return null
  if (session.metadata.blindReviewActive === true) return 'in_progress'
  return 'eligible'
}

function poolAttemptsFromSessions(sessions: PracticeSessionRow[]): PrepTestPoolAttempt[] {
  const completed = prepTestSessionsFrom(sessions)
    .filter((s) => s.completed_at)
    .sort((a, b) => Date.parse(b.completed_at!) - Date.parse(a.completed_at!))
  const total = completed.length
  return completed.map((s, idx) => ({
    sessionId: s.id,
    completedAt: s.completed_at!,
    scaledScore: s.scaled_score,
    blindReviewScaledScore: s.blind_review_scaled_score,
    attemptNumber: total - idx,
  }))
}

function derivePrepTestStatus(
  practiceableSectionIds: string[],
  sessions: PracticeSessionRow[],
): {
  status: PrepTestPracticeStatus
  scaledScore: number | null
  blindReviewScaledScore: number | null
  blindReviewStatus: PrepTestPoolBlindReviewStatus | null
  completedAt: string | null
  openPrepTestSessionId: string | null
} {
  const prepTests = sortedPrepTestSessions(sessions)
  const newest = prepTests[0] ?? null

  if (newest?.completed_at && isPrepTestFullyComplete(newest)) {
    return {
      status: 'completed',
      scaledScore: newest.scaled_score,
      blindReviewScaledScore: newest.blind_review_scaled_score,
      blindReviewStatus: null,
      completedAt: newest.completed_at,
      openPrepTestSessionId: newest.id,
    }
  }

  const newestOpen = prepTests.find((s) => !s.completed_at) ?? null
  const awaitingBlindReview = prepTests.find((s) => s.completed_at && !isPrepTestFullyComplete(s)) ?? null

  if (awaitingBlindReview && newestOpen) {
    if (Date.parse(awaitingBlindReview.started_at) < Date.parse(newestOpen.started_at)) {
      return {
        status: 'in_progress',
        scaledScore: awaitingBlindReview.scaled_score,
        blindReviewScaledScore: awaitingBlindReview.blind_review_scaled_score,
        blindReviewStatus: prepTestBlindReviewStatus(awaitingBlindReview),
        completedAt: null,
        openPrepTestSessionId: awaitingBlindReview.id,
      }
    }
    return {
      status: 'in_progress',
      scaledScore: null,
      blindReviewScaledScore: null,
      blindReviewStatus: null,
      completedAt: null,
      openPrepTestSessionId: newestOpen.id,
    }
  }

  if (awaitingBlindReview) {
    return {
      status: 'in_progress',
      scaledScore: awaitingBlindReview.scaled_score,
      blindReviewScaledScore: awaitingBlindReview.blind_review_scaled_score,
      blindReviewStatus: prepTestBlindReviewStatus(awaitingBlindReview),
      completedAt: null,
      openPrepTestSessionId: awaitingBlindReview.id,
    }
  }

  if (newestOpen) {
    return {
      status: 'in_progress',
      scaledScore: null,
      blindReviewScaledScore: null,
      blindReviewStatus: null,
      completedAt: null,
      openPrepTestSessionId: newestOpen.id,
    }
  }

  const sectionSessions = sessions.filter((s) => s.kind === 'SECTION' && s.section_id)
  const completedSectionIds = new Set(
    sectionSessions.filter((s) => s.completed_at && s.section_id).map((s) => s.section_id!),
  )

  const allSectionsDone =
    practiceableSectionIds.length > 0 &&
    practiceableSectionIds.every((id) => completedSectionIds.has(id))

  if (allSectionsDone) {
    const lastCompleted = sectionSessions.find((s) => s.completed_at)
    return {
      status: 'completed',
      scaledScore: lastCompleted?.scaled_score ?? null,
      blindReviewScaledScore: null,
      blindReviewStatus: null,
      completedAt: lastCompleted?.completed_at ?? null,
      openPrepTestSessionId: null,
    }
  }

  const hasSectionActivity = sectionSessions.length > 0

  if (hasSectionActivity) {
    return {
      status: 'in_progress',
      scaledScore: null,
      blindReviewScaledScore: null,
      blindReviewStatus: null,
      completedAt: null,
      openPrepTestSessionId: null,
    }
  }

  return {
    status: 'fresh',
    scaledScore: null,
    blindReviewScaledScore: null,
    blindReviewStatus: null,
    completedAt: null,
    openPrepTestSessionId: null,
  }
}

function sectionSessionsForPrepTestAttempt(
  sessions: PracticeSessionRow[],
  prepTestSession: PracticeSessionRow | null,
  nextPrepTestSession: PracticeSessionRow | null = null,
): PracticeSessionRow[] {
  const sectionSessions = sessions.filter((s) => s.kind === 'SECTION' && s.section_id)
  if (!prepTestSession?.started_at) return sectionSessions

  const attemptStartedAtMs = Date.parse(prepTestSession.started_at)
  if (!Number.isFinite(attemptStartedAtMs)) return sectionSessions

  const nextStartedAtMs = nextPrepTestSession?.started_at
    ? Date.parse(nextPrepTestSession.started_at)
    : null

  return sectionSessions.filter((s) => {
    const startedAtMs = Date.parse(s.started_at)
    if (!Number.isFinite(startedAtMs) || startedAtMs < attemptStartedAtMs) return false
    if (
      nextStartedAtMs != null &&
      Number.isFinite(nextStartedAtMs) &&
      startedAtMs >= nextStartedAtMs
    ) {
      return false
    }
    return true
  })
}

function latestSectionSessionPerId(
  sectionSessions: PracticeSessionRow[],
): Map<string, PracticeSessionRow> {
  const bySectionId = new Map<string, PracticeSessionRow>()
  for (const s of sectionSessions) {
    if (!s.section_id) continue
    const existing = bySectionId.get(s.section_id)
    if (!existing || Date.parse(s.started_at) > Date.parse(existing.started_at)) {
      bySectionId.set(s.section_id, s)
    }
  }
  return bySectionId
}

function rawScoreFromPrepTestAttempt(
  sessions: PracticeSessionRow[],
  prepTestSession: PracticeSessionRow,
  nextPrepTestSession: PracticeSessionRow | null,
  practiceableSectionIds: string[],
): number | null {
  const attemptSections = sectionSessionsForPrepTestAttempt(
    sessions,
    prepTestSession,
    nextPrepTestSession,
  ).filter(
    (s) => s.completed_at && s.section_id && practiceableSectionIds.includes(s.section_id),
  )
  const bySectionId = latestSectionSessionPerId(attemptSections)
  if (bySectionId.size === 0) return null

  let raw = 0
  for (const s of bySectionId.values()) {
    if (typeof s.raw_score !== 'number') return null
    raw += s.raw_score
  }
  return raw
}

async function enrichPoolItemAttemptScores(
  repository: PracticeRepository,
  prepTestId: string,
  practiceableSectionIds: string[],
  sessions: PracticeSessionRow[],
  item: PrepTestPoolItem,
): Promise<PrepTestPoolItem> {
  const completedPrepTests = sortedPrepTestSessions(sessions).filter((s) => s.completed_at)
  let attempts = item.attempts

  if (attempts.length === 0 && item.status === 'completed' && item.completedAt) {
    const prepSession = completedPrepTests[0]
    if (prepSession) {
      attempts = [
        {
          sessionId: prepSession.id,
          completedAt: prepSession.completed_at!,
          scaledScore: prepSession.scaled_score,
          blindReviewScaledScore: prepSession.blind_review_scaled_score,
          attemptNumber: 1,
        },
      ]
    } else {
      attempts = [
        {
          sessionId: item.openPrepTestSessionId ?? item.id,
          completedAt: item.completedAt,
          scaledScore: item.scaledScore,
          blindReviewScaledScore: item.blindReviewScaledScore,
          attemptNumber: 1,
        },
      ]
    }
  }

  const enrichedAttempts = await Promise.all(
    attempts.map(async (attempt) => {
      const prepSession = sessions.find((s) => s.id === attempt.sessionId && s.kind === 'PREPTEST')
      if (!prepSession?.completed_at) return attempt

      let scaledScore = attempt.scaledScore
      let blindReviewScaledScore = attempt.blindReviewScaledScore

      const nextPrepTest =
        completedPrepTests.find(
          (p) => Date.parse(p.started_at) > Date.parse(prepSession.started_at),
        ) ?? null

      if (scaledScore == null) {
        let raw = prepSession.raw_score
        if (raw == null) {
          raw = rawScoreFromPrepTestAttempt(
            sessions,
            prepSession,
            nextPrepTest,
            practiceableSectionIds,
          )
        }
        if (raw != null) {
          const scoreRow = await repository.getScoreRowForRaw(prepTestId, raw)
          scaledScore = scoreRow?.scaled_score ?? null
        }
      }

      if (blindReviewScaledScore == null && prepSession.blind_review_raw_score != null) {
        const scoreRow = await repository.getScoreRowForRaw(
          prepTestId,
          prepSession.blind_review_raw_score,
        )
        blindReviewScaledScore = scoreRow?.scaled_score ?? null
      } else if (blindReviewScaledScore == null && prepSession.blind_review_scaled_score != null) {
        blindReviewScaledScore = prepSession.blind_review_scaled_score
      }

      return { ...attempt, scaledScore, blindReviewScaledScore }
    }),
  )

  const newestAttempt = enrichedAttempts[0]
  const scaledScore = item.scaledScore ?? newestAttempt?.scaledScore ?? null
  const blindReviewScaledScore =
    item.blindReviewScaledScore ?? newestAttempt?.blindReviewScaledScore ?? null

  return { ...item, attempts: enrichedAttempts, scaledScore, blindReviewScaledScore }
}

function buildPrepTestDetail(
  row: PrepTestDetailRow,
  sessions: PracticeSessionRow[],
  prepTestSession: PracticeSessionRow | null,
): PrepTestDetailResponse {
  const practiceable = practiceableSectionsFromRow(row.sections)
  const practiceableIds = practiceable.map((s) => s.id)
  const { status } = derivePrepTestStatus(practiceableIds, sessions)

  const attemptSectionSessions = sectionSessionsForPrepTestAttempt(sessions, prepTestSession)
  const sectionSessionsBySectionId = new Map<string, PracticeSessionRow[]>()
  for (const s of attemptSectionSessions) {
    const list = sectionSessionsBySectionId.get(s.section_id!) ?? []
    list.push(s)
    sectionSessionsBySectionId.set(s.section_id!, list)
  }

  const sections: PrepTestDetailSection[] = row.sections.map((sec) => {
    const isPracticeable = sec.sectionType === 'LR' || sec.sectionType === 'RC'
    const secSessions = sectionSessionsBySectionId.get(sec.id) ?? []
    const latest = secSessions[0] ?? null
    const answeredCount = latest ? answeredIdsFromMetadata(latest.metadata) : 0
    const totalQs = latest ? questionIdsFromMetadata(latest.metadata) : sec.questionCount
    const completed = Boolean(latest?.completed_at)

    return {
      id: sec.id,
      sectionId: sec.sectionId,
      sectionNumber: sec.sectionNumber,
      sectionType: sec.sectionType,
      title: sec.title,
      questionCount: sec.questionCount,
      timeMinutes: 35,
      practiceable: isPracticeable && sec.questionCount > 0,
      unlocked: isPracticeable && sec.questionCount > 0,
      answeredCount,
      completed,
      activeSectionSessionId: latest && !latest.completed_at ? latest.id : null,
    }
  })

  const questionCount = practiceable.reduce((sum, s) => sum + s.questionCount, 0)
  const prepTestNumber = prepTestNumberFromModuleId(row.moduleId)
  const label = prepTestLabel(row.moduleId, row.title, prepTestNumber)
  const allPracticeableSectionsComplete = practiceableIds.every((id) => {
    const secSessions = sectionSessionsBySectionId.get(id) ?? []
    return secSessions.some((s) => s.completed_at)
  })

  const meta = prepTestSession?.metadata ?? {}
  const defaultTimingId = typeof meta.timing === 'string' ? meta.timing : 'standard'
  const defaultFormatId = typeof meta.format === 'string' ? meta.format : 'four'

  return {
    prepTest: {
      id: row.id,
      moduleId: row.moduleId,
      title: row.title,
      prepTestNumber,
      label,
      questionCount,
      totalMinutes: practiceable.length * 35,
      sectionCount: row.sections.length,
      practiceableSectionCount: practiceable.length,
    },
    sections,
    prepTestSession,
    status,
    allPracticeableSectionsComplete,
    timingOptions: [
      { id: 'unlimited', label: 'Unlimited' },
      { id: 'standard', label: 'Standard (35 min / section)' },
      { id: 'strict', label: 'Strict official timing' },
    ],
    formatOptions: [
      { id: 'four', label: '4 scored sections' },
      { id: 'exp', label: 'With experimental' },
    ],
    defaultTimingId,
    defaultFormatId,
  }
}

function blindReviewStateFromSessions(sessions: PracticeSessionRow[]): {
  status: BlindReviewStatus | null
  prepTestSession: PracticeSessionRow | null
} {
  const prepTests = sortedPrepTestSessions(sessions)
  const newest = prepTests[0]
  if (newest?.completed_at && isPrepTestFullyComplete(newest)) {
    if (newest.blind_review_completed_at) {
      return { status: 'completed', prepTestSession: newest }
    }
    return { status: null, prepTestSession: null }
  }

  const awaitingBlindReview = prepTestSessionAwaitingBlindReview(sessions)
  if (!awaitingBlindReview) {
    return { status: null, prepTestSession: null }
  }
  if (awaitingBlindReview.metadata.blindReviewActive === true) {
    return { status: 'in_progress', prepTestSession: awaitingBlindReview }
  }
  return { status: 'eligible', prepTestSession: awaitingBlindReview }
}

function blindReviewPoolItemFromRow(
  row: PrepTestPoolRow,
  sessions: PracticeSessionRow[],
): BlindReviewPoolItem | null {
  const practiceable = practiceableSectionsFromRow(row.sections)
  if (practiceable.length === 0) return null

  const { status, prepTestSession } = blindReviewStateFromSessions(sessions)
  if (!status || !prepTestSession) return null

  const questionCount = practiceable.reduce((sum, s) => sum + s.questionCount, 0)
  const prepTestNumber = prepTestNumberFromModuleId(row.moduleId)
  const label = prepTestLabel(row.moduleId, row.title, prepTestNumber)

  return {
    id: row.id,
    moduleId: row.moduleId,
    title: row.title,
    prepTestNumber,
    label,
    questionCount,
    status,
    scaledScore: prepTestSession.scaled_score,
    blindReviewScaledScore: prepTestSession.blind_review_scaled_score,
    completedAt: prepTestSession.completed_at,
    blindReviewCompletedAt: prepTestSession.blind_review_completed_at,
    attempts: poolAttemptsFromSessions(sessions),
    prepTestSessionId: prepTestSession.id,
  }
}

function buildBlindReviewDetail(
  row: PrepTestDetailRow,
  sessions: PracticeSessionRow[],
  prepTestSession: PracticeSessionRow,
): BlindReviewDetailResponse {
  const practiceable = practiceableSectionsFromRow(row.sections)
  const { status } = blindReviewStateFromSessions(sessions)
  if (!status) {
    throw new PracticeValidationError('PrepTest is not eligible for blind review')
  }

  const sectionSessionsBySectionId = new Map<string, PracticeSessionRow[]>()
  for (const s of sessions.filter((x) => x.kind === 'SECTION' && x.section_id)) {
    const list = sectionSessionsBySectionId.get(s.section_id!) ?? []
    list.push(s)
    sectionSessionsBySectionId.set(s.section_id!, list)
  }

  const sections: BlindReviewDetailSection[] = row.sections.map((sec) => {
    const isPracticeable = sec.sectionType === 'LR' || sec.sectionType === 'RC'
    const secSessions = sectionSessionsBySectionId.get(sec.id) ?? []
    const latest = secSessions[0] ?? null
    const answeredCount = latest ? answeredIdsFromMetadata(latest.metadata) : 0
    const completed = Boolean(latest?.completed_at)

    return {
      id: sec.id,
      sectionId: sec.sectionId,
      sectionNumber: sec.sectionNumber,
      sectionType: sec.sectionType,
      title: sec.title,
      questionCount: sec.questionCount,
      timeMinutes: 35,
      practiceable: isPracticeable && sec.questionCount > 0,
      unlocked: isPracticeable && sec.questionCount > 0,
      answeredCount,
      completed,
      activeSectionSessionId: latest && !latest.completed_at ? latest.id : null,
      sectionSessionId: latest?.completed_at ? latest.id : null,
    }
  })

  const questionCount = practiceable.reduce((sum, s) => sum + s.questionCount, 0)
  const prepTestNumber = prepTestNumberFromModuleId(row.moduleId)
  const label = prepTestLabel(row.moduleId, row.title, prepTestNumber)

  return {
    prepTest: {
      id: row.id,
      moduleId: row.moduleId,
      title: row.title,
      prepTestNumber,
      label,
      questionCount,
      totalMinutes: practiceable.length * 35,
      sectionCount: row.sections.length,
      practiceableSectionCount: practiceable.length,
    },
    sections,
    blindReview: {
      status,
      scaledScore: prepTestSession.scaled_score,
      blindReviewScaledScore: prepTestSession.blind_review_scaled_score,
      blindReviewPercentile: prepTestSession.blind_review_percentile,
      prepTestSessionId: prepTestSession.id,
    },
  }
}

function prepTestNumberSortValue(item: PrepTestPoolItem): number {
  const n = item.prepTestNumber ? Number.parseInt(item.prepTestNumber, 10) : NaN
  if (Number.isFinite(n)) return n
  const fromModule = /^LSAC(\d+)$/i.exec(item.moduleId)?.[1]
  return fromModule ? Number.parseInt(fromModule, 10) : 0
}

function blindReviewPoolSortValue(item: BlindReviewPoolItem): number {
  const n = item.prepTestNumber ? Number.parseInt(item.prepTestNumber, 10) : NaN
  if (Number.isFinite(n)) return n
  const fromModule = /^LSAC(\d+)$/i.exec(item.moduleId)?.[1]
  return fromModule ? Number.parseInt(fromModule, 10) : 0
}

function sectionNumberSortValue(item: SectionPoolItem): number {
  const fromModule = item.moduleId ? /^LSAC(\d+)$/i.exec(item.moduleId)?.[1] : undefined
  const moduleNum = fromModule ? Number.parseInt(fromModule, 10) : 0
  const sectionNum = item.sectionNumber ?? 0
  return moduleNum * 1000 + sectionNum
}

function mapSectionPoolRow(row: {
  id: string
  sectionId: string | null
  sectionNumber: number | null
  sectionType: string
  title: string | null
  moduleId: string | null
  prepTestId: string
  prepTestTitle: string | null
  questionCount: number
}): SectionPoolItem | null {
  const st = sectionTypeForPool(row.sectionType)
  if (!st) return null
  return {
    id: row.id,
    sectionId: row.sectionId,
    sectionNumber: row.sectionNumber,
    sectionType: st,
    title: row.title,
    moduleId: row.moduleId,
    prepTestId: row.prepTestId,
    prepTestTitle: row.prepTestTitle,
    questionCount: row.questionCount,
    timeMinutes: defaultTimeMinutes(st),
  }
}

function groupSessionsByPrepTestId(sessions: PracticeSessionRow[]): Map<string, PracticeSessionRow[]> {
  const map = new Map<string, PracticeSessionRow[]>()
  for (const s of sessions) {
    const prepTestId = s.prep_test_id
    if (!prepTestId) continue
    const list = map.get(prepTestId) ?? []
    list.push(s)
    map.set(prepTestId, list)
  }
  return map
}

function poolItemFromRow(row: PrepTestPoolRow, sessions: PracticeSessionRow[]): PrepTestPoolItem {
  const practiceable = practiceableSectionsFromRow(row.sections)
  const practiceableIds = practiceable.map((s) => s.id)
  const {
    status,
    scaledScore,
    blindReviewScaledScore,
    blindReviewStatus,
    completedAt,
    openPrepTestSessionId,
  } = derivePrepTestStatus(practiceableIds, sessions)
  const questionCount = practiceable.reduce((sum, s) => sum + s.questionCount, 0)
  const prepTestNumber = prepTestNumberFromModuleId(row.moduleId)

  return {
    id: row.id,
    moduleId: row.moduleId,
    title: row.title,
    prepTestNumber,
    questionCount,
    sectionCount: row.sections.length,
    practiceableSectionCount: practiceable.length,
    timeMinutes: practiceable.length * 35,
    status,
    scaledScore,
    blindReviewScaledScore,
    blindReviewStatus,
    completedAt,
    attempts: poolAttemptsFromSessions(sessions),
    openPrepTestSessionId,
  }
}

export function createPracticeService(deps: { repository: PracticeRepository }) {
  return {
    async createSession(
      userId: string,
      body: {
        kind: unknown
        prepTestId?: unknown
        sectionId?: unknown
        metadata?: unknown
      },
    ): Promise<{ session: PracticeSessionRow }> {
      if (!isValidKind(body.kind)) {
        throw new PracticeValidationError('kind must be PREPTEST, SECTION, or DRILL')
      }
      const kind = body.kind
      const prepTestId = typeof body.prepTestId === 'string' && body.prepTestId ? body.prepTestId : null
      const sectionId = typeof body.sectionId === 'string' && body.sectionId ? body.sectionId : null
      const metadata =
        body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
          ? (body.metadata as Record<string, unknown>)
          : {}

      if (kind === 'PREPTEST') {
        if (!prepTestId) throw new PracticeValidationError('prepTestId is required for PREPTEST')
        const ok = await deps.repository.getPrepTestExists(prepTestId)
        if (!ok) throw new PracticeValidationError('prepTestId not found')
        const session = await deps.repository.insertSession({
          userId,
          kind,
          prepTestId,
          sectionId: null,
          metadata,
        })
        return { session }
      }

      if (kind === 'SECTION') {
        if (!sectionId) throw new PracticeValidationError('sectionId is required for SECTION')
        const secOk = await deps.repository.getSectionExists(sectionId)
        if (!secOk) throw new PracticeValidationError('sectionId not found')
        const derivedPrepTestId = await deps.repository.getSectionPrepTestId(sectionId)
        const session = await deps.repository.insertSession({
          userId,
          kind,
          prepTestId: derivedPrepTestId,
          sectionId,
          metadata,
        })
        return { session }
      }

      const session = await deps.repository.insertSession({
        userId,
        kind: 'DRILL',
        prepTestId,
        sectionId,
        metadata,
      })
      return { session }
    },

    async submitAnswer(
      userId: string,
      body: { sessionId?: unknown; questionId?: unknown; selectedAnswer?: unknown; blindReview?: unknown },
    ): Promise<{ event: AnswerEventRow }> {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      const questionId = typeof body.questionId === 'string' ? body.questionId : ''
      const selectedRaw = typeof body.selectedAnswer === 'string' ? body.selectedAnswer : ''
      if (!sessionId) throw new PracticeValidationError('sessionId is required')
      if (!questionId) throw new PracticeValidationError('questionId is required')
      if (!selectedRaw.trim()) throw new PracticeValidationError('selectedAnswer is required')

      const blindReview = body.blindReview === true

      const session = await deps.repository.getSessionById(sessionId, userId)
      if (!session) throw new PracticeForbiddenError('Session not found')

      if (session.completed_at && !blindReview) {
        throw new PracticeValidationError('Cannot submit answers to a completed session')
      }

      if (blindReview) {
        if (session.kind !== 'SECTION' || !session.prep_test_id) {
          throw new PracticeValidationError('Blind review answers require a section session tied to a PrepTest')
        }
        const ptSessions = await deps.repository.listUserSessionsForPrepTest(userId, session.prep_test_id)
        const prepTestSession = prepTestSessionAwaitingBlindReview(ptSessions)
        if (!prepTestSession) {
          const newest = sortedPrepTestSessions(ptSessions)[0]
          if (newest?.blind_review_completed_at) {
            throw new PracticeValidationError('Blind review is already completed for this PrepTest')
          }
          throw new PracticeValidationError('Complete the PrepTest before blind review')
        }
        const meta = prepTestSession.metadata
        if (meta.blindReviewActive !== true) {
          throw new PracticeValidationError('Start blind review for this PrepTest first')
        }
      }

      const question = await deps.repository.getQuestionDetail(questionId)
      if (!question) throw new PracticeValidationError('questionId not found')

      assertQuestionAllowedForSession(session, question)

      const expected = question.correct_answer ? normalizeAnswer(question.correct_answer) : ''
      const selected = normalizeAnswer(selectedRaw)
      const isCorrect = Boolean(expected) && selected === expected

      const sectionType = question.admin_sections?.section_type ?? null

      const event = await deps.repository.insertAnswerEvent({
        userId,
        practiceSessionId: sessionId,
        questionId,
        selectedAnswer: selected,
        isCorrect,
        questionTypeId: question.question_type_id,
        sectionType,
        difficulty: question.difficulty,
        sessionKind: session.kind,
      })

      if (session.kind === 'DRILL' || session.kind === 'SECTION') {
        const existing = Array.isArray(session.metadata.answeredQuestionIds)
          ? (session.metadata.answeredQuestionIds as string[])
          : []
        if (!existing.includes(questionId)) {
          const nextMeta = {
            ...session.metadata,
            answeredQuestionIds: [...existing, questionId],
          }
          await deps.repository.updateSession(sessionId, userId, { metadata: nextMeta })
        }
      }

      return { event }
    },

    async completeSession(userId: string, body: { sessionId?: unknown }): Promise<{ session: PracticeSessionRow }> {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!sessionId) throw new PracticeValidationError('sessionId is required')

      const session = await deps.repository.getSessionById(sessionId, userId)
      if (!session) throw new PracticeForbiddenError('Session not found')
      if (session.completed_at) {
        return { session }
      }

      const now = new Date().toISOString()
      const events = await deps.repository.listAnswerEventsForSession(sessionId, userId)
      const latest = latestAnswerByQuestion(events)
      let correct = 0
      for (const e of latest.values()) {
        if (e.is_correct) correct += 1
      }
      const rawScore = correct
      let scaledScore: number | null = null
      let percentile: number | null = null

      if (session.kind === 'PREPTEST' && session.prep_test_id) {
        const scoreRow = await deps.repository.getScoreRowForRaw(session.prep_test_id, rawScore)
        if (scoreRow) {
          scaledScore = scoreRow.scaled_score
          percentile = scoreRow.percentile
        }
      }

      const sessionRow = await deps.repository.updateSession(sessionId, userId, {
        completed_at: now,
        raw_score: rawScore,
        scaled_score: scaledScore,
        percentile,
      })
      return { session: sessionRow }
    },

    async updateSession(
      userId: string,
      body: {
        sessionId?: unknown
        bookmarked?: unknown
        excluded?: unknown
        flaggedQuestionIds?: unknown
      },
    ): Promise<{ session: PracticeSessionRow }> {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!sessionId) throw new PracticeValidationError('sessionId is required')

      const session = await deps.repository.getSessionById(sessionId, userId)
      if (!session) throw new PracticeForbiddenError('Session not found')

      const patch: {
        bookmarked?: boolean
        excluded?: boolean
        metadata?: Record<string, unknown>
      } = {}
      if (typeof body.bookmarked === 'boolean') patch.bookmarked = body.bookmarked
      if (typeof body.excluded === 'boolean') patch.excluded = body.excluded

      const flaggedInput = parseFlaggedQuestionIdsInput(body.flaggedQuestionIds)
      if (flaggedInput !== null) {
        assertFlaggedQuestionIdsAllowed(session, flaggedInput)
        patch.metadata = {
          ...session.metadata,
          flaggedQuestionIds: flaggedInput,
        }
      }

      if (Object.keys(patch).length === 0) {
        throw new PracticeValidationError('bookmarked, excluded, or flaggedQuestionIds must be provided')
      }

      const sessionRow = await deps.repository.updateSession(sessionId, userId, patch)
      return { session: sessionRow }
    },

    async getDrillPoolStats(
      userId: string,
      body: {
        sectionType?: unknown
        questionTypeId?: unknown
        difficulty?: unknown
        status?: unknown
      },
    ): Promise<{ selectedCount: number; totalCount: number }> {
      const sectionType = parseSectionType(body.sectionType)
      if (!sectionType) throw new PracticeValidationError('sectionType must be LR or RC')

      const questionTypeId =
        typeof body.questionTypeId === 'string' && body.questionTypeId ? body.questionTypeId : null
      const difficulty =
        body.difficulty === 'easy' || body.difficulty === 'hard' || body.difficulty === 'adaptive'
          ? body.difficulty
          : null

      const totalPool = await deps.repository.listDrillPoolQuestions({
        sectionType,
        questionTypeId,
        difficulty: difficulty === 'adaptive' ? null : difficulty,
      })

      const answeredIds = new Set(await deps.repository.listUserAnsweredQuestionIds(userId))
      const selectedPool = filterPoolByStatus(totalPool, body.status ?? 'fresh', answeredIds)

      return {
        selectedCount: selectedPool.length,
        totalCount: totalPool.length,
      }
    },

    async startDrill(
      userId: string,
      body: {
        sectionType?: unknown
        questionCount?: unknown
        timing?: unknown
        showAnswers?: unknown
        selection?: unknown
        questionTypeId?: unknown
        tagLabel?: unknown
        difficulty?: unknown
        status?: unknown
        title?: unknown
      },
    ): Promise<DrillSessionResponse> {
      const sectionType = parseSectionType(body.sectionType)
      if (!sectionType) throw new PracticeValidationError('sectionType must be LR or RC')

      const questionCount = parseQuestionCount(body.questionCount)
      const timing = typeof body.timing === 'string' ? body.timing : 'unlimited'
      const showAnswers = typeof body.showAnswers === 'string' ? body.showAnswers : 'end'
      const selection = typeof body.selection === 'string' ? body.selection : 'auto'
      const questionTypeId =
        typeof body.questionTypeId === 'string' && body.questionTypeId ? body.questionTypeId : null
      const tagLabel = typeof body.tagLabel === 'string' ? body.tagLabel : null
      const title = typeof body.title === 'string' ? body.title : tagLabel
      const difficulty =
        body.difficulty === 'easy' || body.difficulty === 'hard' || body.difficulty === 'adaptive'
          ? body.difficulty
          : 'adaptive'
      const status = typeof body.status === 'string' ? body.status : 'fresh'

      const pool = await deps.repository.listDrillPoolQuestions({
        sectionType,
        questionTypeId,
        difficulty: difficulty === 'adaptive' ? null : difficulty,
      })

      const answeredIds = new Set(await deps.repository.listUserAnsweredQuestionIds(userId))
      const filtered = filterPoolByStatus(pool, status, answeredIds)

      const questionIds = pickDrillQuestionIds(filtered, sectionType, questionCount)
      if (questionIds.length === 0) {
        throw new PracticeValidationError('No questions available for this drill configuration')
      }

      const metadata: DrillSessionMetadata = {
        sectionType,
        questionCount: questionIds.length,
        timing,
        showAnswers,
        selection,
        questionTypeId,
        tagLabel,
        difficulty,
        status,
        questionIds,
        title,
      }

      const session = await deps.repository.insertSession({
        userId,
        kind: 'DRILL',
        prepTestId: null,
        sectionId: null,
        metadata: metadata as unknown as Record<string, unknown>,
      })

      const rows = await deps.repository.getDrillQuestionRowsByIds(questionIds)
      const questions = mapDrillQuestionRows(rows, false)

      return {
        session,
        metadata,
        questions,
        answers: [],
        drillLabel: title ?? null,
      }
    },

    async startLessonDrill(
      userId: string,
      body: { lessonId?: unknown; questionId?: unknown },
    ): Promise<DrillSessionResponse> {
      const lessonId = typeof body.lessonId === 'string' ? body.lessonId.trim() : ''
      if (!lessonId) throw new PracticeValidationError('lessonId is required')

      const lesson = await deps.repository.getPublishedPrepLessonById(lessonId)
      if (!lesson || !lesson.is_published) {
        throw new PracticeValidationError('Lesson not found')
      }
      const isActive = lesson.lesson_type === 'active_drill'
      const isAdaptive = lesson.lesson_type === 'adaptive_drill'
      if (!isActive && !isAdaptive) {
        throw new PracticeValidationError('Lesson is not a prep-course drill')
      }

      let questionIds = await deps.repository.listLessonQuestionIds(lessonId)

      if (isActive) {
        if (questionIds.length > 1) {
          throw new PracticeValidationError('Active drill lessons must have exactly one linked question')
        }
        const bodyQuestionId = typeof body.questionId === 'string' ? body.questionId.trim() : ''
        let questionId = questionIds[0] ?? (bodyQuestionId || null)
        if (!questionId) {
          const ref = extractPrepTestQuestionRef(lesson.summary, lesson.text_content, lesson.title)
          if (ref) {
            const resolvedId = await deps.repository.resolveQuestionIdFromReference(ref)
            if (!resolvedId) {
              throw new PracticeValidationError(`PrepTest question not found: ${ref}`)
            }
            questionId = resolvedId
          } else {
            throw new PracticeValidationError('No PrepTest question reference found for this lesson')
          }
          questionIds = [questionId]
        }
      } else {
        if (questionIds.length === 0) {
          throw new PracticeValidationError('No questions are linked to this adaptive drill lesson')
        }
        if (questionIds.length > 5) {
          throw new PracticeValidationError('Adaptive drill lessons can include at most five linked questions')
        }
      }

      const firstQuestionId = questionIds[0]!
      const questionDetail = await deps.repository.getQuestionDetail(firstQuestionId)
      if (!questionDetail) {
        throw new PracticeValidationError('Linked question not found')
      }

      const sectionType = parseSectionType(questionDetail.admin_sections?.section_type)
      if (!sectionType) {
        throw new PracticeValidationError('Linked question must be LR or RC')
      }

      const metadata: DrillSessionMetadata = {
        sectionType,
        questionCount: questionIds.length,
        timing: 'unlimited',
        showAnswers: 'end',
        selection: 'manual',
        questionIds,
        title: lesson.title,
        lessonId: lesson.id,
        source: isActive ? 'prep_course_active_drill' : 'prep_course_adaptive_drill',
      }

      const session = await deps.repository.insertSession({
        userId,
        kind: 'DRILL',
        prepTestId: null,
        sectionId: null,
        metadata: metadata as unknown as Record<string, unknown>,
      })

      const rows = await deps.repository.getDrillQuestionRowsByIds(questionIds)
      const questions = mapDrillQuestionRows(rows, false)

      return {
        session,
        metadata,
        questions,
        answers: [],
        drillLabel: lesson.title,
      }
    },

    async getDrillSession(userId: string, body: { sessionId?: unknown }): Promise<DrillSessionResponse> {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!sessionId) throw new PracticeValidationError('sessionId is required')

      const session = await deps.repository.getSessionById(sessionId, userId)
      if (!session) throw new PracticeForbiddenError('Session not found')
      if (session.kind !== 'DRILL') {
        throw new PracticeValidationError('Session is not a drill')
      }

      const metaRaw = session.metadata
      const sectionType = parseSectionType(metaRaw.sectionType)
      if (!sectionType) throw new PracticeValidationError('Invalid drill session metadata')

      const questionIds = drillQuestionIdsFromMetadata(metaRaw)
      const metadata: DrillSessionMetadata = {
        sectionType,
        questionCount:
          typeof metaRaw.questionCount === 'number'
            ? metaRaw.questionCount
            : questionIds.length,
        timing: typeof metaRaw.timing === 'string' ? metaRaw.timing : 'unlimited',
        showAnswers: typeof metaRaw.showAnswers === 'string' ? metaRaw.showAnswers : 'end',
        selection: typeof metaRaw.selection === 'string' ? metaRaw.selection : 'auto',
        questionTypeId:
          typeof metaRaw.questionTypeId === 'string' ? metaRaw.questionTypeId : null,
        tagLabel: typeof metaRaw.tagLabel === 'string' ? metaRaw.tagLabel : null,
        difficulty: typeof metaRaw.difficulty === 'string' ? metaRaw.difficulty : null,
        status: typeof metaRaw.status === 'string' ? metaRaw.status : 'fresh',
        questionIds,
        title: typeof metaRaw.title === 'string' ? metaRaw.title : null,
        flaggedQuestionIds: flaggedQuestionIdsFromMetadata(metaRaw),
      }

      const rows = await deps.repository.getDrillQuestionRowsByIds(questionIds)
      const includeOptionExplanations = session.completed_at != null
      const questions = mapDrillQuestionRows(rows, includeOptionExplanations)

      const events = await deps.repository.listAnswerEventsForSession(sessionId, userId)
      const latest = latestAnswerByQuestion(events)
      const answers: DrillAnswerState[] = [...latest.values()].map((e) => ({
        questionId: e.question_id,
        selectedAnswer: e.selected_answer,
        isCorrect: e.is_correct,
      }))

      return {
        session,
        metadata,
        questions,
        answers,
        drillLabel: metadata.title ?? null,
      }
    },

    async listSectionPool(
      _userId: string,
      body: { sectionType?: unknown; page?: unknown; pageSize?: unknown; sort?: unknown },
    ): Promise<SectionPoolListResult> {
      const page = Math.max(1, Math.floor(typeof body.page === 'number' ? body.page : 1))
      const pageSize = Math.min(50, Math.max(1, Math.floor(typeof body.pageSize === 'number' ? body.pageSize : 12)))
      const sort = body.sort === 'oldest' ? 'oldest' : 'newest'
      const filterType = sectionTypeForPool(
        typeof body.sectionType === 'string' ? body.sectionType : undefined,
      )

      const rows = await deps.repository.listSectionPoolRows({})
      const allItems = rows
        .map(mapSectionPoolRow)
        .filter((s): s is SectionPoolItem => s != null && s.questionCount > 0)

      const sectionTypeCounts: SectionPoolTypeCounts = {
        all: allItems.length,
        lr: allItems.filter((s) => s.sectionType === 'LR').length,
        rc: allItems.filter((s) => s.sectionType === 'RC').length,
      }

      const filtered = filterType ? allItems.filter((s) => s.sectionType === filterType) : allItems
      const sorted = [...filtered].sort((a, b) => {
        const diff = sectionNumberSortValue(a) - sectionNumberSortValue(b)
        return sort === 'newest' ? -diff : diff
      })

      const total = sorted.length
      const start = (page - 1) * pageSize
      const sections = sorted.slice(start, start + pageSize)

      return { sections, total, page, pageSize, sectionTypeCounts }
    },

    async startSection(
      userId: string,
      body: {
        sectionId?: unknown
        timing?: unknown
        showAnswers?: unknown
      },
    ): Promise<SectionSessionResponse> {
      const sectionId = typeof body.sectionId === 'string' ? body.sectionId : ''
      if (!sectionId) throw new PracticeValidationError('sectionId is required')

      const section = await deps.repository.getSectionDetail(sectionId)
      if (!section) throw new PracticeValidationError('sectionId not found')

      const sectionType = sectionTypeForPool(section.section_type)
      if (!sectionType) {
        throw new PracticeValidationError('Only LR and RC sections are supported for practice')
      }

      const questionIds = await deps.repository.listQuestionIdsBySectionId(sectionId)
      if (questionIds.length === 0) {
        throw new PracticeValidationError('This section has no questions available')
      }

      const timing = typeof body.timing === 'string' ? body.timing : '35'
      const showAnswers = typeof body.showAnswers === 'string' ? body.showAnswers : 'end'

      const pt = section.admin_prep_tests
      const prepTestTitle = pt?.title?.trim() || pt?.module_id || null
      const sectionTitle = section.title?.trim() || null

      const metadata: SectionSessionMetadata = {
        sectionType,
        timing,
        showAnswers,
        questionIds,
        prepTestTitle,
        sectionTitle,
        answeredQuestionIds: [],
      }

      const session = await deps.repository.insertSession({
        userId,
        kind: 'SECTION',
        prepTestId: section.prep_test_id,
        sectionId,
        metadata: metadata as unknown as Record<string, unknown>,
      })

      const rows = await deps.repository.getDrillQuestionRowsByIds(questionIds)
      const questions = mapDrillQuestionRows(rows, false)

      const poolItem: SectionPoolItem = {
        id: section.id,
        sectionId: section.section_id,
        sectionNumber: section.section_number,
        sectionType,
        title: sectionTitle,
        moduleId: section.module_id,
        prepTestId: section.prep_test_id,
        prepTestTitle,
        questionCount: questionIds.length,
        timeMinutes: defaultTimeMinutes(sectionType),
      }

      const sessionLabel = [prepTestTitle, sectionTitle].filter(Boolean).join(' — ') || null

      return {
        session,
        metadata,
        section: poolItem,
        questions,
        answers: [],
        sessionLabel,
      }
    },

    async getSectionSession(userId: string, body: { sessionId?: unknown }): Promise<SectionSessionResponse> {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!sessionId) throw new PracticeValidationError('sessionId is required')

      const session = await deps.repository.getSessionById(sessionId, userId)
      if (!session) throw new PracticeForbiddenError('Session not found')
      if (session.kind !== 'SECTION') {
        throw new PracticeValidationError('Session is not a section practice session')
      }
      if (!session.section_id) {
        throw new PracticeValidationError('Section session missing section_id')
      }

      const metaRaw = session.metadata
      const sectionType = sectionTypeForPool(metaRaw.sectionType as string)
      if (!sectionType) throw new PracticeValidationError('Invalid section session metadata')

      const questionIds = drillQuestionIdsFromMetadata(metaRaw)
      const metadata: SectionSessionMetadata = {
        sectionType,
        timing: typeof metaRaw.timing === 'string' ? metaRaw.timing : '35',
        showAnswers: typeof metaRaw.showAnswers === 'string' ? metaRaw.showAnswers : 'end',
        questionIds,
        prepTestTitle: typeof metaRaw.prepTestTitle === 'string' ? metaRaw.prepTestTitle : null,
        sectionTitle: typeof metaRaw.sectionTitle === 'string' ? metaRaw.sectionTitle : null,
        answeredQuestionIds: Array.isArray(metaRaw.answeredQuestionIds)
          ? (metaRaw.answeredQuestionIds as string[])
          : [],
        flaggedQuestionIds: flaggedQuestionIdsFromMetadata(metaRaw),
      }

      const sectionDetail = await deps.repository.getSectionDetail(session.section_id)
      const pt = sectionDetail?.admin_prep_tests

      const poolItem: SectionPoolItem = {
        id: session.section_id,
        sectionId: sectionDetail?.section_id ?? null,
        sectionNumber: sectionDetail?.section_number ?? null,
        sectionType,
        title: metadata.sectionTitle ?? sectionDetail?.title ?? null,
        moduleId: sectionDetail?.module_id ?? null,
        prepTestId: session.prep_test_id ?? sectionDetail?.prep_test_id ?? '',
        prepTestTitle: metadata.prepTestTitle ?? pt?.title ?? pt?.module_id ?? null,
        questionCount: questionIds.length,
        timeMinutes: defaultTimeMinutes(sectionType),
      }

      const rows = await deps.repository.getDrillQuestionRowsByIds(questionIds)
      const includeOptionExplanations = session.completed_at != null
      const questions = mapDrillQuestionRows(rows, includeOptionExplanations)

      const events = await deps.repository.listAnswerEventsForSession(sessionId, userId)
      const latest = latestAnswerByQuestion(events)
      const answers: DrillAnswerState[] = [...latest.values()].map((e) => ({
        questionId: e.question_id,
        selectedAnswer: e.selected_answer,
        isCorrect: e.is_correct,
      }))

      const sessionLabel =
        [metadata.prepTestTitle, metadata.sectionTitle].filter(Boolean).join(' — ') || null

      return {
        session,
        metadata,
        section: poolItem,
        questions,
        answers,
        sessionLabel,
      }
    },

    async listPrepTestPool(
      userId: string,
      body: { filter?: unknown; page?: unknown; pageSize?: unknown; sort?: unknown },
    ): Promise<PrepTestPoolListResult> {
      const page = Math.max(1, Math.floor(typeof body.page === 'number' ? body.page : 1))
      const pageSize = Math.min(50, Math.max(1, Math.floor(typeof body.pageSize === 'number' ? body.pageSize : 10)))
      const sort = body.sort === 'oldest' ? 'oldest' : 'newest'
      const filter =
        body.filter === 'fresh' || body.filter === 'in_progress' || body.filter === 'completed'
          ? body.filter
          : null

      const rows = await deps.repository.listPrepTestPoolRows()
      const rowsById = new Map(rows.map((row) => [row.id, row]))
      const allSessions = await deps.repository.listUserSessionsForPrepTests(userId)
      const sessionsByPrepTestId = groupSessionsByPrepTestId(allSessions)

      const items: PrepTestPoolItem[] = []
      for (const row of rows) {
        if (practiceableSectionsFromRow(row.sections).length === 0) continue
        const sessions = sessionsByPrepTestId.get(row.id) ?? []
        items.push(poolItemFromRow(row, sessions))
      }

      const statusCounts: PrepTestPoolStatusCounts = {
        all: items.length,
        fresh: items.filter((i) => i.status === 'fresh').length,
        in_progress: items.filter((i) => i.status === 'in_progress').length,
        completed: items.filter((i) => i.status === 'completed').length,
      }

      const filtered = filter ? items.filter((i) => i.status === filter) : items
      const sorted = [...filtered].sort((a, b) => {
        const diff = prepTestNumberSortValue(a) - prepTestNumberSortValue(b)
        return sort === 'newest' ? -diff : diff
      })

      const total = sorted.length
      const start = (page - 1) * pageSize
      const pageItems = sorted.slice(start, start + pageSize)
      const prepTests = await Promise.all(
        pageItems.map((item) => {
          const row = rowsById.get(item.id)
          const sessions = sessionsByPrepTestId.get(item.id) ?? []
          const practiceableIds = row
            ? practiceableSectionsFromRow(row.sections).map((s) => s.id)
            : []
          return enrichPoolItemAttemptScores(
            deps.repository,
            item.id,
            practiceableIds,
            sessions,
            item,
          )
        }),
      )

      return { prepTests, total, page, pageSize, statusCounts }
    },

    async getPrepTestDetail(
      userId: string,
      body: { prepTestId?: unknown },
    ): Promise<PrepTestDetailResponse> {
      const prepTestId = typeof body.prepTestId === 'string' ? body.prepTestId : ''
      if (!prepTestId) throw new PracticeValidationError('prepTestId is required')

      const row = await deps.repository.getPrepTestDetailRow(prepTestId)
      if (!row) throw new PracticeValidationError('prepTestId not found')

      const sessions = await deps.repository.listUserSessionsForPrepTest(userId, prepTestId)
      const prepTestSession =
        sessions.find((s) => s.kind === 'PREPTEST' && !s.completed_at) ?? null

      return buildPrepTestDetail(row, sessions, prepTestSession)
    },

    async startPrepTest(
      userId: string,
      body: { prepTestId?: unknown; timing?: unknown; format?: unknown },
    ): Promise<{ prepTestSession: PracticeSessionRow; detail: PrepTestDetailResponse }> {
      const prepTestId = typeof body.prepTestId === 'string' ? body.prepTestId : ''
      if (!prepTestId) throw new PracticeValidationError('prepTestId is required')

      const row = await deps.repository.getPrepTestDetailRow(prepTestId)
      if (!row) throw new PracticeValidationError('prepTestId not found')

      const practiceable = practiceableSectionsFromRow(row.sections)
      if (practiceable.length === 0) {
        throw new PracticeValidationError('This PrepTest has no practiceable LR/RC sections')
      }

      const timing = typeof body.timing === 'string' ? body.timing : 'standard'
      const format = typeof body.format === 'string' ? body.format : 'four'
      const prepTestNumber = prepTestNumberFromModuleId(row.moduleId)
      const prepTestTitle = row.title?.trim() || prepTestLabel(row.moduleId, row.title, prepTestNumber)

      const sessions = await deps.repository.listUserSessionsForPrepTest(userId, prepTestId)
      let prepTestSession =
        sessions.find((s) => s.kind === 'PREPTEST' && !s.completed_at) ?? null

      if (!prepTestSession) {
        const metadata: PrepTestSessionMetadata = {
          timing,
          format,
          sectionIds: practiceable.map((s) => s.id),
          prepTestTitle,
          answeredQuestionIds: [],
        }
        prepTestSession = await deps.repository.insertSession({
          userId,
          kind: 'PREPTEST',
          prepTestId,
          sectionId: null,
          metadata: metadata as unknown as Record<string, unknown>,
        })
        sessions.unshift(prepTestSession)
      } else if (typeof body.timing === 'string' || typeof body.format === 'string') {
        const nextMeta = {
          ...prepTestSession.metadata,
          ...(typeof body.timing === 'string' ? { timing } : {}),
          ...(typeof body.format === 'string' ? { format } : {}),
        }
        prepTestSession = await deps.repository.updateSession(prepTestSession.id, userId, {
          metadata: nextMeta,
        })
      }

      const detail = buildPrepTestDetail(row, sessions, prepTestSession)
      return { prepTestSession, detail }
    },

    async completePrepTest(
      userId: string,
      body: { prepTestId?: unknown },
    ): Promise<{ session: PracticeSessionRow }> {
      const prepTestId = typeof body.prepTestId === 'string' ? body.prepTestId : ''
      if (!prepTestId) throw new PracticeValidationError('prepTestId is required')

      const row = await deps.repository.getPrepTestDetailRow(prepTestId)
      if (!row) throw new PracticeValidationError('prepTestId not found')

      const practiceableIds = practiceableSectionsFromRow(row.sections).map((s) => s.id)
      const sessions = await deps.repository.listUserSessionsForPrepTest(userId, prepTestId)

      let prepTestSession =
        sessions.find((s) => s.kind === 'PREPTEST' && !s.completed_at) ??
        sortedPrepTestSessions(sessions)[0] ??
        null

      const completedSectionSessions = sectionSessionsForPrepTestAttempt(sessions, prepTestSession).filter(
        (s) => s.completed_at && s.section_id && practiceableIds.includes(s.section_id),
      )
      const bySectionId = latestSectionSessionPerId(completedSectionSessions)

      if (bySectionId.size < practiceableIds.length) {
        throw new PracticeValidationError('Complete all practiceable sections before finishing the PrepTest')
      }

      let rawScore = 0
      for (const secSession of bySectionId.values()) {
        if (typeof secSession.raw_score === 'number') {
          rawScore += secSession.raw_score
        } else {
          const events = await deps.repository.listAnswerEventsForSession(secSession.id, userId)
          const latest = latestAnswerByQuestion(events)
          for (const e of latest.values()) {
            if (e.is_correct) rawScore += 1
          }
        }
      }

      if (!prepTestSession) {
        const practiceable = practiceableSectionsFromRow(row.sections)
        const prepTestNumber = prepTestNumberFromModuleId(row.moduleId)
        prepTestSession = await deps.repository.insertSession({
          userId,
          kind: 'PREPTEST',
          prepTestId,
          sectionId: null,
          metadata: {
            timing: 'standard',
            format: 'four',
            sectionIds: practiceable.map((s) => s.id),
            prepTestTitle: row.title?.trim() || prepTestLabel(row.moduleId, row.title, prepTestNumber),
          },
        })
      }

      if (prepTestSession.completed_at) {
        throw new PracticeValidationError('PrepTest is already completed')
      }

      const now = new Date().toISOString()
      let scaledScore: number | null = null
      let percentile: number | null = null
      const scoreRow = await deps.repository.getScoreRowForRaw(prepTestId, rawScore)
      if (scoreRow) {
        scaledScore = scoreRow.scaled_score
        percentile = scoreRow.percentile
      }

      const sessionRow = await deps.repository.updateSession(prepTestSession.id, userId, {
        completed_at: now,
        raw_score: rawScore,
        scaled_score: scaledScore,
        percentile,
      })

      return { session: sessionRow }
    },

    async listBlindReviewPool(
      userId: string,
      body: { filter?: unknown; page?: unknown; pageSize?: unknown; sort?: unknown },
    ): Promise<BlindReviewPoolListResult> {
      const page = Math.max(1, Math.floor(typeof body.page === 'number' ? body.page : 1))
      const pageSize = Math.min(50, Math.max(1, Math.floor(typeof body.pageSize === 'number' ? body.pageSize : 5)))
      const sort = body.sort === 'oldest' ? 'oldest' : 'newest'
      const filter =
        body.filter === 'eligible' || body.filter === 'in_progress' || body.filter === 'completed'
          ? body.filter
          : null

      const rows = await deps.repository.listPrepTestPoolRows()
      const allSessions = await deps.repository.listUserSessionsForPrepTests(userId)
      const sessionsByPrepTestId = groupSessionsByPrepTestId(allSessions)

      const items: BlindReviewPoolItem[] = []
      for (const row of rows) {
        const sessions = sessionsByPrepTestId.get(row.id) ?? []
        const item = blindReviewPoolItemFromRow(row, sessions)
        if (item) items.push(item)
      }

      const statusCounts: BlindReviewPoolStatusCounts = {
        all: items.length,
        eligible: items.filter((i) => i.status === 'eligible').length,
        in_progress: items.filter((i) => i.status === 'in_progress').length,
        completed: items.filter((i) => i.status === 'completed').length,
      }

      const filtered = filter ? items.filter((i) => i.status === filter) : items
      const sorted = [...filtered].sort((a, b) => {
        const diff = blindReviewPoolSortValue(a) - blindReviewPoolSortValue(b)
        return sort === 'newest' ? -diff : diff
      })

      const total = sorted.length
      const start = (page - 1) * pageSize
      const prepTests = sorted.slice(start, start + pageSize)

      return { prepTests, total, page, pageSize, statusCounts }
    },

    async getBlindReviewDetail(
      userId: string,
      body: { prepTestId?: unknown },
    ): Promise<BlindReviewDetailResponse> {
      const prepTestId = typeof body.prepTestId === 'string' ? body.prepTestId : ''
      if (!prepTestId) throw new PracticeValidationError('prepTestId is required')

      const row = await deps.repository.getPrepTestDetailRow(prepTestId)
      if (!row) throw new PracticeValidationError('prepTestId not found')

      const sessions = await deps.repository.listUserSessionsForPrepTest(userId, prepTestId)
      const { prepTestSession } = blindReviewStateFromSessions(sessions)
      if (!prepTestSession) {
        throw new PracticeValidationError('Complete the PrepTest before blind review')
      }

      return buildBlindReviewDetail(row, sessions, prepTestSession)
    },

    async skipBlindReview(
      userId: string,
      body: { prepTestId?: unknown },
    ): Promise<{ session: PracticeSessionRow }> {
      const prepTestId = typeof body.prepTestId === 'string' ? body.prepTestId : ''
      if (!prepTestId) throw new PracticeValidationError('prepTestId is required')

      const sessions = await deps.repository.listUserSessionsForPrepTest(userId, prepTestId)
      const prepTestSession = prepTestSessionAwaitingBlindReview(sessions)
      if (!prepTestSession) {
        throw new PracticeValidationError('No PrepTest awaiting blind review')
      }

      const sessionRow = await deps.repository.updateSession(prepTestSession.id, userId, {
        metadata: {
          ...prepTestSession.metadata,
          blindReviewSkipped: true,
          blindReviewActive: false,
        },
      })
      return { session: sessionRow }
    },

    async startBlindReview(
      userId: string,
      body: { prepTestId?: unknown },
    ): Promise<{ session: PracticeSessionRow }> {
      const prepTestId = typeof body.prepTestId === 'string' ? body.prepTestId : ''
      if (!prepTestId) throw new PracticeValidationError('prepTestId is required')

      const sessions = await deps.repository.listUserSessionsForPrepTest(userId, prepTestId)
      const prepTestSession = prepTestSessionAwaitingBlindReview(sessions)
      if (!prepTestSession) {
        const newest = sortedPrepTestSessions(sessions)[0]
        if (newest?.blind_review_completed_at) {
          throw new PracticeValidationError('Blind review is already completed for this PrepTest')
        }
        throw new PracticeValidationError('Complete the PrepTest before starting blind review')
      }

      const sessionRow = await deps.repository.updateSession(prepTestSession.id, userId, {
        metadata: { ...prepTestSession.metadata, blindReviewActive: true },
      })
      return { session: sessionRow }
    },

    async completeBlindReview(
      userId: string,
      body: { prepTestId?: unknown; sessionId?: unknown },
    ): Promise<{ session: PracticeSessionRow }> {
      const prepTestIdFromBody = typeof body.prepTestId === 'string' ? body.prepTestId : ''
      const sessionIdFromBody = typeof body.sessionId === 'string' ? body.sessionId : ''

      let prepTestId = prepTestIdFromBody
      if (!prepTestId && sessionIdFromBody) {
        const row = await deps.repository.getSessionById(sessionIdFromBody, userId)
        if (!row || row.kind !== 'PREPTEST') {
          throw new PracticeValidationError('sessionId must be a PrepTest session')
        }
        prepTestId = row.prep_test_id ?? ''
      }
      if (!prepTestId) throw new PracticeValidationError('prepTestId or sessionId is required')

      const sessions = await deps.repository.listUserSessionsForPrepTest(userId, prepTestId)
      const prepTestSession = prepTestSessionAwaitingBlindReview(sessions)
      if (!prepTestSession) {
        const newest = sortedPrepTestSessions(sessions)[0]
        if (newest?.blind_review_completed_at) {
          throw new PracticeValidationError('Blind review is already completed for this PrepTest')
        }
        throw new PracticeValidationError('No completed PrepTest session found')
      }

      const sectionSessions = sessions.filter((s) => s.kind === 'SECTION' && s.completed_at && s.section_id)
      const sectionIds = sectionSessions.map((s) => s.id)
      const events = await deps.repository.listAnswerEventsForSessions(sectionIds, userId)
      const latest = latestAnswerByQuestion(events)

      let correct = 0
      for (const e of latest.values()) {
        if (e.is_correct) correct += 1
      }
      const blindReviewRaw = correct
      let blindReviewScaled: number | null = null
      let blindReviewPercentile: number | null = null
      const scoreRow = await deps.repository.getScoreRowForRaw(prepTestId, blindReviewRaw)
      if (scoreRow) {
        blindReviewScaled = scoreRow.scaled_score
        blindReviewPercentile = scoreRow.percentile
      }

      const now = new Date().toISOString()
      const sessionRow = await deps.repository.updateSession(prepTestSession.id, userId, {
        blind_review_raw_score: blindReviewRaw,
        blind_review_scaled_score: blindReviewScaled,
        blind_review_percentile: blindReviewPercentile,
        blind_review_completed_at: now,
        metadata: { ...prepTestSession.metadata, blindReviewActive: false },
      })
      return { session: sessionRow }
    },
  }
}

export type PracticeService = ReturnType<typeof createPracticeService>
