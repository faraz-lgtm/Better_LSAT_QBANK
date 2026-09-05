import { assertEquals, assertAlmostEquals } from 'jsr:@std/assert@1'
import {
  BUFFER_FACTOR,
  SECTION_SECONDS,
  allocateQuestionTargetTimes,
  allocateQuestionTargetTimesByGroup,
  difficultyWeight,
} from './question-target-time.ts'

const SECTION_BUDGET = Math.round(BUFFER_FACTOR * SECTION_SECONDS)

Deno.test('difficultyWeight uses 1 + 0.15 × (difficulty − 3)', () => {
  assertEquals(difficultyWeight(1), 0.7)
  assertEquals(difficultyWeight(2), 0.85)
  assertEquals(difficultyWeight(3), 1)
  assertEquals(difficultyWeight(4), 1.15)
  assertEquals(difficultyWeight(5), 1.3)
})

Deno.test('difficultyWeight treats null and out-of-range as medium (3)', () => {
  assertEquals(difficultyWeight(null), 1)
  assertEquals(difficultyWeight(undefined), 1)
  assertEquals(difficultyWeight(0), difficultyWeight(1))
  assertEquals(difficultyWeight(9), difficultyWeight(5))
})

Deno.test('allocateQuestionTargetTimes returns empty map for no questions', () => {
  assertEquals(allocateQuestionTargetTimes([]), {})
})

Deno.test('25 medium questions share 1890 seconds (0.90 × 35 min)', () => {
  const questions = Array.from({ length: 25 }, (_, i) => ({ id: `q${i + 1}`, difficulty: 3 }))
  const out = allocateQuestionTargetTimes(questions)
  const values = Object.values(out)
  assertEquals(values.reduce((sum, n) => sum + n, 0), SECTION_BUDGET)
  assertEquals(SECTION_BUDGET, 1890)
  assertEquals(values.every((n) => n === 75 || n === 76), true)
})

Deno.test('null difficulty is allocated like medium', () => {
  const out = allocateQuestionTargetTimes([
    { id: 'a', difficulty: null },
    { id: 'b', difficulty: 3 },
  ])
  assertEquals(out.a, out.b)
  assertEquals((out.a ?? 0) + (out.b ?? 0), SECTION_BUDGET)
})

Deno.test('hardest question gets ~30% more time than medium', () => {
  const out = allocateQuestionTargetTimes([
    { id: 'hard', difficulty: 5 },
    { id: 'med', difficulty: 3 },
  ])
  assertAlmostEquals((out.hard ?? 0) / (out.med ?? 1), 1.3, 0.01)
  assertEquals((out.hard ?? 0) + (out.med ?? 0), SECTION_BUDGET)
})

Deno.test('allocateQuestionTargetTimesByGroup budgets each section independently', () => {
  const out = allocateQuestionTargetTimesByGroup([
    { id: 'lr1', difficulty: 3, groupKey: 'lr' },
    { id: 'lr2', difficulty: 3, groupKey: 'lr' },
    { id: 'rc1', difficulty: 3, groupKey: 'rc' },
  ])
  assertEquals((out.lr1 ?? 0) + (out.lr2 ?? 0), SECTION_BUDGET)
  assertEquals(out.rc1, SECTION_BUDGET)
})
