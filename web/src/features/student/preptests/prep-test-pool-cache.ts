import type {
  PrepTestPoolFilter,
  PrepTestPoolListResult,
  PrepTestPoolSort,
} from "@/features/student/preptests/preptest-types"

export type PrepTestPoolCacheKey = {
  filter: PrepTestPoolFilter
  sort: PrepTestPoolSort
  pageSize: number
}

type CacheEntry = {
  result: PrepTestPoolListResult
  savedAt: number
}

const memory = new Map<string, CacheEntry>()
const TTL_MS = 60_000

function keyString(key: PrepTestPoolCacheKey): string {
  return `${key.filter}:${key.sort}:${key.pageSize}`
}

export function getCachedPrepTestPool(key: PrepTestPoolCacheKey): PrepTestPoolListResult | null {
  const entry = memory.get(keyString(key))
  if (!entry) return null
  if (Date.now() - entry.savedAt > TTL_MS) {
    memory.delete(keyString(key))
    return null
  }
  return entry.result
}

export function cachePrepTestPool(key: PrepTestPoolCacheKey, result: PrepTestPoolListResult): void {
  memory.set(keyString(key), { result, savedAt: Date.now() })
}

export function clearPrepTestPoolCache(): void {
  memory.clear()
}
