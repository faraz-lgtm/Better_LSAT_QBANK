import { useEffect } from "react"

import { clearProduktlyUser, identifyProduktlyUser } from "@/lib/analytics/produktly"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/**
 * Keeps Produktly identity in sync with Supabase auth.
 * Identify on session; clear on sign-out.
 */
export function ProduktlyAuthBridge() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          clearProduktlyUser()
          return
        }
        const user = session.user
        identifyProduktlyUser(user.id, {
          email: user.email ?? undefined,
          createdAt: user.created_at,
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
