import type { ExplanationAnswerPopularityRow } from "@/features/student/explanation-detail/types"

function normalizeLetter(value: string): string {
  return value.trim().toUpperCase().slice(0, 1)
}

function lettersFromChoices(choices: { id: string; index: number }[]): string[] {
  if (choices.length === 0) return ["A", "B", "C", "D", "E"]
  return choices.map((c) => {
    const fromId = normalizeLetter(c.id)
    if (/^[A-E]$/.test(fromId)) return fromId
    if (c.index >= 1 && c.index <= 5) return String.fromCharCode(64 + c.index)
    return fromId || "A"
  })
}

export function resolveAnswerPopularityRows(
  fromApi: ExplanationAnswerPopularityRow[] | undefined,
  choices: { id: string; index: number }[],
  correctChoiceId: string,
): ExplanationAnswerPopularityRow[] {
  const letters = lettersFromChoices(choices)
  const correct = correctChoiceId ? normalizeLetter(correctChoiceId) : null

  const byLetter = new Map((fromApi ?? []).map((r) => [normalizeLetter(r.letter), r]))

  return letters.map((letter) => {
    const existing = byLetter.get(letter)
    if (existing) return existing
    return {
      letter,
      count: 0,
      pct: 0,
      ...(correct && letter === correct ? { highlight: true } : {}),
    }
  })
}
