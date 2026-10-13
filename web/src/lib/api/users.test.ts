import { FunctionsHttpError } from '@supabase/functions-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resetUnauthorizedSessionHandlingForTests } from '@/lib/auth/handle-unauthorized-session'
import { createUsersApi } from './users'

function mockSupabase(invokeImpl: ReturnType<typeof vi.fn>, accessToken: string | null = null): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: accessToken ? { access_token: accessToken } : null },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    functions: { invoke: invokeImpl },
  } as unknown as SupabaseClient
}

describe('createUsersApi', () => {
  afterEach(() => {
    resetUnauthorizedSessionHandlingForTests()
    vi.unstubAllGlobals()
  })
  it('getMyProfile invokes users function with GET', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { profile: null },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    await api.getMyProfile()
    expect(invoke).toHaveBeenCalledWith('users', { method: 'GET' })
  })

  it('ping invokes users-ping with POST body', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: true, module: 'users' },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke, 't1'))
    const out = await api.ping()
    expect(out.module).toBe('users')
    expect(invoke).toHaveBeenCalledWith('users-ping', {
      method: 'POST',
      body: {},
      headers: { Authorization: 'Bearer t1' },
    })
  })

  it('lawHubTokenCheck calls users-lawhub-token-check', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: true, lawhub: 'connected' },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    await api.lawHubTokenCheck()
    expect(invoke).toHaveBeenCalledWith('users-lawhub-token-check', {
      method: 'POST',
      body: {},
      headers: {},
    })
  })

  it('lawHubInvite forwards invite fields', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { profile: { id: '1' } },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    await api.lawHubInvite({
      firstName: 'A',
      lastName: 'B',
      isPrepPlusRequired: true,
      isPrepPlusIncludedFromVendor: false,
    })
    expect(invoke).toHaveBeenCalledWith('users-lawhub-invite', {
      method: 'POST',
      body: {
        firstName: 'A',
        lastName: 'B',
        isPrepPlusRequired: true,
        isPrepPlusIncludedFromVendor: false,
      },
      headers: {},
    })
  })

  it('lawHubLink calls users-lawhub-link with path', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { profile: { id: '1', student_coaching_id: 'coach-1' } },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    await api.lawHubLink({ firstName: 'A', lastName: 'B', path: 'existing' })
    expect(invoke).toHaveBeenCalledWith('users-lawhub-link', {
      method: 'POST',
      body: { firstName: 'A', lastName: 'B', path: 'existing' },
      headers: {},
    })
  })

  it('getEntitlementState requests users-get-entitlement-state', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        entitlement: {
          isAuthenticated: true,
          isLsacLinked: true,
          isLsacEligible: true,
          hasActiveCore: true,
          accessState: 'FULL_ACCESS',
        },
      },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    const entitlement = await api.getEntitlementState()
    expect(entitlement.accessState).toBe('FULL_ACCESS')
    expect(invoke).toHaveBeenCalledWith('users-get-entitlement-state', {
      method: 'POST',
      body: {},
      headers: {},
    })
  })

  it('adminListProfiles sends users-admin-list-profiles', async () => {
    const row = {
      id: 'u1',
      email: 'admin@example.com',
      full_name: 'Admin',
      role: 'admin' as const,
      student_coaching_id: null,
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const invoke = vi.fn().mockResolvedValue({
      data: { rows: [row] },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    const rows = await api.adminListProfiles(25)
    expect(invoke).toHaveBeenCalledWith('users-admin-list-profiles', {
      method: 'POST',
      body: { limit: 25 },
      headers: {},
    })
    expect(rows).toEqual([row])
  })

  it('completeFirstLogin posts to users with action', async () => {
    const profile = {
      id: 'u1',
      email: 'u@example.com',
      full_name: 'User',
      role: 'student' as const,
      student_coaching_id: null,
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const invoke = vi.fn().mockResolvedValue({
      data: { profile },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke, 't1'))
    const out = await api.completeFirstLogin()
    expect(out.is_first_time_login).toBe(false)
    expect(invoke).toHaveBeenCalledWith('users', {
      method: 'POST',
      body: { action: 'users-complete-first-login' },
      headers: { Authorization: 'Bearer t1' },
    })
  })

  it('saveOnboarding invokes users-save-onboarding', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        profile: { id: 'u1', full_name: 'Ada Lovelace', first_name: 'Ada', last_name: 'Lovelace' },
        preferences: { userId: 'u1', goalScore: 170 },
      },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    await api.saveOnboarding({
      firstName: 'Ada',
      lastName: 'Lovelace',
      goalScore: '170',
      startingScore: "I haven't taken an LSAT yet",
    })
    expect(invoke).toHaveBeenCalledWith('users-save-onboarding', {
      method: 'POST',
      body: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        goalScore: '170',
        startingScore: "I haven't taken an LSAT yet",
      },
      headers: {},
    })
  })

  it('getStudyContext invokes users-get-study-context', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { preferences: null, officialScores: [] },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    const ctx = await api.getStudyContext()
    expect(ctx.officialScores).toEqual([])
    expect(invoke).toHaveBeenCalledWith('users-get-study-context', {
      method: 'POST',
      body: {},
      headers: {},
    })
  })

  it('getStudyContext signs out and redirects on Unauthorized', async () => {
    const replace = vi.fn()
    vi.stubGlobal('location', { pathname: '/app', replace })
    resetUnauthorizedSessionHandlingForTests()

    const unauthorized = new FunctionsHttpError(
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const invoke = vi.fn().mockResolvedValue({ data: null, error: unauthorized })
    const supabase = mockSupabase(invoke, 't1')
    const api = createUsersApi(supabase)

    await expect(api.getStudyContext()).rejects.toThrow()
    expect(supabase.auth.signOut).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith('/login')
  })

  it('upsertOfficialScore invokes users-upsert-official-score', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { score: { id: 's1', testLabel: 'June 2025', scaledScore: 160 } },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    const score = await api.upsertOfficialScore({ testLabel: 'June 2025', scaledScore: 160 })
    expect(score.scaledScore).toBe(160)
    expect(invoke).toHaveBeenCalledWith('users-upsert-official-score', {
      method: 'POST',
      body: { testLabel: 'June 2025', scaledScore: 160 },
      headers: {},
    })
  })

  it('updateAccountAvatar posts avatarUrl to users', async () => {
    const profile = {
      id: 'u1',
      email: 'u@example.com',
      full_name: 'User',
      first_name: 'User',
      last_name: null,
      phone: null,
      avatar_url: 'https://example.supabase.co/storage/v1/object/public/avatars/u1/a.jpg',
      role: 'student' as const,
      student_coaching_id: null,
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const invoke = vi.fn().mockResolvedValue({ data: { profile }, error: null })
    const api = createUsersApi(mockSupabase(invoke, 't1'))
    const out = await api.updateAccountAvatar(profile.avatar_url)
    expect(out.avatar_url).toBe(profile.avatar_url)
    expect(invoke).toHaveBeenCalledWith('users', {
      method: 'POST',
      body: { action: 'users-update-account-profile', avatarUrl: profile.avatar_url },
      headers: { Authorization: 'Bearer t1' },
    })
  })

  it('uploadAvatar uploads to storage then updates profile', async () => {
    const publicUrl =
      'https://example.supabase.co/storage/v1/object/public/avatars/user-1/photo.jpg'
    const profile = {
      id: 'user-1',
      email: 'u@example.com',
      full_name: 'User One',
      first_name: 'User',
      last_name: 'One',
      phone: null,
      avatar_url: publicUrl,
      role: 'student' as const,
      student_coaching_id: null,
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const upload = vi.fn().mockResolvedValue({ error: null })
    const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl } })
    const single = vi.fn().mockResolvedValue({ data: profile, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    const supabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 't1' } },
        }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      functions: { invoke: vi.fn() },
      storage: {
        from: vi.fn().mockReturnValue({ upload, getPublicUrl }),
      },
      from,
    } as unknown as SupabaseClient

    const api = createUsersApi(supabase)
    const file = new File(['avatar-bytes'], 'photo.jpg', { type: 'image/jpeg' })
    const out = await api.uploadAvatar(file)

    expect(out.avatar_url).toBe(publicUrl)
    expect(supabase.storage.from).toHaveBeenCalledWith('avatars')
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/.+\.jpg$/),
      file,
      { contentType: 'image/jpeg', upsert: true },
    )
    expect(from).toHaveBeenCalledWith('profiles')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ avatar_url: publicUrl }),
    )
  })

  it('deleteAvatar clears avatar_url and removes owned storage object', async () => {
    const publicUrl =
      'https://example.supabase.co/storage/v1/object/public/avatars/user-1/photo.jpg'
    const clearedProfile = {
      id: 'user-1',
      email: 'u@example.com',
      full_name: 'User One',
      first_name: 'User',
      last_name: 'One',
      phone: null,
      avatar_url: null,
      role: 'student' as const,
      student_coaching_id: null,
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const remove = vi.fn().mockResolvedValue({ data: [], error: null })
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { avatar_url: publicUrl },
      error: null,
    })
    const single = vi.fn().mockResolvedValue({ data: clearedProfile, error: null })
    const selectAfterUpdate = vi.fn().mockReturnValue({ single })
    const eqAfterUpdate = vi.fn().mockReturnValue({ select: selectAfterUpdate })
    const update = vi.fn().mockReturnValue({ eq: eqAfterUpdate })
    const selectBeforeUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    })
    const from = vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: selectBeforeUpdate, update }
      }
      return {}
    })
    const supabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 't1' } },
        }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      functions: { invoke: vi.fn() },
      storage: {
        from: vi.fn().mockReturnValue({ remove }),
      },
      from,
    } as unknown as SupabaseClient

    const api = createUsersApi(supabase)
    const out = await api.deleteAvatar()

    expect(out.avatar_url).toBeNull()
    expect(supabase.storage.from).toHaveBeenCalledWith('avatars')
    expect(remove).toHaveBeenCalledWith(['user-1/photo.jpg'])
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ avatar_url: null }),
    )
  })
})
