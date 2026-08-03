export const ANNOTATION_SELECTOR = "u, mark[data-highlight]"

export function unwrapElement(el: Element) {
  const parent = el.parentNode
  if (!parent) return
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el)
  }
  parent.removeChild(el)
}

export function annotationElementFromNode(
  node: Node | null | undefined,
  container: HTMLElement,
): Element | null {
  if (!node) return null
  let el: Node | null = node
  if (el.nodeType === Node.TEXT_NODE) el = el.parentNode
  if (!(el instanceof Element)) return null
  const found = el.closest(ANNOTATION_SELECTOR)
  if (found && container.contains(found)) return found
  return null
}

export function isRangeInSingleContainer(range: Range, container: HTMLElement): boolean {
  let node: Node | null = range.commonAncestorContainer
  if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
  if (!(node instanceof HTMLElement)) return false
  return container.contains(node)
}

export function rangeFullyInsideElement(range: Range, el: Element): boolean {
  return el.contains(range.startContainer) && el.contains(range.endContainer)
}

/** Returns a single underline element that fully contains the range, if any. */
export function underlineContainingRange(range: Range, container: HTMLElement): Element | null {
  let node: Node | null = range.commonAncestorContainer
  if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
  if (!(node instanceof Element)) return null
  const u = node.closest("u")
  if (u && container.contains(u) && rangeFullyInsideElement(range, u)) return u
  return null
}

/** Returns an annotation element (u or mark) that fully contains the range. */
export function annotationContainingRange(range: Range, container: HTMLElement): Element | null {
  let node: Node | null = range.commonAncestorContainer
  if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
  if (!(node instanceof Element)) return null
  const found = node.closest(ANNOTATION_SELECTOR)
  if (found && container.contains(found) && rangeFullyInsideElement(range, found)) return found
  return null
}

function cloneWrapper(template: HTMLElement): HTMLElement {
  return template.cloneNode(false) as HTMLElement
}

/** Collect text nodes under `root` that intersect `range` (snapshot before mutation). */
function textNodesIntersectingRange(range: Range, root: Node): Text[] {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    if (node.nodeType === Node.TEXT_NODE && range.intersectsNode(node)) {
      nodes.push(node as Text)
    }
    node = walker.nextNode()
  }
  return nodes
}

/**
 * Wrap each text segment intersecting the range in a clone of `template`.
 * Safe across block boundaries (never nests block elements inside mark/u).
 */
function wrapRangeTextSegments(range: Range, template: HTMLElement): boolean {
  let root: Node | null = range.commonAncestorContainer
  if (root.nodeType === Node.TEXT_NODE) root = root.parentNode
  if (!root) return false

  const textNodes = textNodesIntersectingRange(range, root)
  if (textNodes.length === 0) return false

  let wrapped = false
  for (const textNode of textNodes) {
    const fullLen = textNode.data.length
    if (fullLen === 0) continue

    const startOffset = textNode === range.startContainer ? range.startOffset : 0
    const endOffset = textNode === range.endContainer ? range.endOffset : fullLen
    if (startOffset >= endOffset) continue

    let target: Text = textNode
    if (endOffset < target.data.length) {
      target.splitText(endOffset)
    }
    if (startOffset > 0) {
      target = target.splitText(startOffset)
    }

    const wrapper = cloneWrapper(template)
    const parent = target.parentNode
    if (!parent) continue
    parent.insertBefore(wrapper, target)
    wrapper.appendChild(target)
    wrapped = true
  }

  return wrapped
}

/** Wrap range contents in `element`, splitting across blocks when surroundContents fails. */
export function wrapRangeWithElement(range: Range, element: HTMLElement): boolean {
  try {
    range.surroundContents(element)
    return true
  } catch {
    return wrapRangeTextSegments(range, element)
  }
}

export function rangeSpansPartialAnnotation(range: Range, container: HTMLElement): boolean {
  const fragment = range.cloneContents()
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT)
  let el = walker.nextNode()
  while (el) {
    if (el instanceof Element && el.matches(ANNOTATION_SELECTOR)) return true
    el = walker.nextNode()
  }
  const startEl = annotationElementFromNode(range.startContainer, container)
  const endEl = annotationElementFromNode(range.endContainer, container)
  return Boolean(startEl || endEl)
}
