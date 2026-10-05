import posthog from 'posthog-js'

export const AnalyticsEvent = {
  intentSelected: 'intent_selected',
  signupStarted: 'signup_started',
  userLoggedIn: 'user_logged_in',
  authCompleted: 'auth_completed',
  onboardingCompleted: 'onboarding_completed',
  diagnosticStarted: 'diagnostic_started',
  diagnosticCompleted: 'diagnostic_completed',
  checkoutStarted: 'checkout_started',
  practiceSessionStarted: 'practice_session_started',
  practiceSessionCompleted: 'practice_session_completed',
  prepCourseLessonCompleted: 'prep_course_lesson_completed',
} as const

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent]

let initialized = false

function getToken(): string {
  return (import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string | undefined)?.trim() ?? ''
}

function getHost(): string {
  return (
    (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined)?.trim() ||
    'https://e.bettermcat.com'
  )
}

/** Initialize PostHog once. No-ops when the project token is missing. */
export function initPostHog(): typeof posthog | null {
  if (initialized) return posthog
  const token = getToken()
  if (!token) return null

  posthog.init(token, {
    api_host: getHost(),
    defaults: '2026-05-30',
  })
  initialized = true
  return posthog
}

export function isPostHogReady(): boolean {
  return initialized
}

/** @internal Reset init flag between Vitest cases. */
export function resetPostHogForTests(): void {
  initialized = false
}

export function captureEvent(
  event: AnalyticsEventName | (string & {}),
  properties?: Record<string, unknown>,
): void {
  if (!initialized) return
  posthog.capture(event, properties)
}

export function identifyUser(
  distinctId: string,
  properties?: Record<string, unknown>,
): void {
  if (!initialized || !distinctId) return
  posthog.identify(distinctId, properties)
}

export function resetUser(): void {
  if (!initialized) return
  posthog.reset()
}

export function captureException(error: unknown, additionalProperties?: Record<string, unknown>): void {
  if (!initialized) return
  posthog.captureException(error, additionalProperties)
}

export { posthog }
