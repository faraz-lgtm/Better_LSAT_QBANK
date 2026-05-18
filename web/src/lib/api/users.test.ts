import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createUsersApi } from './users'

function mockSupabase(invokeImpl: ReturnType<typeof vi.fn>, accessToken: string | null = null): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: accessToken ? { access_token: accessToken } : null },
      }),
    },
    functions: { invoke: invokeImpl },
  } as unknown as SupabaseClient
}

describe('createUsersApi', () => {
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
})
