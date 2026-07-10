import { FunctionsHttpError } from '@supabase/functions-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { throwIfEdgeInvokeFailed } from '@/lib/api/edge-invoke-error'

const LOGIN_PATH = '/login'

let handlingSessionExpiry = false

/** @internal Reset module guard between Vitest cases. */
export function resetUnauthorizedSessionHandlingForTests(): void {
  handlingSessionExpiry = false
}

/** True when an edge function returned HTTP 401 with `{ error: "Unauthorized" }`. */
export async function isUnauthorizedEdgeError(error: unknown): Promise<boolean> {
  if (!(error instanceof FunctionsHttpError)) return false
  const response = error.context
  if (!(response instanceof Response) || response.status !== 401) return false
  try {
    const body = (await response.json()) as { error?: string }
    return body.error === 'Unauthorized'
  } catch {
    return false
  }
}

export async function logoutAndRedirectToLogin(supabase: SupabaseClient): Promise<void> {
  if (handlingSessionExpiry) return
  handlingSessionExpiry = true
  try {
    await supabase.auth.signOut()
  } catch {
    // Still redirect so stale UI cannot keep calling protected endpoints.
  }
  if (typeof window !== 'undefined' && window.location.pathname !== LOGIN_PATH) {
    window.location.replace(LOGIN_PATH)
  }
}

/** Signs out and sends the browser to login when the users edge function rejects the session. */
export async function handleUsersInvokeError(
  supabase: SupabaseClient,
  error: unknown,
): Promise<never> {
  if (await isUnauthorizedEdgeError(error)) {
    await logoutAndRedirectToLogin(supabase)
  }
  return throwIfEdgeInvokeFailed(error)
}
