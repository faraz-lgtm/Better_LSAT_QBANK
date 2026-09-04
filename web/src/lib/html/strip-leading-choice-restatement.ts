import { plainTextFromHtml } from "@/lib/html/plain-text-from-html"

function normalizeComparable(text: string): string {
  return text
    .replace(/^[A-E]\s*[).:\-–—]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function isMostlyStrikeHtml(html: string): boolean {
  const withoutStrike = html
    .replace(/<\/?(?:s|del|strike)\b[^>]*>/gi, "")
    .replace(/\sstyle="[^"]*text-decoration:\s*line-through[^"]*"/gi, "")
    .replace(/\sstyle='[^']*text-decoration:\s*line-through[^']*'/gi, "")
  const remaining = plainTextFromHtml(withoutStrike)
  const original = plainTextFromHtml(html)
  if (!original) return false
  return remaining.length === 0 || remaining.length / original.length < 0.25
}

function isChoiceRestatement(blockHtml: string, choicePlain: string): boolean {
  const blockPlain = normalizeComparable(plainTextFromHtml(blockHtml))
  const choice = normalizeComparable(choicePlain)
  if (!blockPlain || !choice) return false
  if (blockPlain === choice) return true
  // Avoid false positives when choice text is a bare letter ("A") or other short stub.
  if (choice.length >= 12 && (blockPlain.includes(choice) || choice.includes(blockPlain))) {
    return true
  }
  return isMostlyStrikeHtml(blockHtml)
}

/** Top-level `<p>` / `<blockquote>` blocks (order preserved). */
function extractLeadingBlocks(html: string): string[] {
  const matches = html.match(/<(?:p|blockquote)\b[^>]*>[\s\S]*?<\/(?:p|blockquote)>/gi)
  return matches ? [...matches] : []
}

/**
 * CMS choice explanations often restate the answer in a leading
 * `<blockquote>A) …</blockquote>` (or struck `<p>`) before the real write-up.
 * The UI already shows the choice text in the row header — drop that leading
 * restatement so it is not repeated.
 */
export function stripLeadingChoiceRestatement(
  explanationHtml: string | null | undefined,
  choiceHtml: string | null | undefined,
): string {
  const html = explanationHtml?.trim() ?? ""
  if (!html) return ""

  const blocks = extractLeadingBlocks(html)
  if (blocks.length === 0) return html

  const choicePlain = plainTextFromHtml(choiceHtml ?? "")
  let start = 0
  while (start < blocks.length && isChoiceRestatement(blocks[start]!, choicePlain)) {
    start += 1
  }

  if (start === 0) return html
  if (start >= blocks.length) return ""

  const first = blocks[0]!
  const firstIndex = html.indexOf(first)
  if (firstIndex < 0) return blocks.slice(start).join("")

  // Drop everything through the last stripped block (preserves spacing/tags between remaining blocks).
  const lastStripped = blocks[start - 1]!
  const cutAt = html.indexOf(lastStripped) + lastStripped.length
  return html.slice(cutAt).replace(/^\s+/, "")
}
