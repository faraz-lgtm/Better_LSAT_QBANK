import {
  cachePrepTestPool,
  getCachedPrepTestPool,
} from "@/features/student/preptests/prep-test-pool-cache"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const DEFAULT_KEY = { filter: "all" as const, sort: "newest" as const, pageSize: 5 }

let inflight: Promise<void> | null = null

/** Warm the PrepTest list cache (nav hover / focus). */
export function prefetchPrepTestPool(): void {
  if (getCachedPrepTestPool(DEFAULT_KEY)) return
  if (inflight) return

  inflight = (async () => {
    try {
      const api = createPracticeApi(getSupabaseBrowserClient())
      const result = await api.listPrepTestPool({
        page: 1,
        pageSize: DEFAULT_KEY.pageSize,
        sort: DEFAULT_KEY.sort,
      })
      cachePrepTestPool(DEFAULT_KEY, result)
    } catch {
      /* Prefetch is best-effort. */
    } finally {
      inflight = null
    }
  })()
}
