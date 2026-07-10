import { useEffect } from "react"

import { createUsersApi } from "@/lib/api/users"
import {
  hasLawHubLoginBeenLoggedThisSession,
  markLawHubLoginLoggedThisSession,
} from "@/lib/auth/lawhub-session-log"
import { needsLsacLink } from "@/lib/auth/needs-lsac-link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/** Fire required LSAC login log once per session when the student has a coaching id. */
export function useLawHubSessionLoginLog(): void {
  useEffect(() => {
    if (hasLawHubLoginBeenLoggedThisSession()) return

    let alive = true
    const usersApi = createUsersApi(getSupabaseBrowserClient())

    void usersApi
      .getMyProfile()
      .then((profile) => {
        if (!alive || !profile || needsLsacLink(profile)) return
        return usersApi.lawHubLogLogin()
      })
      .then(() => {
        if (!alive) return
        markLawHubLoginLoggedThisSession()
      })
      .catch(() => {
        // Non-blocking: server persists failed attempts in lsac_log_events.
      })

    return () => {
      alive = false
    }
  }, [])
}
