import { parseDrillBlindReviewFromMetadata } from "@/features/student/drills/parse-drill-blind-review"
import type { PracticeSession } from "@/lib/api/practice"
import type {
  PrepLessonActiveDrillAttempt,
  PrepLessonDrillBlindReviewAttempt,
} from "@/lib/api/prep-course"

type StashedDrillBlindReview = PrepLessonDrillBlindReviewAttempt & {
  sessionId: string
}

function blindReviewFromSessionMetadata(
  metadata: Record<string, unknown>,
): PrepLessonDrillBlindReviewAttempt | null {
  const parsed = parseDrillBlindReviewFromMetadata(metadata)
  if (!parsed) return null
  return {
    rawScore: parsed.rawScore,
    completedAt: parsed.completedAt,
    answers: [...parsed.answersByQuestion.entries()].map(([questionId, answer]) => ({
      questionId,
      selectedAnswer: answer.selectedAnswer,
      isCorrect: answer.isCorrect,
    })),
  }
}

function lessonBlindReviewStorageKey(lessonId: string): string {
  return `lesson-drill-br-${lessonId}`
}

function sessionBlindReviewStorageKey(sessionId: string): string {
  return `drill-br-result-${sessionId}`
}

function stashDrillBlindReviewResult(
  session: PracticeSession,
  lessonId?: string | null,
): PrepLessonDrillBlindReviewAttempt | null {
  const blindReview = blindReviewFromSessionMetadata(session.metadata ?? {})
  if (!blindReview) return null

  const payload: StashedDrillBlindReview = { sessionId: session.id, ...blindReview }
  try {
    sessionStorage.setItem(sessionBlindReviewStorageKey(session.id), JSON.stringify(payload))
    if (lessonId) {
      sessionStorage.setItem(lessonBlindReviewStorageKey(lessonId), JSON.stringify(payload))
    }
  } catch {
    /* ignore quota errors */
  }
  return blindReview
}

function loadStashedDrillBlindReview(input: {
  sessionId: string
  lessonId?: string | null
}): PrepLessonDrillBlindReviewAttempt | null {
  const keys = [
    sessionBlindReviewStorageKey(input.sessionId),
    input.lessonId ? lessonBlindReviewStorageKey(input.lessonId) : null,
  ].filter((key): key is string => Boolean(key))

  for (const key of keys) {
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as StashedDrillBlindReview
      if (parsed.sessionId !== input.sessionId) continue
      if (!parsed.completedAt || !Array.isArray(parsed.answers)) continue
      return {
        rawScore: parsed.rawScore,
        completedAt: parsed.completedAt,
        answers: parsed.answers,
      }
    } catch {
      continue
    }
  }
  return null
}

async function mergeActiveDrillAttemptBlindReview(
  attempt: PrepLessonActiveDrillAttempt | null,
  options: {
    lessonId?: string | null
    getDrillSession?: (sessionId: string) => Promise<{ session: PracticeSession }>
  },
): Promise<PrepLessonActiveDrillAttempt | null> {
  if (!attempt || attempt.blindReview) return attempt

  const stashed = loadStashedDrillBlindReview({
    sessionId: attempt.sessionId,
    lessonId: options.lessonId,
  })
  if (stashed) {
    return { ...attempt, blindReview: stashed }
  }

  if (!options.getDrillSession) return attempt

  try {
    const drill = await options.getDrillSession(attempt.sessionId)
    const fromApi = blindReviewFromSessionMetadata(drill.session.metadata ?? {})
    if (!fromApi) return attempt
    stashDrillBlindReviewResult(drill.session, options.lessonId)
    return { ...attempt, blindReview: fromApi }
  } catch {
    return attempt
  }
}

export {
  blindReviewFromSessionMetadata,
  loadStashedDrillBlindReview,
  mergeActiveDrillAttemptBlindReview,
  stashDrillBlindReviewResult,
}
