import { assertEquals } from 'jsr:@std/assert@1'
import {
  adjustGoalAccuracyByDifficulty,
  assignRelativePriorityTiers,
  extraCorrectNeededPerTest,
  goalAccuracyFromScore,
  legacyPriorityLevel,
} from './goal-accuracy.ts'

Deno.test('goalAccuracyFromScore: 120 → 50%, 180 → 98%, 165 → 86%', () => {
  assertEquals(goalAccuracyFromScore(120), 50)
  assertEquals(goalAccuracyFromScore(180), 98)
  assertEquals(goalAccuracyFromScore(165), 86)
})

Deno.test('goalAccuracyFromScore clamps out-of-range scores', () => {
  assertEquals(goalAccuracyFromScore(100), 50)
  assertEquals(goalAccuracyFromScore(200), 98)
})

Deno.test('adjustGoalAccuracyByDifficulty spreads goals for a 180 target', () => {
  const base = goalAccuracyFromScore(180) // 98
  assertEquals(adjustGoalAccuracyByDifficulty(base, 1), 99) // easiest, clamped
  assertEquals(adjustGoalAccuracyByDifficulty(base, 2), 99) // easy, clamped
  assertEquals(adjustGoalAccuracyByDifficulty(base, 3), 98) // medium
  assertEquals(adjustGoalAccuracyByDifficulty(base, 4), 92) // hard
  assertEquals(adjustGoalAccuracyByDifficulty(base, 5), 86) // hardest
})

Deno.test('adjustGoalAccuracyByDifficulty spreads goals for a 165 target', () => {
  const base = goalAccuracyFromScore(165) // 86
  assertEquals(adjustGoalAccuracyByDifficulty(base, 1), 94)
  assertEquals(adjustGoalAccuracyByDifficulty(base, 2), 90)
  assertEquals(adjustGoalAccuracyByDifficulty(base, 3), 86)
  assertEquals(adjustGoalAccuracyByDifficulty(base, 4), 80)
  assertEquals(adjustGoalAccuracyByDifficulty(base, 5), 74)
})

Deno.test('adjustGoalAccuracyByDifficulty leaves base unchanged when difficulty unknown', () => {
  assertEquals(adjustGoalAccuracyByDifficulty(86, null), 86)
  assertEquals(adjustGoalAccuracyByDifficulty(86, undefined), 86)
})

Deno.test('extraCorrectNeededPerTest uses gap as percentage points', () => {
  // 16pp gap × 5 avg = 0.8 more correct per test
  assertEquals(extraCorrectNeededPerTest(16, 5), 0.8)
  assertEquals(extraCorrectNeededPerTest(0, 5), 0)
  assertEquals(extraCorrectNeededPerTest(-5, 5), 0)
  assertEquals(extraCorrectNeededPerTest(16, 0), null)
  assertEquals(extraCorrectNeededPerTest(null, 5), null)
})

Deno.test('assignRelativePriorityTiers buckets by quartiles of priorityScore', () => {
  const items = [
    { id: 'a', priorityScore: 40, rankable: true },
    { id: 'b', priorityScore: 30, rankable: true },
    { id: 'c', priorityScore: 20, rankable: true },
    { id: 'd', priorityScore: 10, rankable: true },
  ]
  const out = assignRelativePriorityTiers(items)
  const byId = Object.fromEntries(out.map((r) => [r.id, r.priorityTier]))
  assertEquals(byId.a, 'highest')
  assertEquals(byId.b, 'high')
  assertEquals(byId.c, 'medium')
  assertEquals(byId.d, 'low')
})

Deno.test('assignRelativePriorityTiers skips non-rankable tags', () => {
  const items = [
    { id: 'weak', priorityScore: 50, rankable: true },
    { id: 'locked', priorityScore: 99, rankable: false },
    { id: 'zero-avg', priorityScore: null, rankable: false },
    { id: 'ok', priorityScore: 5, rankable: true },
  ]
  const out = assignRelativePriorityTiers(items)
  assertEquals(out.find((r) => r.id === 'locked')?.priorityTier, null)
  assertEquals(out.find((r) => r.id === 'zero-avg')?.priorityTier, null)
  assertEquals(out.find((r) => r.id === 'weak')?.priorityTier, 'highest')
  // With 2 rankable tags, second sits at percentile 0.5 → medium quartile
  assertEquals(out.find((r) => r.id === 'ok')?.priorityTier, 'medium')
})

Deno.test('legacyPriorityLevel maps highest→high', () => {
  assertEquals(legacyPriorityLevel('highest'), 'high')
  assertEquals(legacyPriorityLevel('high'), 'high')
  assertEquals(legacyPriorityLevel('medium'), 'medium')
  assertEquals(legacyPriorityLevel('low'), 'low')
  assertEquals(legacyPriorityLevel(null), 'low')
})
