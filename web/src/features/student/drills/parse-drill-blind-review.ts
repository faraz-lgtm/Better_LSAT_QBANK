export type DrillBlindReviewAnswer = {
  selectedAnswer: string
  isCorrect: boolean
}

export type DrillBlindReviewData = {
  rawScore: number
  completedAt: string
  answersByQuestion: Map<string, DrillBlindReviewAnswer>
}

function parseDrillAnswerSnapshots(
  value: unknown,
): Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }> | null {
  if (!Array.isArray(value)) return null
  const parsed: Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }> = []
  for (const row of value) {
    if (!row || typeof row !== "object") continue
    const record = row as Record<string, unknown>
    const questionId = typeof record.questionId === "string" ? record.questionId : ""
    const selectedAnswer = typeof record.selectedAnswer === "string" ? record.selectedAnswer : ""
    const isCorrect = record.isCorrect === true
    if (!questionId || !selectedAnswer) continue
    parsed.push({ questionId, selectedAnswer, isCorrect })
  }
  return parsed.length > 0 ? parsed : null
}

function parseBlindReviewFromMetadata(
  metadata: Record<string, unknown>,
  prefix: "drill" | "section",
): DrillBlindReviewData | null {
  const completedAt = metadata[`${prefix}BlindReviewCompletedAt`]
  if (typeof completedAt !== "string" || !completedAt) return null

  const answers = parseDrillAnswerSnapshots(metadata[`${prefix}BlindReviewAnswers`])
  if (!answers) return null

  const answersByQuestion = new Map<string, DrillBlindReviewAnswer>()
  for (const answer of answers) {
    answersByQuestion.set(answer.questionId, {
      selectedAnswer: answer.selectedAnswer,
      isCorrect: answer.isCorrect,
    })
  }

  const rawScoreKey = `${prefix}BlindReviewRawScore`
  const rawScore =
    typeof metadata[rawScoreKey] === "number" && Number.isFinite(metadata[rawScoreKey])
      ? (metadata[rawScoreKey] as number)
      : answers.filter((answer) => answer.isCorrect).length

  return { rawScore, completedAt, answersByQuestion }
}

function parseDrillBlindReviewFromMetadata(metadata: Record<string, unknown>): DrillBlindReviewData | null {
  return parseBlindReviewFromMetadata(metadata, "drill")
}

function parseSectionBlindReviewFromMetadata(metadata: Record<string, unknown>): DrillBlindReviewData | null {
  return parseBlindReviewFromMetadata(metadata, "section")
}

type BlindReviewAnswerSnapshot = {
  questionId: string
  isCorrect: boolean
  selectedAnswer?: string
}

function resolveSectionBlindReviewForResults(input: {
  sessionMetadata: Record<string, unknown>
  blindReviewAnswers?: BlindReviewAnswerSnapshot[]
  blindReviewRawScore?: number | null
}): {
  rawScore: number | null
  answersByQuestion: Map<string, { selectedAnswer: string; isCorrect: boolean }> | null
} {
  const fromMeta = parseSectionBlindReviewFromMetadata(input.sessionMetadata)
  if (fromMeta) {
    const answersByQuestion = new Map<string, { selectedAnswer: string; isCorrect: boolean }>()
    for (const [questionId, answer] of fromMeta.answersByQuestion.entries()) {
      answersByQuestion.set(questionId, {
        selectedAnswer: answer.selectedAnswer,
        isCorrect: answer.isCorrect,
      })
    }
    return { rawScore: fromMeta.rawScore, answersByQuestion }
  }

  const apiAnswers = input.blindReviewAnswers
  if (!apiAnswers || apiAnswers.length === 0) {
    return { rawScore: null, answersByQuestion: null }
  }

  const answersByQuestion = new Map<string, { selectedAnswer: string; isCorrect: boolean }>()
  for (const answer of apiAnswers) {
    answersByQuestion.set(answer.questionId, {
      selectedAnswer: answer.selectedAnswer ?? "",
      isCorrect: answer.isCorrect,
    })
  }
  const rawScore =
    input.blindReviewRawScore != null
      ? input.blindReviewRawScore
      : apiAnswers.filter((answer) => answer.isCorrect).length
  return { rawScore, answersByQuestion }
}

/**
 * When Blind Review is completed but a question has no BR choice, inherit Actual
 * for that question's BR icon/score. BR answers always win when present.
 */
function applyActualFallbackToBlindReview(input: {
  questionIds: string[]
  actualByQuestion: Map<string, { selectedAnswer: string; isCorrect: boolean }>
  blindReviewAnswersByQuestion: Map<string, { selectedAnswer: string; isCorrect: boolean }> | null
}): {
  rawScore: number | null
  answersByQuestion: Map<string, { selectedAnswer: string; isCorrect: boolean }> | null
} {
  if (input.blindReviewAnswersByQuestion == null) {
    return { rawScore: null, answersByQuestion: null }
  }

  const answersByQuestion = new Map<string, { selectedAnswer: string; isCorrect: boolean }>()
  let rawScore = 0

  for (const questionId of input.questionIds) {
    const br = input.blindReviewAnswersByQuestion.get(questionId)
    if (br && br.selectedAnswer.trim()) {
      answersByQuestion.set(questionId, {
        selectedAnswer: br.selectedAnswer,
        isCorrect: br.isCorrect,
      })
      if (br.isCorrect) rawScore += 1
      continue
    }

    const actual = input.actualByQuestion.get(questionId)
    if (actual && actual.selectedAnswer.trim()) {
      answersByQuestion.set(questionId, {
        selectedAnswer: actual.selectedAnswer,
        isCorrect: actual.isCorrect,
      })
      if (actual.isCorrect) rawScore += 1
    }
  }

  return { rawScore, answersByQuestion }
}

export {
  applyActualFallbackToBlindReview,
  parseBlindReviewFromMetadata,
  parseDrillBlindReviewFromMetadata,
  parseSectionBlindReviewFromMetadata,
  resolveSectionBlindReviewForResults,
}
