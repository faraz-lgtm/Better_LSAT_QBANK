/** True when drill instructions contain visible uploaded HTML, not only empty tags. */
export function drillLessonHasBodyHtml(html: string | null | undefined): boolean {
  if (!html?.trim()) return false
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0
}
