import { FunctionsHttpError } from '@supabase/functions-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  handleUsersInvokeError,
  isUnauthorizedEdgeError,
  logoutAndRedirectToLogin,
  resetUnauthorizedSessionHandlingForTests,
} from './handle-unauthorized-session'

function unauthorizedError(): FunctionsHttpError {
  return new FunctionsHttpError(
    new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('isUnauthorizedEdgeError', () => {
  it('returns true for 401 Unauthorized edge payloads', async () => {
    await expect(isUnauthorizedEdgeError(unauthorizedError())).resolves.toBe(true)
  })

  it('returns false for other HTTP errors', async () => {
    const err = new FunctionsHttpError(
      new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    await expect(isUnauthorizedEdgeError(err)).resolves.toBe(false)
  })
})

describe('logoutAndRedirectToLogin', () => {
  const replace = vi.fn()

  beforeEach(() => {
    resetUnauthorizedSessionHandlingForTests()
    vi.stubGlobal('location', { pathname: '/app', replace })
  })

  afterEach(() => {
    resetUnauthorizedSessionHandlingForTests()
    vi.unstubAllGlobals()
  })

  it('signs out and redirects to login', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null })
    const supabase = { auth: { signOut } } as unknown as SupabaseClient

    await logoutAndRedirectToLogin(supabase)

    expect(signOut).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith('/login')
  })
})

describe('handleUsersInvokeError', () => {
  const replace = vi.fn()

  beforeEach(() => {
    resetUnauthorizedSessionHandlingForTests()
    vi.stubGlobal('location', { pathname: '/app', replace })
  })

  afterEach(() => {
    resetUnauthorizedSessionHandlingForTests()
    vi.unstubAllGlobals()
  })

  it('logs out and redirects before rethrowing Unauthorized', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null })
    const supabase = { auth: { signOut } } as unknown as SupabaseClient

    await expect(handleUsersInvokeError(supabase, unauthorizedError())).rejects.toThrow()

    expect(signOut).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith('/login')
  })
})
