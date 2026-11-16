/**
 * Normalize Zoom AI Companion meeting summary payloads
 * (webhook meeting.summary_completed + GET /meetings/{id}/meeting_summary).
 */

export type ZoomMeetingSummaryNormalized = {
  takeaways: string[]
  nextSteps: string[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function pushUnique(target: string[], value: string) {
  const trimmed = value.trim()
  if (!trimmed) return
  if (target.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) return
  target.push(trimmed)
}

function collectStringList(value: unknown, into: string[]) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') pushUnique(into, item)
      else {
        const rec = asRecord(item)
        const label =
          asString(rec?.label) ??
          asString(rec?.text) ??
          asString(rec?.content) ??
          asString(rec?.next_step)
        if (label) pushUnique(into, label)
      }
    }
    return
  }
  if (typeof value === 'string') {
    for (const line of value.split(/\r?\n/)) {
      const cleaned = line.replace(/^[-*•]\s+/, '').trim()
      if (cleaned) pushUnique(into, cleaned)
    }
  }
}

function sectionBody(markdown: string, headingPattern: RegExp): string | null {
  const match = markdown.match(headingPattern)
  return match?.[1]?.trim() ?? null
}

function takeawaysFromSummaryContent(markdown: string, into: string[]) {
  const overview =
    sectionBody(markdown, /(?:^|\n)#+\s*(?:overview|summary)\s*\n([\s\S]*?)(?=\n#+\s|\n*$)/i) ??
    null
  // Drop Next steps section so homework bullets do not become takeaways.
  const withoutNextSteps = markdown.replace(
    /(?:^|\n)#+\s*next\s*steps?\s*\n[\s\S]*?(?=\n#+\s|\n*$)/gi,
    '\n',
  )
  const source = overview ?? withoutNextSteps
  const lines = source
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  for (const line of lines) {
    if (line.startsWith('#')) continue
    const bullet = line.match(/^[-*•]\s+(.+)$/)
    if (bullet?.[1]) {
      pushUnique(into, bullet[1])
    } else {
      pushUnique(into, line)
    }
    if (into.length >= 8) return
  }
}

export function normalizeZoomMeetingSummary(payload: unknown): ZoomMeetingSummaryNormalized {
  const root = asRecord(payload) ?? {}
  // Webhook nests under payload.object; REST returns the summary object at top level.
  const object =
    asRecord(root.object) ??
    asRecord(asRecord(root.payload)?.object) ??
    root

  const nextSteps: string[] = []
  collectStringList(object.next_steps, nextSteps)

  const takeaways: string[] = []
  const overview = asString(object.summary_overview)
  if (overview) pushUnique(takeaways, overview)

  const details = object.summary_details
  if (Array.isArray(details)) {
    for (const item of details) {
      const rec = asRecord(item)
      const label = asString(rec?.label) ?? asString(rec?.summary) ?? asString(rec?.text)
      if (label) pushUnique(takeaways, label)
    }
  }

  const summaryContent = asString(object.summary_content)
  if (summaryContent) {
    // Newer Zoom field: full markdown. Prefer structured fields when present.
    if (takeaways.length === 0) takeawaysFromSummaryContent(summaryContent, takeaways)
    if (nextSteps.length === 0) {
      const nextSection = sectionBody(
        summaryContent,
        /(?:^|\n)#+\s*next\s*steps?\s*\n([\s\S]*?)(?=\n#+\s|\n*$)/i,
      )
      if (nextSection) collectStringList(nextSection, nextSteps)
    }
  }

  // Nested summary_content object shape used in some Zoom docs.
  const nestedContent = asRecord(object.summary_content)
  if (nestedContent) {
    const nestedSummary = asString(nestedContent.summary)
    if (nestedSummary && takeaways.length === 0) pushUnique(takeaways, nestedSummary)
    collectStringList(nestedContent.next_steps, nextSteps)
  }

  return { takeaways, nextSteps }
}
