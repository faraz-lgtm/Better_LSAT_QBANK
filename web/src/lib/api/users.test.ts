import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createUsersApi } from './users'

function mockSupabase(invokeImpl: ReturnType<typeof vi.fn>): SupabaseClient {
  return {
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

  it('ping invokes users function with POST body', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: true, module: 'users' },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    const out = await api.ping()
    expect(out.module).toBe('users')
    expect(invoke).toHaveBeenCalledWith('users', { method: 'POST', body: {} })
  })

  it('lawHubTokenCheck sends lawhub-token-check action', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { ok: true, lawhub: 'connected' },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    await api.lawHubTokenCheck()
    expect(invoke).toHaveBeenCalledWith('users', {
      method: 'POST',
      body: { action: 'lawhub-token-check' },
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
    expect(invoke).toHaveBeenCalledWith('users', {
      method: 'POST',
      body: {
        action: 'lawhub-invite',
        firstName: 'A',
        lastName: 'B',
        isPrepPlusRequired: true,
        isPrepPlusIncludedFromVendor: false,
      },
    })
  })

  it('getEntitlementState requests entitlement action', async () => {
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
    expect(invoke).toHaveBeenCalledWith('users', {
      method: 'POST',
      body: { action: 'get-entitlement-state' },
    })
  })

  it('adminListProfiles sends admin list action', async () => {
    const row = {
      id: 'u1',
      email: 'admin@example.com',
      full_name: 'Admin',
      role: 'admin' as const,
      student_coaching_id: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const invoke = vi.fn().mockResolvedValue({
      data: { rows: [row] },
      error: null,
    })
    const api = createUsersApi(mockSupabase(invoke))
    const rows = await api.adminListProfiles(25)
    expect(invoke).toHaveBeenCalledWith('users', {
      method: 'POST',
      body: { action: 'admin-list-profiles', limit: 25 },
    })
    expect(rows).toEqual([row])
  })
})
