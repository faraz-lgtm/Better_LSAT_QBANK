import type { SupabaseClient } from '@supabase/supabase-js'

import { handleUsersInvokeError } from '@/lib/auth/handle-unauthorized-session'

export type AccessState = 'AUTH_REQUIRED' | 'PAYMENT_REQUIRED' | 'LSAC_REQUIRED' | 'FULL_ACCESS'

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
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'student' | 'admin' | 'super_admin'
  student_coaching_id: string | null
  is_first_time_login: boolean
  created_at: string
  updated_at: string
}

const AVATAR_BUCKET = 'avatars'
const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
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

export type ExtraTimeSetting = 'none' | '1.5x' | '2x' | 'custom'

export type StudentStudyPreferences = {
  userId: string
  username: string | null
  plannedLsatWindow: string | null
  plannedLsatDate: string | null
  lawSchoolCycle: string | null
  goalScore: number | null
  startingScore: number | null
  studyDays: string[]
  studyHoursLabel: string | null
  wantsLessons: boolean
  extraTimeSetting: ExtraTimeSetting
  extraTimeCustomMinutes: number | null
}

export type OfficialLsatScore = {
  id: string
  testLabel: string
  testDate: string | null
  scaledScore: number | null
  sortOrder: number
}

export type StudentStudyContext = {
  preferences: StudentStudyPreferences | null
  officialScores: OfficialLsatScore[]
}

