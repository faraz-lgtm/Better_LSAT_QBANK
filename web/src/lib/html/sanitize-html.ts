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

const LESSON_TAGS = [
  ...ALLOWED_TAGS,
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "section",
  "header",
  "img",
  "hr",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "colgroup",
  "col",
  "caption",
  "pre",
  "code",
] as const

const ALLOWED_ATTR = ["class", "style", "href", "target", "rel", "data-highlight", "data-underline"] as const

const LESSON_ATTR = [
  ...ALLOWED_ATTR,
  "src",
  "alt",
  "title",
  "width",
  "height",
  "colspan",
  "rowspan",
  "colwidth",
  "span",
  "scope",
  "data-label",
  "data-lesson-section",
  "data-variant",
  "data-bg",
  "data-mt",
  "data-mr",
  "data-mb",
  "data-ml",
] as const

function purify(input: unknown, tags: readonly string[], attrs: readonly string[]): string {
  if (typeof input !== "string") return ""
  const trimmed = input.trim()
  if (!trimmed) return ""

  return DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [...tags],
    ALLOWED_ATTR: [...attrs],
    ALLOW_DATA_ATTR: false,
  })
}

export function sanitizeHtml(input: unknown): string {
  return purify(input, ALLOWED_TAGS, ALLOWED_ATTR)
}

export function sanitizeLessonHtml(input: unknown): string {
  if (typeof input !== "string") return ""
  const trimmed = input.trim()
  if (!trimmed) return ""

  // data-label holds plain callout titles (e.g. "The Conclusion:"). Without URI-safe
  // treatment, DOMPurify strips values that look like unknown protocols (word + ":").
  const safe = DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [...LESSON_TAGS],
    ALLOWED_ATTR: [...LESSON_ATTR],
    ALLOW_DATA_ATTR: false,
    ADD_URI_SAFE_ATTR: ["data-label"],
  })
  // Keep intentional blank lines from the lesson editor (empty <p> would collapse visually).
  return safe.replace(/<p(\b[^>]*)?>\s*<\/p>/gi, "<p$1><br></p>")
}
