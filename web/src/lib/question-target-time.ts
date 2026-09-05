/** Keep in sync with supabase/functions/_shared/question-target-time.ts */

export const BUFFER_FACTOR = 0.9
export const SECTION_SECONDS = 35 * 60
export const DIFFICULTY_WEIGHT_SLOPE = 0.15
export const CENTER_DIFFICULTY = 3

export type QuestionTargetTimeInput = {
  id: string
  difficulty?: number | null
}

function clampDifficulty(difficulty: number | null | undefined): number {
  if (typeof difficulty !== "number" || !Number.isFinite(difficulty)) return CENTER_DIFFICULTY
  return Math.min(5, Math.max(1, difficulty))
}

export function difficultyWeight(difficulty: number | null | undefined): number {
  return 1 + DIFFICULTY_WEIGHT_SLOPE * (clampDifficulty(difficulty) - CENTER_DIFFICULTY)
}

function sectionBudgetSeconds(): number {
  return Math.round(BUFFER_FACTOR * SECTION_SECONDS)
}

export function allocateQuestionTargetTimes(
  questions: QuestionTargetTimeInput[],
): Record<string, number> {
  if (questions.length === 0) return {}

  const budget = sectionBudgetSeconds()
  const weights = questions.map((q) => difficultyWeight(q.difficulty))
  const weightSum = weights.reduce((sum, w) => sum + w, 0)
  if (weightSum <= 0) {
    const even = Math.floor(budget / questions.length)
    const leftover = budget - even * questions.length
    const out: Record<string, number> = {}
    questions.forEach((q, i) => {
      out[q.id] = even + (i < leftover ? 1 : 0)
    })
    return out
  }

  const exact = weights.map((w) => (budget * w) / weightSum)
  const floors = exact.map((n) => Math.floor(n))
  let remaining = budget - floors.reduce((sum, n) => sum + n, 0)
  const order = exact
    .map((n, i) => ({ i, frac: n - floors[i]! }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)

  const seconds = [...floors]
  for (let k = 0; k < remaining; k += 1) {
    const idx = order[k]?.i
    if (idx == null) break
    seconds[idx] = (seconds[idx] ?? 0) + 1
  }

  const out: Record<string, number> = {}
  questions.forEach((q, i) => {
    out[q.id] = seconds[i] ?? 0
  })
  return out
}

export function allocateQuestionTargetTimesByGroup(
  questions: Array<QuestionTargetTimeInput & { groupKey: string }>,
): Record<string, number> {
  const groups = new Map<string, QuestionTargetTimeInput[]>()
  for (const question of questions) {
    const list = groups.get(question.groupKey) ?? []
    list.push(question)
    groups.set(question.groupKey, list)
  }
  const out: Record<string, number> = {}
  for (const list of groups.values()) {
    Object.assign(out, allocateQuestionTargetTimes(list))
  }
  return out
}

export function isFiniteTargetSeconds(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}
