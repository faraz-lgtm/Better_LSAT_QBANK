/** Drill / standalone section results (not PrepTest results). */
export function practiceSessionResultsPath(
  sessionId: string,
  options?: { source?: "section" | "drill"; returnTo?: string },
): string {
  const params = new URLSearchParams()
  if (options?.source) params.set("source", options.source)
  if (options?.returnTo?.trim()) params.set("returnTo", options.returnTo.trim())
  const q = params.toString()
  return `/app/practice/results/${encodeURIComponent(sessionId)}${q ? `?${q}` : ""}`
}
