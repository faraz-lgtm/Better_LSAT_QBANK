/** Split HTML into top-level `<p>...</p>` blocks (order preserved). */
export function extractHtmlParagraphs(html: string): string[] {
  const matches = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi)
  return matches ? [...matches] : []
}
