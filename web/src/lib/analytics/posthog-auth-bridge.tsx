import { useEffect } from 'react'

import { identifyUser, resetUser } from '@/lib/analytics/posthog'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Keeps PostHog identity in sync with Supabase auth.
 * Identify on session; reset only on explicit sign-out (not on anonymous INITIAL_SESSION).
 */
export function PostHogAuthBridge() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          resetUser()
          return
        }
        const user = session?.user
        if (!user) return
        identifyUser(user.id, {
          email: user.email ?? undefined,
        })
      })
      unsubscribe = () => subscription.unsubscribe()
    } catch {
      // Missing Supabase env in tests / misconfigured builds — skip bridge.
    }

    return () => {
      unsubscribe?.()
    }
  }, [])

  return null
}
