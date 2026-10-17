import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const identifyUser = vi.fn()
const resetUser = vi.fn()
const unsubscribe = vi.fn()

let authListener:
  | ((event: string, session: { user?: { id: string; email?: string } } | null) => void)
  | undefined

vi.mock('@/lib/analytics/posthog', () => ({
  identifyUser: (...args: unknown[]) => identifyUser(...args),
  resetUser: (...args: unknown[]) => resetUser(...args),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: (
        cb: (event: string, session: { user?: { id: string; email?: string } } | null) => void,
      ) => {
        authListener = cb
        return { data: { subscription: { unsubscribe } } }
      },
    },
  }),
}))

describe('PostHogAuthBridge', () => {
  beforeEach(() => {
    identifyUser.mockReset()
    resetUser.mockReset()
    unsubscribe.mockReset()
    authListener = undefined
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('identifies when a session user is present', async () => {
    const { PostHogAuthBridge } = await import('./posthog-auth-bridge')
    render(<PostHogAuthBridge />)

    authListener?.('INITIAL_SESSION', {
      user: { id: 'user-1', email: 'a@b.com' },
    })

    expect(identifyUser).toHaveBeenCalledWith('user-1', { email: 'a@b.com' })
    expect(resetUser).not.toHaveBeenCalled()
  })

  it('does not reset on anonymous INITIAL_SESSION', async () => {
    const { PostHogAuthBridge } = await import('./posthog-auth-bridge')
    render(<PostHogAuthBridge />)

    authListener?.('INITIAL_SESSION', null)

    expect(resetUser).not.toHaveBeenCalled()
    expect(identifyUser).not.toHaveBeenCalled()
  })

  it('resets only on SIGNED_OUT', async () => {
    const { PostHogAuthBridge } = await import('./posthog-auth-bridge')
    render(<PostHogAuthBridge />)

    authListener?.('SIGNED_OUT', null)

    expect(resetUser).toHaveBeenCalledOnce()
    expect(identifyUser).not.toHaveBeenCalled()
  })
})
