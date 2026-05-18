/**
 * When true, `/app/practice/preptest` routes render without a Supabase session so
 * designers and automated checks can exercise the PrepTest hub and section UI.
 *
 * Enabled when:
 * - `VITE_STUDENT_UI_PREVIEW=1` is set at build time (e.g. optional CI preview), or
 * - The app is a **non-production** bundle built with Vite `mode: emulator` (default `pnpm dev` in this repo).
 *
 * Production builds (`import.meta.env.PROD`) never enable this unless the explicit
 * env flag is set (avoid shipping that to real users).
 */
export function allowsPrepTestUnauthenticatedPreview(): boolean {
  if (import.meta.env.VITE_STUDENT_UI_PREVIEW === "1") return true
  if (import.meta.env.PROD) return false
  return import.meta.env.MODE === "emulator"
}
