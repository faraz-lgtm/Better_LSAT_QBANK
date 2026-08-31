/** Split HTML into top-level `<p>...</p>` blocks (order preserved). */
export function extractHtmlParagraphs(html: string): string[] {
  const matches = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi)
  return matches ? [...matches] : []
}

/** Strip tags for segment text_excerpt storage. */
export function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export type PassageParagraphAnalysis = {
  /** Display label, e.g. `P1`. */
  label: string
  /** 1-based paragraph index. */
  index: number
  passageHtml: string
  explanationHtml: string
  textExcerpt: string
}

/**
 * Pair passage `<p>` tags with explanation `<p>` tags as P1, P2, …
 * Uses the shorter of the two lists when counts differ.
 */
export function buildPassageParagraphAnalyses(
  passageHtml: string,
  explanationHtml: string,
): PassageParagraphAnalysis[] {
  const passagePs = extractHtmlParagraphs(passageHtml)
  const explanationPs = extractHtmlParagraphs(explanationHtml)
  const count = Math.min(passagePs.length, explanationPs.length)
  const out: PassageParagraphAnalysis[] = []
  for (let i = 0; i < count; i++) {
    const passage = passagePs[i] ?? ""
    const explanation = explanationPs[i] ?? ""
    if (!explanation.trim()) continue
    const index = i + 1
    out.push({
      label: `P${index}`,
      index,
      passageHtml: passage,
      explanationHtml: explanation,
      textExcerpt: stripHtmlToText(passage) || `Paragraph ${index}`,
    })
  }
  return out
}
