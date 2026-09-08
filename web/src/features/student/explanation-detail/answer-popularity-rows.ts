import type { ExplanationAnswerPopularityRow } from "@/features/student/explanation-detail/types"

const DEFAULT_LETTERS = ["A", "B", "C", "D", "E"] as const

function normalizeLetter(value: string): string {
  return value.trim().toUpperCase().slice(0, 1)
}

function lettersFromChoices(choices: { id: string; index: number }[]): string[] {
  if (choices.length === 0) return [...DEFAULT_LETTERS]
  return choices.map((c) => {
    const fromId = normalizeLetter(c.id)
    if (/^[A-E]$/.test(fromId)) return fromId
    if (c.index >= 1 && c.index <= 5) return String.fromCharCode(64 + c.index)
    return fromId || "A"
  })
}

function stableSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Stable provisional A–E bars when platform sample is too small to display.
 * Correct choice gets the plurality; remaining share is split across wrong choices.
 */
export function buildProvisionalAnswerPopularity(
  seedKey: string,
  correctLetter: string | null | undefined,
  choiceLetters: readonly string[] = DEFAULT_LETTERS,
): ExplanationAnswerPopularityRow[] {
  const letters = (choiceLetters.length > 0 ? choiceLetters : DEFAULT_LETTERS).map((letter) =>
    normalizeLetter(letter),
  )
  const correct = correctLetter ? normalizeLetter(correctLetter) : null
  const seed = stableSeed(seedKey || correct || "A")
  const correctPct = 32 + (seed % 24)
  const remaining = 100 - correctPct
  const wrongLetters = letters.filter((letter) => letter !== correct)
  const weights = wrongLetters.map((_, index) => 3 + ((seed >>> (index * 3)) % 7))
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
    const adjustIndex =
      rows.findIndex((row) => row.letter === correct) >= 0
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
