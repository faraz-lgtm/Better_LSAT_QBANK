type ErrorWithCode = Error & { code?: string }

function supabaseUrlHint(): string {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ""
  const isLocal =
    url.includes("127.0.0.1") || url.includes("localhost") || url.startsWith("http://kong")
  if (isLocal) {
    return "Local Supabase is not reachable. Start Docker Desktop, then run `supabase start` from the repo root and use `pnpm run dev`. Or point `web/.env.production.local` at your hosted project (`https://<ref>.supabase.co` + anon key) for `pnpm run dev:prod`."
  }
  return "Cannot reach Supabase from this browser. Confirm VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in web/.env.production.local, add your dev URL (e.g. http://localhost:5175/auth/callback) to Supabase Auth → URL configuration, and try incognito if extensions block *.supabase.co."
}

/** Maps low-level network failures from `fetch` into actionable UI copy. */
export function formatSupabaseCallError(err: Error): string {
  if (err.message === "Failed to fetch") {
    return supabaseUrlHint()
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
