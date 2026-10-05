import { useEffect } from 'react'

import { identifyUser, resetUser } from '@/lib/analytics/posthog'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Keeps PostHog identity in sync with Supabase auth.
 * Identify on session; reset on sign-out.
 */
export function PostHogAuthBridge() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          resetUser()
          return
        }
        const user = session.user
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
