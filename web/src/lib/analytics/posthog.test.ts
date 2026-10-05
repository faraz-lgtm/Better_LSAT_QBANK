import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const capture = vi.fn()
const identify = vi.fn()
const reset = vi.fn()
const captureException = vi.fn()
const init = vi.fn()

vi.mock('posthog-js', () => ({
  default: {
    init,
    capture,
    identify,
    reset,
    captureException,
  },
}))

describe('posthog analytics helper', () => {
  beforeEach(() => {
    vi.resetModules()
    capture.mockClear()
    identify.mockClear()
    reset.mockClear()
    captureException.mockClear()
    init.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('initPostHog no-ops when token is missing', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', '')
    const { initPostHog, captureEvent, isPostHogReady, resetPostHogForTests } = await import(
      './posthog'
    )
    resetPostHogForTests()
    expect(initPostHog()).toBeNull()
    expect(isPostHogReady()).toBe(false)
    captureEvent('intent_selected', { intent: 'mini' })
    expect(init).not.toHaveBeenCalled()
    expect(capture).not.toHaveBeenCalled()
  })

  it('initPostHog initializes and helpers call through', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test')
    vi.stubEnv('VITE_PUBLIC_POSTHOG_HOST', 'https://e.bettermcat.com')
    const {
      initPostHog,
      captureEvent,
      identifyUser,
      resetUser,
      captureException: captureEx,
      isPostHogReady,
      resetPostHogForTests,
      AnalyticsEvent,
    } = await import('./posthog')
    resetPostHogForTests()

    const client = initPostHog()
    expect(client).not.toBeNull()
    expect(isPostHogReady()).toBe(true)
    expect(init).toHaveBeenCalledWith('phc_test', {
      api_host: 'https://e.bettermcat.com',
      defaults: '2026-05-30',
    })

    captureEvent(AnalyticsEvent.intentSelected, { intent: 'mini' })
    identifyUser('user-1', { email: 'a@b.com' })
    resetUser()
    captureEx(new Error('boom'))

    expect(capture).toHaveBeenCalledWith('intent_selected', { intent: 'mini' })
    expect(identify).toHaveBeenCalledWith('user-1', { email: 'a@b.com' })
    expect(reset).toHaveBeenCalledOnce()
    expect(captureException).toHaveBeenCalledOnce()
  })
})
