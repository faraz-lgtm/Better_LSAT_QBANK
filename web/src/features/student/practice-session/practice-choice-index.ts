export function hasPracticeAnswer(
  answer: { selectedAnswer?: string } | null | undefined,
): answer is { selectedAnswer: string } {
  return Boolean(answer?.selectedAnswer?.trim())
}

export function choiceIndexFromAnswer(
  choices: ReadonlyArray<{ id: string; index?: number }>,
  selectedAnswer: string,
): number | null {
  const raw = selectedAnswer.trim()
  if (!raw || choices.length === 0) return null

  const letter = raw.toUpperCase()
  const byId = choices.findIndex((choice) => choice.id.trim().toUpperCase() === letter)
  if (byId >= 0) return byId

  const alpha = letter.replace(/[^A-Z]/g, "")
  if (alpha.length === 1) {
    const idx = alpha.charCodeAt(0) - 65
    if (idx >= 0 && idx < choices.length) return idx
  }

  const asNum = Number.parseInt(raw, 10)
  if (Number.isFinite(asNum)) {
    const byIndex = choices.findIndex((choice) => choice.index === asNum)
    if (byIndex >= 0) return byIndex
    if (asNum >= 1 && asNum <= choices.length) return asNum - 1
    if (asNum >= 0 && asNum < choices.length) return asNum
  }

  return null
}
