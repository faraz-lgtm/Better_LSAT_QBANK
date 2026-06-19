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

export function prepTestHeaderLabel(moduleId: string | null, prepTestTitle: string | null): string {
  const moduleMatch = moduleId?.match(/^LSAC(\d+)/i)
  if (moduleMatch) return `PT${moduleMatch[1]}`

  const trimmed = prepTestTitle?.trim()
  if (trimmed) {
    const ptMatch = trimmed.match(/^PT\s*(\d+)/i)
    if (ptMatch) return `PT${ptMatch[1]}`
    const prepMatch = trimmed.match(/PrepTest\s+(\d+)/i)
    if (prepMatch) return `PT${prepMatch[1]}`
    if (/^PrepTest\s*/i.test(trimmed)) return trimmed.replace(/^PrepTest\s*/i, "PT").replace(/\s+/g, "")
  }

  return "PrepTest"
}

export function isPrepTestSectionIntroActive(searchParams: URLSearchParams, blindReviewMode: boolean): boolean {
  return Boolean(searchParams.get("prepTestId") && !blindReviewMode && searchParams.get("started") !== "1")
}
