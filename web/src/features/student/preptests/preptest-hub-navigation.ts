export function prepTestHubHref(prepTestId: string, options?: { retake?: boolean }): string {
  const base = `/app/practice/preptest/${encodeURIComponent(prepTestId)}`
  return options?.retake ? `${base}?retake=1` : base
}

export function prepTestSectionIntroHref(
  prepTestId: string,
  sectionRowId: string,
  sessionId: string,
  options?: { retake?: boolean },
): string {
  const params = new URLSearchParams({ sessionId })
  if (options?.retake) params.set("retake", "1")
  return `/app/practice/preptest/${encodeURIComponent(prepTestId)}/section/${encodeURIComponent(sectionRowId)}?${params}`
}

export function sectionSessionHref(
  sessionId: string,
  options?: { prepTestId?: string | null; retake?: boolean; started?: boolean },
): string {
  const params = new URLSearchParams()
  if (options?.prepTestId) params.set("prepTestId", options.prepTestId)
  if (options?.retake) params.set("retake", "1")
  if (options?.started) params.set("started", "1")
  const qs = params.toString()
  const base = `/app/practice/sections/session/${encodeURIComponent(sessionId)}`
  return qs ? `${base}?${qs}` : base
}

export function isRetakePrepTestAttempt(searchParams: URLSearchParams): boolean {
  return searchParams.get("retake") === "1"
}
