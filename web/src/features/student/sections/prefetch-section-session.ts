import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/** Warm section session cache (continue / intro hover) so mount can skip the network. */
export function prefetchSectionSession(sessionId: string): void {
  createPracticeApi(getSupabaseBrowserClient()).prefetchSectionSession(sessionId)
}
