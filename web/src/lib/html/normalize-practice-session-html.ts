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
  // Drop authoring colors so practice accessibility schemes can inherit
  "color",
  "background",
  "background-color",
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

function isBlankPracticeParagraph(element: Element): boolean {
  if (element.tagName !== "P") return false
  const text = (element.textContent ?? "").replace(/\u00a0/g, " ").trim()
  return text.length === 0 && !element.querySelector("img, table, hr, mark")
}

/** Drop empty LSAC spacer paragraphs so two-speaker stimuli do not show a multi-line hole. */
function removeBlankParagraphs(root: ParentNode) {
  root.querySelectorAll("p").forEach((paragraph) => {
    if (isBlankPracticeParagraph(paragraph)) paragraph.remove()
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
  removeBlankParagraphs(root)

  return root.innerHTML
}
