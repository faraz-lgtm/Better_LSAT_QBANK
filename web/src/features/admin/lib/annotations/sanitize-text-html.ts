/**
 * Allowlist for annotation text boxes: b, i, u, br, span with limited style.
 * Strips scripts, handlers, and unknown tags.
 */

const ALLOWED_BLOCK = new Set(["b", "i", "u", "br", "span"])

function sanitizeStyle(style: string): string {
  const parts = style
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
  const out: string[] = []
  for (const p of parts) {
    const colon = p.indexOf(":")
    if (colon < 0) continue
    const prop = p.slice(0, colon).trim().toLowerCase()
    const val = p.slice(colon + 1).trim()
    if (!val) continue
    const lowerVal = val.toLowerCase()
    if (lowerVal.includes("url(") || lowerVal.includes("expression(")) continue
    if (prop === "font-weight" && /^(bold|normal|\d+)$/.test(lowerVal)) out.push(`${prop}: ${val}`)
    else if (prop === "font-style" && /^(italic|normal)$/.test(lowerVal)) out.push(`${prop}: ${val}`)
    else if (prop === "text-decoration" && /^(underline|none)$/.test(lowerVal)) out.push(`${prop}: ${val}`)
    else if (prop === "color" && /^(#[0-9a-f]{3,8}|rgb(a)?\([^)]+\)|[a-z]+)$/i.test(val)) out.push(`${prop}: ${val}`)
  }
  return out.join("; ")
}

export function sanitizeAnnotationTextHtml(raw: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return escapeToPlainText(raw)
  }
  const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, "text/html")
  const root = doc.body.firstElementChild
  if (!root) return ""
  const frag = doc.createDocumentFragment()
  while (root.firstChild) {
    const node = root.firstChild
    root.removeChild(node)
    frag.appendChild(sanitizeNode(doc, node))
  }
  const wrap = doc.createElement("div")
  wrap.appendChild(frag)
  return wrap.innerHTML
}

function escapeToPlainText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function sanitizeNode(doc: Document, node: ChildNode): Node {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent ?? "")
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return doc.createDocumentFragment()
  }
  const el = node as Element
  const tag = el.tagName.toLowerCase()
  if (tag === "script" || tag === "style") {
    return doc.createDocumentFragment()
  }
  if (!ALLOWED_BLOCK.has(tag)) {
    const frag = doc.createDocumentFragment()
    for (const c of Array.from(el.childNodes)) {
      frag.appendChild(sanitizeNode(doc, c))
    }
    return frag
  }
  if (tag === "br") {
    return doc.createElement("br")
  }
  const out = doc.createElement(tag === "span" ? "span" : tag)
  if (tag === "span") {
    const style = el.getAttribute("style")
    if (style) {
      const clean = sanitizeStyle(style)
      if (clean) out.setAttribute("style", clean)
    }
  }
  for (const c of Array.from(el.childNodes)) {
    out.appendChild(sanitizeNode(doc, c))
  }
  return out
}
