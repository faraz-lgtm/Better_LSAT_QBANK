import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts"

function computeAtRisk(input: {
  isPaid: boolean
  daysInactive: number | null
  scoreNow: number | null
  scoreThen: number | null
}) {
  return (
    input.isPaid &&
    ((input.daysInactive ?? 999) >= 7 ||
      (input.scoreNow != null && input.scoreThen != null && input.scoreNow <= input.scoreThen - 5))
  )
}

function computeUpgradeCandidate(input: {
  isPaid: boolean
  hasDiagnostic: boolean
  lastActiveAt: string | null
  nowMs?: number
}) {
  const now = input.nowMs ?? Date.parse("2026-11-25T12:00:00Z")
  const last = input.lastActiveAt ? Date.parse(input.lastActiveAt) : null
  return (
    !input.isPaid &&
    input.hasDiagnostic &&
    last != null &&
    last >= now - 7 * 86400000
  )
}

Deno.test("at_risk when paid and inactive 7+ days", () => {
  assertEquals(computeAtRisk({ isPaid: true, daysInactive: 12, scoreNow: null, scoreThen: null }), true)
})

Deno.test("at_risk when paid and score fell 5+", () => {
  assertEquals(computeAtRisk({ isPaid: true, daysInactive: 1, scoreNow: 150, scoreThen: 160 }), true)
})

Deno.test("upgrade_candidate when free active diagnostic done", () => {
  assertEquals(
    computeUpgradeCandidate({
      isPaid: false,
      hasDiagnostic: true,
      lastActiveAt: "2026-11-24T12:00:00Z",
      nowMs: Date.parse("2026-11-25T12:00:00Z"),
    }),
    true,
  )
})

Deno.test("upgrade_candidate false when paid", () => {
  assertEquals(
    computeUpgradeCandidate({
      isPaid: true,
      hasDiagnostic: true,
      lastActiveAt: "2026-11-24T12:00:00Z",
    }),
    false,
  )
})
