const LAWHUB_LOGIN_LOG_KEY = 'betterlsat:lawhub-login-logged'

/** Session-scoped guard so LSAC login logging runs once per browser tab session. */
export function hasLawHubLoginBeenLoggedThisSession(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(LAWHUB_LOGIN_LOG_KEY) === '1'
}

export function markLawHubLoginLoggedThisSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LAWHUB_LOGIN_LOG_KEY, '1')
}

/** @internal Reset between Vitest cases. */
export function resetLawHubLoginSessionGuardForTests(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(LAWHUB_LOGIN_LOG_KEY)
}
