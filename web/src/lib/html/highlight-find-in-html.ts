import { sanitizeHtml } from "@/lib/html/sanitize-html"

const FIND_MARK_CLASS = "practice-find-mark"

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function highlightTextNodeText(text: string, query: string): string {
  if (!query) return text
  const re = new RegExp(escapeRegExp(query), "gi")
  return text.replace(re, (match) => `<mark class="${FIND_MARK_CLASS}">${match}</mark>`)
}

function highlightTextNodesInElement(element: HTMLElement, query: string): void {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (parent?.closest(`mark.${FIND_MARK_CLASS}`)) return NodeFilter.FILTER_REJECT
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const textNodes: Text[] = []
  let current = walker.nextNode()
  while (current) {
    textNodes.push(current as Text)
    current = walker.nextNode()
  }

  for (const textNode of textNodes) {
    const original = textNode.textContent ?? ""
    const lower = original.toLowerCase()
    const qLower = query.toLowerCase()
    if (!lower.includes(qLower)) continue

    const fragment = document.createDocumentFragment()
    let lastIndex = 0
    let match: RegExpExecArray | null
    const re = new RegExp(escapeRegExp(query), "gi")
    while ((match = re.exec(original)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(original.slice(lastIndex, match.index)))
      }
      const mark = document.createElement("mark")
      mark.className = FIND_MARK_CLASS
      mark.textContent = match[0]
      fragment.appendChild(mark)
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < original.length) {
      fragment.appendChild(document.createTextNode(original.slice(lastIndex)))
    }
    textNode.parentNode?.replaceChild(fragment, textNode)
  }
}

/** Wrap case-insensitive find matches in `<mark class="practice-find-mark">`. */
export function highlightFindInHtml(html: unknown, query: string): string {
  const safe = sanitizeHtml(html)
  const q = query.trim()
  if (!safe || !q) return safe

  if (typeof document === "undefined") {
    return highlightTextNodeText(safe.replace(/<[^>]+>/g, ""), q)
  }

  const el = document.createElement("div")
  el.innerHTML = safe
  highlightTextNodesInElement(el, q)
  return el.innerHTML
}

export function stripFindMarksFromHtml(html: string): string {
  if (!html || typeof document === "undefined") return html
  const el = document.createElement("div")
  el.innerHTML = html
  el.querySelectorAll(`mark.${FIND_MARK_CLASS}`).forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark)
    }
    parent.removeChild(mark)
  })
  return el.innerHTML
}

export { FIND_MARK_CLASS }
