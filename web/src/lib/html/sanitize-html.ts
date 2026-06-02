import DOMPurify from "dompurify"

const ALLOWED_TAGS = [
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "blockquote",
  "span",
  "div",
  "sub",
  "sup",
  "ul",
  "ol",
  "li",
  "a",
  "mark",
] as const

const ALLOWED_ATTR = ["class", "style", "href", "target", "rel", "data-highlight"] as const

export function sanitizeHtml(input: unknown): string {
  if (typeof input !== "string") return ""
  const trimmed = input.trim()
  if (!trimmed) return ""

  return DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    ALLOW_DATA_ATTR: false,
  })
}
