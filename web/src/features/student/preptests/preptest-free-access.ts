import type { AccessState } from "@/lib/api/users"

/** Free plan PrepTest allowance — all PrepTests stay locked until subscribe. */
export const FREE_PREPTEST_ALLOWANCE = 0

const FREE_INTRO_COPY =
  "Try a free PrepTest to gauge your starting point and see how to improve. When you're done, our Insights will tell you what to work on."

type PrepTestNumbered = {
  id: string
  prepTestNumber?: string | null
}

function prepTestNumberValue(item: PrepTestNumbered): number {
  const n = item.prepTestNumber ? Number.parseInt(item.prepTestNumber, 10) : NaN
  return Number.isFinite(n) ? n : 0
}

/** Newest-first ids for the free PrepTest allowance (by PrepTest number). */
function selectFreePrepTestIds(
  items: readonly PrepTestNumbered[],
  allowance: number = FREE_PREPTEST_ALLOWANCE,
): Set<string> {
  if (allowance <= 0) return new Set()
  const sorted = [...items].sort((a, b) => prepTestNumberValue(b) - prepTestNumberValue(a))
  return new Set(sorted.slice(0, allowance).map((item) => item.id))
}

function isFreePrepTestUnlocked(prepTestId: string, freeIds: ReadonlySet<string> | null | undefined): boolean {
  if (!freeIds || freeIds.size === 0) return false
  return freeIds.has(prepTestId)
}

function shouldLimitFreePrepTestAccess(input: {
  accessState?: AccessState | null
  hasActiveCore?: boolean | null
}): boolean {
  if (input.hasActiveCore) return false
  return input.accessState === "PAYMENT_REQUIRED"
}

export {
  FREE_INTRO_COPY,
  isFreePrepTestUnlocked,
  selectFreePrepTestIds,
  shouldLimitFreePrepTestAccess,
}
