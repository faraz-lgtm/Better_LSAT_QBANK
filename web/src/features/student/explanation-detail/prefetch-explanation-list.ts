import {
  cacheExplanationPrepTestList,
  getCachedExplanationPrepTestList,
} from "@/features/student/explanation-detail/explanation-list-cache"
import { createExplanationsApi } from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const DEFAULT_KEY = { sort: "newest" as const, bookmarkedOnly: false }

let inflight: Promise<void> | null = null

/** Warm the explanations list cache (nav hover / focus). Prefers slim list for speed. */
export function prefetchExplanationList(): void {
  if (getCachedExplanationPrepTestList(DEFAULT_KEY)) return
  if (inflight) return

  inflight = (async () => {
    try {
      const api = createExplanationsApi(getSupabaseBrowserClient())
      const [list, statusCounts] = await Promise.all([
        api.listPrepTests({
          page: 1,
          pageSize: 5,
          offset: 0,
          sort: "newest",
          includeStatusCounts: false,
          includeDetails: false,
        }),
        api.getStatusCounts().catch(() => null),
      ])
      cacheExplanationPrepTestList(DEFAULT_KEY, {
        prepTests: list.prepTests,
        total: list.total,
        statusCounts: statusCounts ?? list.statusCounts,
      })
      // Hydrate row subtitles in the background without blocking navigation.
      void api
        .listPrepTests({
          page: 1,
          pageSize: 5,
          offset: 0,
          sort: "newest",
          includeStatusCounts: false,
          includeDetails: true,
        })
        .then((detailed) => {
          const cached = getCachedExplanationPrepTestList(DEFAULT_KEY)
          cacheExplanationPrepTestList(DEFAULT_KEY, {
            prepTests: detailed.prepTests,
            total: detailed.total,
            statusCounts: cached?.statusCounts ?? detailed.statusCounts,
          })
        })
        .catch(() => {
          /* Keep slim cache. */
        })
    } catch {
      /* Prefetch is best-effort. */
    } finally {
      inflight = null
    }
  })()
}
