import type { PrepTestDetailResponse } from "@/features/student/preptests/preptest-types"

type CacheEntry = {
  detail: PrepTestDetailResponse
  savedAt: number
}

const memory = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<PrepTestDetailResponse>>()
/** Long enough for list→hub and section→hub back-nav without a blocking reload. */
const TTL_MS = 5 * 60_000

export function getCachedPrepTestDetail(prepTestId: string): PrepTestDetailResponse | null {
  const entry = memory.get(prepTestId)
  if (!entry) return null
  if (Date.now() - entry.savedAt > TTL_MS) {
    memory.delete(prepTestId)
    return null
  }
  return entry.detail
}

export function cachePrepTestDetail(prepTestId: string, detail: PrepTestDetailResponse): void {
  memory.set(prepTestId, { detail, savedAt: Date.now() })
}

export function clearPrepTestDetailCache(prepTestId?: string): void {
  if (prepTestId) {
    memory.delete(prepTestId)
    inflight.delete(prepTestId)
    return
  }
  memory.clear()
  inflight.clear()
}

export function getInflightPrepTestDetail(
  prepTestId: string,
): Promise<PrepTestDetailResponse> | undefined {
  return inflight.get(prepTestId)
}

export function setInflightPrepTestDetail(
  prepTestId: string,
  promise: Promise<PrepTestDetailResponse>,
): void {
  inflight.set(prepTestId, promise)
}

export function clearInflightPrepTestDetail(prepTestId: string): void {
  inflight.delete(prepTestId)
}
