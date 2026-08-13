/** Drill / standalone section results (not PrepTest results). */
export function practiceSessionResultsPath(
  sessionId: string,
  options?: { source?: "section" },
): string {
  const q = options?.source === "section" ? "?source=section" : ""
  return `/app/practice/results/${encodeURIComponent(sessionId)}${q}`
}
