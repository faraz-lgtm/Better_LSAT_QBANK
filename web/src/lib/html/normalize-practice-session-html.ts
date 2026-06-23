import { sanitizeHtml } from "@/lib/html/sanitize-html"

const LAYOUT_STYLE_PROPS = new Set([
  "margin",
  "margin-left",
  "margin-right",
  "margin-top",
  "margin-bottom",
  "padding",
  "padding-left",
  "padding-right",
  "padding-top",
  "padding-bottom",
  "text-indent",
])

function stripLayoutStyles(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .filter((decl) => {
      const prop = decl.split(":")[0]?.trim().toLowerCase() ?? ""
      return !LAYOUT_STYLE_PROPS.has(prop)
    })
    .join("; ")
}

function unwrapBlockquotes(root: ParentNode) {
  let blockquotes = root.querySelectorAll("blockquote")
  while (blockquotes.length > 0) {
    const blockquote = blockquotes[0]!
    const parent = blockquote.parentNode
    if (!parent) break
    while (blockquote.firstChild) {
      parent.insertBefore(blockquote.firstChild, blockquote)
    }
    parent.removeChild(blockquote)
    blockquotes = root.querySelectorAll("blockquote")
  }
}

function stripLayoutInlineStyles(root: ParentNode) {
  root.querySelectorAll("[style]").forEach((element) => {
    const cleaned = stripLayoutStyles(element.getAttribute("style") ?? "")
    if (cleaned) element.setAttribute("style", cleaned)
    else element.removeAttribute("style")
  })
}

/** Flatten LSAC stimulus markup so speaker labels and argument body share the same left edge. */
export function normalizePracticeSessionHtml(input: unknown): string {
  const safe = sanitizeHtml(input)
  if (!safe) return ""

  if (typeof document === "undefined") return safe

  const doc = new DOMParser().parseFromString(`<div id="practice-html-root">${safe}</div>`, "text/html")
  const root = doc.getElementById("practice-html-root")
  if (!root) return safe

  unwrapBlockquotes(root)
  stripLayoutInlineStyles(root)

  return root.innerHTML
}
