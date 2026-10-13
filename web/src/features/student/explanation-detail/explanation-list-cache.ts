import type {
  ExplanationPrepTestListItem,
  ExplanationStatusCounts,
} from "@/features/student/explanation-detail/explanation-tree-types"

export type ExplanationListCacheKey = {
  sort: "newest" | "oldest"
  bookmarkedOnly: boolean
}

export type ExplanationListCacheEntry = {
  prepTests: ExplanationPrepTestListItem[]
  total: number
  statusCounts: ExplanationStatusCounts
}

const listByKey = new Map<string, ExplanationListCacheEntry>()

export function explanationListCacheKey(key: ExplanationListCacheKey): string {
  return `${key.sort}:${key.bookmarkedOnly ? "bookmarked" : "all"}`
}

export function cacheExplanationPrepTestList(
  key: ExplanationListCacheKey,
  entry: ExplanationListCacheEntry,
): void {
  listByKey.set(explanationListCacheKey(key), {
    prepTests: entry.prepTests,
    total: entry.total,
    statusCounts: { ...entry.statusCounts },
  })
}

export function getCachedExplanationPrepTestList(
  key: ExplanationListCacheKey,
): ExplanationListCacheEntry | null {
  return listByKey.get(explanationListCacheKey(key)) ?? null
}

export function clearExplanationListCache(): void {
  listByKey.clear()
}
