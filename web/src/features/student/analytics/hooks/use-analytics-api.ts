import { useMemo } from "react"

import { createAnalyticsApi } from "@/lib/api/analytics"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function useAnalyticsApi() {
  return useMemo(() => {
    try {
      return createAnalyticsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])
}

export function usePracticeApi() {
  return useMemo(() => {
    try {
      return createPracticeApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])
}
