import type { SupabaseClient } from '@supabase/supabase-js'

export type AccessState = 'AUTH_REQUIRED' | 'LSAC_REQUIRED' | 'FULL_ACCESS'

export type UserEntitlement = {
  isAuthenticated: boolean
  isLsacLinked: boolean
  isLsacEligible: boolean
  hasActiveCore: boolean
  accessState: AccessState
}

export type UserProfile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'student' | 'admin' | 'super_admin'
  student_coaching_id: string | null
  is_first_time_login: boolean
  created_at: string
  updated_at: string
}

export type AdminStudentSnapshot = {
  id: number
  user_id: string
  student_coaching_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  linked: boolean | null
  subscription_type: string | null
  fetched_at: string
}

export type AdminTestInstance = {
  id: number
  user_id: string
  student_coaching_id: string
  test_instance_id: string
  test_id: string | null
  is_completed: boolean | null
  start_date: string | null
  end_date: string | null
  updated_at: string
}

export type AdminLogEvent = {
  id: number
  user_id: string
  student_coaching_id: string
  event_type: string
  status_code: number | null
  success: boolean
  error_message: string | null
  created_at: string
}

/**
 * Users domain API over Edge Functions. Inject `SupabaseClient` so tests can mock `functions.invoke`.
 */
export function createUsersApi(supabase: SupabaseClient) {
  async function invokeUsers<T>(
    options: Parameters<SupabaseClient['functions']['invoke']>[1],
  ): Promise<{ data: T | null; error: unknown }> {
    const maybeAuth = (supabase as unknown as {
      auth?: { getSession?: () => Promise<{ data: { session: { access_token?: string } | null } }> }
    }).auth
    const sessionResult = maybeAuth?.getSession ? await maybeAuth.getSession() : null
    const accessToken = sessionResult?.data?.session?.access_token

    const baseHeaders = (options?.headers as Record<string, string> | undefined) ?? undefined
    const headers = baseHeaders ? { ...baseHeaders } : undefined
    if (accessToken) {
      const nextHeaders = headers ?? {}
      nextHeaders.Authorization = `Bearer ${accessToken}`
      return await supabase.functions.invoke<T>('users', {
        ...options,
        headers: nextHeaders,
      })
    }

    return await supabase.functions.invoke<T>('users', {
      ...options,
    })
  }

  return {
    async getMyProfile(): Promise<UserProfile | null> {
      const { data, error } = await invokeUsers<{ profile: UserProfile | null }>({ method: 'GET' })
      if (error) throw error
      return data?.profile ?? null
    },

    async getEntitlementState(): Promise<UserEntitlement> {
      const { data, error } = await invokeUsers<{ entitlement: UserEntitlement }>({
        method: 'POST',
        body: { action: 'get-entitlement-state' },
      })
      if (error) throw error
      if (!data?.entitlement) throw new Error('No entitlement payload returned')
      return data.entitlement
    },

    async ping(): Promise<{ ok: boolean; module: string }> {
      const { data, error } = await invokeUsers<{ ok: boolean; module: string }>({
        method: 'POST',
        body: {},
      })
      if (error) throw error
      if (!data) throw new Error('Empty users function response')
      return data
    },

    async syncProfileFromLsac(lsacStudent: Record<string, unknown>): Promise<UserProfile> {
      const { data, error } = await invokeUsers<{ profile: UserProfile }>({
        method: 'POST',
        body: { action: 'sync-lsac', lsacStudent },
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async lawHubTokenCheck(): Promise<{ ok: boolean; lawhub: string }> {
      const { data, error } = await invokeUsers<{
        ok: boolean
        lawhub: string
      }>({ method: 'POST', body: { action: 'lawhub-token-check' } })
      if (error) throw error
      if (!data) throw new Error('Empty lawhub-token-check response')
      return data
    },

    async lawHubLookupEmail(): Promise<UserProfile> {
      const { data, error } = await invokeUsers<{ profile: UserProfile }>({
        method: 'POST',
        body: { action: 'lawhub-lookup-email' },
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async lawHubRefresh(): Promise<UserProfile> {
      const { data, error } = await invokeUsers<{ profile: UserProfile }>({
        method: 'POST',
        body: { action: 'lawhub-refresh' },
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async lawHubInvite(input: {
      firstName: string
      lastName: string
      isPrepPlusRequired: boolean
      isPrepPlusIncludedFromVendor: boolean
    }): Promise<UserProfile> {
      const { data, error } = await invokeUsers<{ profile: UserProfile }>({
        method: 'POST',
        body: { action: 'lawhub-invite', ...input },
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async lawHubUpgradeSelf(): Promise<unknown> {
      const { data, error } = await invokeUsers<{ upgrade: unknown }>({
        method: 'POST',
        body: { action: 'lawhub-upgrade-self' },
      })
      if (error) throw error
      return data?.upgrade
    },

    async lawHubTestInstances(): Promise<unknown> {
      const { data, error } = await invokeUsers<{ instances: unknown }>({
        method: 'POST',
        body: { action: 'lawhub-test-instances' },
      })
      if (error) throw error
      return data?.instances
    },

    async lawHubLogLogin(): Promise<void> {
      const { error } = await invokeUsers({
        method: 'POST',
        body: { action: 'lawhub-log-login' },
      })
      if (error) throw error
    },

    async completeFirstLogin(): Promise<UserProfile> {
      const { data, error } = await invokeUsers<{ profile: UserProfile }>({
        method: 'POST',
        body: { action: 'complete-first-login' },
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async adminListProfiles(limit = 200): Promise<UserProfile[]> {
      const { data, error } = await invokeUsers<{ rows: UserProfile[] }>({
        method: 'POST',
        body: { action: 'admin-list-profiles', limit },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async adminListLsacSnapshots(limit = 200): Promise<AdminStudentSnapshot[]> {
      const { data, error } = await invokeUsers<{ rows: AdminStudentSnapshot[] }>({
        method: 'POST',
        body: { action: 'admin-list-lsac-snapshots', limit },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async adminListLsacTestInstances(limit = 200): Promise<AdminTestInstance[]> {
      const { data, error } = await invokeUsers<{ rows: AdminTestInstance[] }>({
        method: 'POST',
        body: { action: 'admin-list-lsac-test-instances', limit },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async adminListLsacLogEvents(limit = 200): Promise<AdminLogEvent[]> {
      const { data, error } = await invokeUsers<{ rows: AdminLogEvent[] }>({
        method: 'POST',
        body: { action: 'admin-list-lsac-log-events', limit },
      })
      if (error) throw error
      return data?.rows ?? []
    },
  }
}