export type SaveOnboardingInput = {
  firstName: string
  lastName: string
  /** @deprecated Prefer firstName + lastName */
  fullName?: string
  username?: string | null
  plannedLsatWindow?: string | null
  plannedLsatDate?: string | null
  lawSchoolCycle?: string | null
  goalScore?: string | number | null
  startingScore?: string | number | null
  studyDays?: string[]
  studyHoursLabel?: string | null
  wantsLessons?: boolean
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
    let result: { data: T | null; error: unknown }
    if (accessToken) {
      const nextHeaders = headers ?? {}
      nextHeaders.Authorization = `Bearer ${accessToken}`
      result = await supabase.functions.invoke<T>('users', {
        ...options,
        headers: nextHeaders,
      })
    } else {
      result = await supabase.functions.invoke<T>('users', {
        ...options,
      })
    }
    if (result.error) await handleUsersInvokeError(supabase, result.error)
    return result
  }

  async function invokeUsersPost<T>(
    functionName: string,
    body?: Record<string, unknown>,
  ): Promise<{ data: T | null; error: unknown }> {
    const maybeAuth = (supabase as unknown as {
      auth?: { getSession?: () => Promise<{ data: { session: { access_token?: string } | null } }> }
    }).auth
    const sessionResult = maybeAuth?.getSession ? await maybeAuth.getSession() : null
    const accessToken = sessionResult?.data?.session?.access_token
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
    const result = await supabase.functions.invoke<T>(functionName, {
      method: 'POST',
      body: body ?? {},
      headers,
    })
    if (result.error) await handleUsersInvokeError(supabase, result.error)
    return result
  }

  return {
    async getMyProfile(): Promise<UserProfile | null> {
      const { data, error } = await invokeUsers<{ profile: UserProfile | null }>({ method: 'GET' })
      if (error) throw error
      return data?.profile ?? null
    },

    async getEntitlementState(): Promise<UserEntitlement> {
      const { data, error } = await invokeUsersPost<{ entitlement: UserEntitlement }>('users-get-entitlement-state')
      if (error) throw error
      if (!data?.entitlement) throw new Error('No entitlement payload returned')
      return data.entitlement
    },

    async ping(): Promise<{ ok: boolean; module: string }> {
      const { data, error } = await invokeUsersPost<{ ok: boolean; module: string }>('users-ping')
      if (error) throw error
      if (!data) throw new Error('Empty users function response')
      return data
    },

    async syncProfileFromLsac(lsacStudent: Record<string, unknown>): Promise<UserProfile> {
      const { data, error } = await invokeUsersPost<{ profile: UserProfile }>('users-sync-lsac', { lsacStudent })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async lawHubTokenCheck(): Promise<{ ok: boolean; lawhub: string }> {
      const { data, error } = await invokeUsersPost<{
        ok: boolean
        lawhub: string
      }>('users-lawhub-token-check')
      if (error) throw error
      if (!data) throw new Error('Empty lawhub-token-check response')
      return data
    },

    async lawHubLookupEmail(): Promise<UserProfile> {
      const { data, error } = await invokeUsersPost<{ profile: UserProfile }>('users-lawhub-lookup-email')
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async lawHubRefresh(): Promise<UserProfile> {
      const { data, error } = await invokeUsersPost<{ profile: UserProfile }>('users-lawhub-refresh')
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
      const { data, error } = await invokeUsersPost<{ profile: UserProfile }>('users-lawhub-invite', { ...input })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async lawHubLink(input: {
      firstName: string
      lastName: string
      path: 'vendor' | 'existing'
    }): Promise<UserProfile> {
      const { data, error } = await invokeUsersPost<{ profile: UserProfile }>('users-lawhub-link', {
        ...input,
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async lawHubUpgradeSelf(): Promise<unknown> {
      const { data, error } = await invokeUsersPost<{ upgrade: unknown }>('users-lawhub-upgrade-self')
      if (error) throw error
      return data?.upgrade
    },

    async lawHubTestInstances(): Promise<unknown> {
      const { data, error } = await invokeUsersPost<{ instances: unknown }>('users-lawhub-test-instances')
      if (error) throw error
      return data?.instances
    },

    async lawHubLogLogin(): Promise<void> {
      const { error } = await invokeUsersPost('users-lawhub-log-login')
      if (error) throw error
    },

    async completeFirstLogin(): Promise<UserProfile> {
      const { data, error } = await invokeUsersPost<{ profile: UserProfile }>('users', {
        action: 'users-complete-first-login',
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async updateAccountProfile(input: { firstName: string; lastName: string }): Promise<UserProfile> {
      const { data, error } = await invokeUsersPost<{ profile: UserProfile }>('users', {
        action: 'users-update-account-profile',
        firstName: input.firstName,
        lastName: input.lastName,
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async updateAccountEmail(email: string): Promise<UserProfile | null> {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
      const { data, error: profileError } = await invokeUsersPost<{ profile: UserProfile }>('users', {
        action: 'users-update-account-profile',
        email,
      })
      if (profileError) throw profileError
      return data?.profile ?? null
    },

    async updateAccountPhone(phone: string): Promise<UserProfile> {
      const { data, error } = await invokeUsersPost<{ profile: UserProfile }>('users', {
        action: 'users-update-account-profile',
        phone,
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    async updateAccountAvatar(avatarUrl: string): Promise<UserProfile> {
      const { data, error } = await invokeUsersPost<{ profile: UserProfile }>('users', {
        action: 'users-update-account-profile',
        avatarUrl,
      })
      if (error) throw error
      if (!data?.profile) throw new Error('No profile in response')
      return data.profile
    },

    /**
     * Uploads a profile photo to the public `avatars` bucket (owner RLS), then
     * persists `avatar_url` via the users edge function.
     */
    async uploadAvatar(file: File): Promise<UserProfile> {
      const allowedExt = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
      const fromName = file.name.split('.').pop()?.trim().toLowerCase() ?? ''
      let fileExtension = allowedExt.has(fromName) ? fromName : AVATAR_MIME_TO_EXT[file.type] ?? ''
      if (!fileExtension) throw new Error('Unsupported image type; use JPG, PNG, GIF, or WebP')
      if (fileExtension === 'jpeg') fileExtension = 'jpg'
      if (file.size > AVATAR_MAX_BYTES) throw new Error('Image must be 5 MB or smaller')

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      const userId = userData.user?.id
      if (!userId) throw new Error('You must be signed in to upload a photo')

      const contentType = file.type || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
      const path = `${userId}/${crypto.randomUUID()}.${fileExtension}`
      const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
        contentType,
        upsert: true,
      })
      if (uploadError) {
        const msg = uploadError.message || 'Photo upload failed'
        if (/bucket not found|not found/i.test(msg)) {
          throw new Error('Avatar storage is not set up yet. Apply the avatars migration, then try again.')
        }
        throw new Error(msg)
      }

      const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
      if (!pub?.publicUrl) throw new Error('Could not resolve public photo URL')

      // Owner RLS on profiles; edge `updateAccountAvatar` remains available after deploy.
      const { data: updated, error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: pub.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('*')
        .single()
      if (profileError) throw profileError
      if (!updated) throw new Error('No profile in response')
      return updated as UserProfile
    },

    async updateAccountPassword(input: {
      currentPassword: string
      newPassword: string
    }): Promise<void> {
      const currentPassword = input.currentPassword.trim()
      const newPassword = input.newPassword.trim()
      if (!currentPassword) throw new Error('Current password is required')
      if (!newPassword) throw new Error('New password is required')
      if (currentPassword === newPassword) {
        throw new Error('New password must be different from the current password')
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      const email = userData.user?.email?.trim()
      if (!email) throw new Error('Email is required to change password')

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (verifyError) throw new Error('Current password is incorrect')

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },

    async saveOnboarding(input: SaveOnboardingInput): Promise<{
      profile: UserProfile
      preferences: StudentStudyPreferences
    }> {
      const { data, error } = await invokeUsersPost<{
        profile: UserProfile
        preferences: StudentStudyPreferences
      }>('users-save-onboarding', { ...input })
      if (error) throw error
      if (!data?.profile || !data.preferences) throw new Error('No onboarding payload returned')
      return data
    },

    async getStudyContext(): Promise<StudentStudyContext> {
      const { data, error } = await invokeUsersPost<StudentStudyContext>('users-get-study-context')
      if (error) throw error
      if (!data) throw new Error('No study context returned')
      return data
    },

    async updateStudyPreferences(input: {
      plannedLsatDate?: string | null
      plannedLsatWindow?: string | null
      lawSchoolCycle?: string | null
      goalScore?: number | null
      extraTimeSetting?: ExtraTimeSetting
      extraTimeCustomMinutes?: number | null
    }): Promise<StudentStudyPreferences> {
      const { data, error } = await invokeUsersPost<{ preferences: StudentStudyPreferences }>(
        'users-update-study-preferences',
        input,
      )
      if (error) throw error
      if (!data?.preferences) throw new Error('No preferences returned')
      return data.preferences
    },

    async upsertOfficialScore(input: {
      id?: string
      testLabel: string
      testDate?: string | null
      scaledScore?: number | null
      sortOrder?: number
    }): Promise<OfficialLsatScore> {
      const { data, error } = await invokeUsersPost<{ score: OfficialLsatScore }>(
        'users-upsert-official-score',
        input,
      )
      if (error) throw error
      if (!data?.score) throw new Error('No score returned')
      return data.score
    },

    async adminListProfiles(limit = 200): Promise<UserProfile[]> {
      const { data, error } = await invokeUsersPost<{ rows: UserProfile[] }>('users-admin-list-profiles', { limit })
      if (error) throw error
      return data?.rows ?? []
    },

    async adminListLsacSnapshots(limit = 200): Promise<AdminStudentSnapshot[]> {
      const { data, error } = await invokeUsersPost<{ rows: AdminStudentSnapshot[] }>(
        'users-admin-list-lsac-snapshots',
        { limit },
      )
      if (error) throw error
      return data?.rows ?? []
    },

    async adminListLsacTestInstances(limit = 200): Promise<AdminTestInstance[]> {
      const { data, error } = await invokeUsersPost<{ rows: AdminTestInstance[] }>(
        'users-admin-list-lsac-test-instances',
        { limit },
      )
      if (error) throw error
      return data?.rows ?? []
    },

    async adminListLsacLogEvents(limit = 200): Promise<AdminLogEvent[]> {
      const { data, error } = await invokeUsersPost<{ rows: AdminLogEvent[] }>('users-admin-list-lsac-log-events', {
        limit,
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async adminLsacSync(includeInstances = false): Promise<{
      rosterCount: number
      matchedProfiles: number
      snapshotsWritten: number
      testInstancesUpserted: number
      errors: string[]
    }> {
      const { data, error } = await invokeUsersPost<{
        result: {
          rosterCount: number
          matchedProfiles: number
          snapshotsWritten: number
          testInstancesUpserted: number
          errors: string[]
        }
      }>('users-admin-lsac-sync', { includeInstances })
      if (error) throw error
      if (!data?.result) throw new Error('No LSAC sync result returned')
      return data.result
    },
  }
}
