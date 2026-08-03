import { useCallback, useEffect, useState } from 'react'

import { createUsersApi } from '@/lib/api/users'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type DiagnosticSubscriptionState = {
  hasActiveCore: boolean
  loading: boolean
  error: string | null
  refresh: () => void
}

function useDiagnosticSubscription(): DiagnosticSubscriptionState {
  const [hasActiveCore, setHasActiveCore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1)
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)

    const usersApi = createUsersApi(getSupabaseBrowserClient())
    void usersApi
      .getEntitlementState()
      .then((entitlement) => {
        if (!alive) return
        setHasActiveCore(entitlement.hasActiveCore)
      })
      .catch((err) => {
        if (!alive) return
        setHasActiveCore(false)
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [refreshToken])

  return { hasActiveCore, loading, error, refresh }
}

export { useDiagnosticSubscription }
