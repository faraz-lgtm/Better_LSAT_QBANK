import { sanitizeHtml } from "@/lib/html/sanitize-html"

export function plainTextFromHtml(input: unknown): string {
  const html = sanitizeHtml(input)
  if (!html) return ""

  if (typeof document !== "undefined") {
    const el = document.createElement("div")
    el.innerHTML = html
    return (el.textContent ?? "").replace(/\s+/g, " ").trim()
  }

  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}
