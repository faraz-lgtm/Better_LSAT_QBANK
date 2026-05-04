/**
 * Base URL for links returned to browsers (storage public URLs, etc.).
 * Edge functions often see SUPABASE_URL=http://kong:8000 (Docker-internal); browsers cannot resolve `kong`.
 */
export function browserFacingSupabaseApiBaseUrl(): string {
  const explicit = (Deno.env.get("SUPABASE_PUBLIC_URL") ?? Deno.env.get("PUBLIC_SUPABASE_URL"))?.trim().replace(/\/$/, "")
  if (explicit) return explicit

  const internal = Deno.env.get("SUPABASE_URL")?.trim().replace(/\/$/, "") ?? ""
  if (!internal) return ""

  try {
    const u = new URL(internal)
    if (u.hostname === "kong" || u.hostname.endsWith(".kong")) {
      const port = (Deno.env.get("SUPABASE_PUBLIC_API_PORT") ?? "54321").trim() || "54321"
      return `http://127.0.0.1:${port}`
    }
  } catch {
    /* ignore invalid SUPABASE_URL */
  }

  return internal
}
