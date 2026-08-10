import type { ExplanationAnswerPopularityRow } from "@/features/student/explanation-detail/explanation-tree-types"

const LETTERS = ["A", "B", "C", "D", "E"] as const

/** Stable 0–99 hash so preview popularity does not jump between renders. */
function stableSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Provisional answer-popularity bars until diagnostic aggregates exist on the edge.
 * Correct choice gets the plurality; remaining share is split across wrong choices.
 */
function buildDiagnosticAnswerPopularity(
  questionId: string,
  correctLetter: string | null | undefined,
  choiceLetters: readonly string[] = LETTERS,
): ExplanationAnswerPopularityRow[] {
  const letters = (choiceLetters.length > 0 ? choiceLetters : LETTERS).map((letter) =>
    letter.trim().toUpperCase().slice(0, 1),
  )
  const correct = correctLetter?.trim().toUpperCase().slice(0, 1) ?? null
  const seed = stableSeed(questionId)
  const correctPct = 32 + (seed % 24) // 32–55
  const remaining = 100 - correctPct
  const wrongLetters = letters.filter((letter) => letter !== correct)
  const weights = wrongLetters.map((_, index) => 3 + ((seed >> (index * 3)) % 7))
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0) || 1

  const rows: ExplanationAnswerPopularityRow[] = letters.map((letter) => {
    if (correct && letter === correct) {
      return { letter, count: correctPct, pct: correctPct, highlight: true }
    }
    const wrongIndex = wrongLetters.indexOf(letter)
    if (wrongIndex < 0) return { letter, count: 0, pct: 0 }
    const pct = Math.round((remaining * (weights[wrongIndex] ?? 1)) / weightSum)
    return { letter, count: pct, pct }
  })

  const total = rows.reduce((sum, row) => sum + row.pct, 0)
  if (total !== 100 && rows.length > 0) {
    const adjustIndex = rows.findIndex((row) => row.letter === correct) >= 0
      ? rows.findIndex((row) => row.letter === correct)
      : 0
    const adjusted = rows[adjustIndex]!
    rows[adjustIndex] = {
      ...adjusted,
      pct: adjusted.pct + (100 - total),
      count: adjusted.count + (100 - total),
    }
  }

  return rows
}

export { buildDiagnosticAnswerPopularity }
