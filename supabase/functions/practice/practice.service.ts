import type {
  AnswerEventRow,
  PracticeRepository,
  PracticeSessionKind,
  PracticeSessionRow,
  QuestionDetailRow,
} from './practice.repository.ts'

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
      body: { sessionId?: unknown; questionId?: unknown; selectedAnswer?: unknown },
    ): Promise<{ event: AnswerEventRow }> {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      const questionId = typeof body.questionId === 'string' ? body.questionId : ''
      const selectedRaw = typeof body.selectedAnswer === 'string' ? body.selectedAnswer : ''
      if (!sessionId) throw new PracticeValidationError('sessionId is required')
      if (!questionId) throw new PracticeValidationError('questionId is required')
      if (!selectedRaw.trim()) throw new PracticeValidationError('selectedAnswer is required')

      const session = await deps.repository.getSessionById(sessionId, userId)
      if (!session) throw new PracticeForbiddenError('Session not found')
      if (session.completed_at) {
        throw new PracticeValidationError('Cannot submit answers to a completed session')
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
      return { event }
    },

    async completeSession(userId: string, body: { sessionId?: unknown }): Promise<{ session: PracticeSessionRow }> {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!sessionId) throw new PracticeValidationError('sessionId is required')

      const session = await deps.repository.getSessionById(sessionId, userId)
      if (!session) throw new PracticeForbiddenError('Session not found')
      if (session.completed_at) {
        throw new PracticeValidationError('Session is already completed')
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
      body: { sessionId?: unknown; bookmarked?: unknown; excluded?: unknown },
    ): Promise<{ session: PracticeSessionRow }> {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!sessionId) throw new PracticeValidationError('sessionId is required')

      const session = await deps.repository.getSessionById(sessionId, userId)
      if (!session) throw new PracticeForbiddenError('Session not found')

      const patch: {
        bookmarked?: boolean
        excluded?: boolean
      } = {}
      if (typeof body.bookmarked === 'boolean') patch.bookmarked = body.bookmarked
      if (typeof body.excluded === 'boolean') patch.excluded = body.excluded
      if (Object.keys(patch).length === 0) {
        throw new PracticeValidationError('bookmarked or excluded must be provided')
      }

      const sessionRow = await deps.repository.updateSession(sessionId, userId, patch)
      return { session: sessionRow }
    },
  }
}

export type PracticeService = ReturnType<typeof createPracticeService>
