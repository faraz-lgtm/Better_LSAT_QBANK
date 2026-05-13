/** Maps low-level network failures from `fetch` into actionable UI copy. */
export function formatSupabaseCallError(err: Error): string {
  if (err.message === "Failed to fetch") {
    return "Cannot reach Supabase from this browser (network error). Use pnpm run dev:prod with hosted VITE_SUPABASE_* in web/.env, or run supabase start for pnpm run dev. Add your dev URL (e.g. http://localhost:5175/auth/callback) to Supabase Auth redirect allow-list. Try another browser, incognito, or disable extensions blocking *.supabase.co."
  }
  return err.message
}
