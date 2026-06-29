type ErrorWithCode = Error & { code?: string }

/** Maps low-level network failures from `fetch` into actionable UI copy. */
export function formatSupabaseCallError(err: Error): string {
  if (err.message === "Failed to fetch") {
    return "Cannot reach Supabase from this browser (network error). Use pnpm run dev:prod with hosted VITE_SUPABASE_* in web/.env, or run supabase start for pnpm run dev. Add your dev URL (e.g. http://localhost:5175/auth/callback) to Supabase Auth redirect allow-list. Try another browser, incognito, or disable extensions blocking *.supabase.co."
  }

  const message = err.message.toLowerCase()
  if (message.includes("pkce") && message.includes("code verifier")) {
    return "This sign-in link was already used or opened in a different browser. Request a new magic link or sign in again from the same browser where you started."
  }

  const code = (err as ErrorWithCode).code
  if (code === "same_password") {
    return "That password is the same as your current account password. Use a different password (not the one you sign in with today). If you were sent a temporary password by an admin, pick something new. Try incognito or turn off password autofill if the fields keep filling in your old password."
  }

  return err.message
}

/** Prefer LSAC / edge-function JSON error bodies over raw HTTP wrapper text. */
export function formatEdgeFunctionError(err: unknown): string {
  const base = err instanceof Error ? formatSupabaseCallError(err) : 'Something went wrong.'
  const jsonTail = base.match(/HTTP \d+\s+(\{.*\})\s*$/s)
  if (jsonTail?.[1]) {
    try {
      const body = JSON.parse(jsonTail[1]) as { error?: string }
      if (body.error?.trim()) return body.error.trim()
    } catch {
      // ignore malformed JSON tail
    }
  }
  return base
}
