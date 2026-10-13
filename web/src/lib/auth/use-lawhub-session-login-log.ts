import { useEffect } from "react"

import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { loadProfile, selectProfile } from "@/features/student-session/studentSessionSlice"
import { createUsersApi } from "@/lib/api/users"
import {
  hasLawHubLoginBeenLoggedThisSession,
  markLawHubLoginLoggedThisSession,
} from "@/lib/auth/lawhub-session-log"
import { needsLsacLink } from "@/lib/auth/needs-lsac-link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type IdleHandle = number

function scheduleIdle(cb: () => void): IdleHandle {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(() => cb(), { timeout: 4000 }) as IdleHandle
  }
  return window.setTimeout(cb, 1500) as IdleHandle
}

function cancelIdle(handle: IdleHandle): void {
  if (typeof window !== "undefined" && typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(handle)
    return
  }
  window.clearTimeout(handle)
}

/** Fire required LSAC login log once per session when the student has a coaching id. */
export function useLawHubSessionLoginLog(): void {
  const dispatch = useAppDispatch()
  const profile = useAppSelector(selectProfile)
  const profileStatus = useAppSelector((state) => state.studentSession.profileStatus)

  useEffect(() => {
    void dispatch(loadProfile())
  }, [dispatch])

  useEffect(() => {
    if (hasLawHubLoginBeenLoggedThisSession()) return
    if (profileStatus !== "succeeded") return
    if (!profile || needsLsacLink(profile)) {
      markLawHubLoginLoggedThisSession()
      return
    }

    let alive = true
    const usersApi = createUsersApi(getSupabaseBrowserClient())

    // Defer so first-route APIs (PrepTest pool, explanations, etc.) are not competing
    // with a multi-second LawHub login log on shell mount.
    const handle = scheduleIdle(() => {
      if (!alive || hasLawHubLoginBeenLoggedThisSession()) return
      void usersApi
        .lawHubLogLogin()
        .then(() => {
          if (!alive) return
          markLawHubLoginLoggedThisSession()
        })
        .catch(() => {
          // Non-blocking: server persists failed attempts in lsac_log_events.
        })
    })

    return () => {
      alive = false
      cancelIdle(handle)
    }
  }, [profile, profileStatus])
}
