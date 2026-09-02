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
  if (!(node instanceof Node)) return false
  return node === container || container.contains(node)
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

/** Returns a highlight mark that fully contains the range, if any. */
export function highlightContainingRange(range: Range, container: HTMLElement): Element | null {
  let node: Node | null = range.commonAncestorContainer
  if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
  if (!(node instanceof Element)) return null
  const mark = node.closest("mark[data-highlight]")
  if (mark && container.contains(mark) && rangeFullyInsideElement(range, mark)) return mark
  return null
}

/** True when `range` exactly matches the contents of `el`. */
export function rangeMatchesElementContents(range: Range, el: Element): boolean {
  const full = document.createRange()
  full.selectNodeContents(el)
  return (
    range.compareBoundaryPoints(Range.START_TO_START, full) === 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, full) === 0
  )
}

function fragmentHasText(frag: DocumentFragment): boolean {
  return Boolean(frag.textContent)
}

/**
 * Replace the portion of `el` covered by `range`. Before/after keep `el`'s tag and attributes.
 * `buildMiddle` receives the selected contents; return a node/fragment to insert (or the fragment itself to leave plain).
 */
export function replaceRangeInsideAnnotation(
  el: Element,
  range: Range,
  buildMiddle: (selected: DocumentFragment) => Node,
): boolean {
  if (!rangeFullyInsideElement(range, el) || range.collapsed) return false
  const parent = el.parentNode
  if (!parent) return false

  if (rangeMatchesElementContents(range, el)) {
    const selected = range.cloneContents()
    const middle = buildMiddle(selected)
    parent.replaceChild(middle, el)
    return true
  }

  const beforeRange = document.createRange()
  beforeRange.selectNodeContents(el)
  beforeRange.setEnd(range.startContainer, range.startOffset)

  const afterRange = document.createRange()
  afterRange.selectNodeContents(el)
  afterRange.setStart(range.endContainer, range.endOffset)

  const beforeFrag = beforeRange.cloneContents()
  const middleFrag = range.cloneContents()
  const afterFrag = afterRange.cloneContents()

  const out = document.createDocumentFragment()
  if (fragmentHasText(beforeFrag)) {
    const beforeEl = el.cloneNode(false) as Element
    beforeEl.appendChild(beforeFrag)
    out.appendChild(beforeEl)
  }
  out.appendChild(buildMiddle(middleFrag))
  if (fragmentHasText(afterFrag)) {
    const afterEl = el.cloneNode(false) as Element
    afterEl.appendChild(afterFrag)
    out.appendChild(afterEl)
  }

  parent.replaceChild(out, el)
  return true
}

/**
 * Apply `color` to the selection inside an existing highlight.
 * Full match: recolor whole mark (or unwrap if same color).
 * Partial: split so only the selection gets the new color (same color erases that slice).
 */
export function applyHighlightColorInMark(range: Range, mark: Element, color: string): boolean {
  const current = mark.getAttribute("data-highlight")

  if (rangeMatchesElementContents(range, mark)) {
    if (current === color) {
      unwrapElement(mark)
      return true
    }
    mark.setAttribute("data-highlight", color)
    return true
  }

  return replaceRangeInsideAnnotation(mark, range, (selected) => {
    if (current === color) return selected
    const next = document.createElement("mark")
    next.setAttribute("data-highlight", color)
    next.appendChild(selected)
    return next
  })
}

/** Remove annotation from the selected slice only (splits when partial). */
export function eraseAnnotationInRange(range: Range, el: Element): boolean {
  if (rangeMatchesElementContents(range, el)) {
    unwrapElement(el)
    return true
  }
  return replaceRangeInsideAnnotation(el, range, (selected) => selected)
}

/** Clip `outer` to the contents of `el`; null if no overlap. */
export function rangeIntersectionWithElement(outer: Range, el: Element): Range | null {
  if (!outer.intersectsNode(el)) return null
  const elRange = document.createRange()
  elRange.selectNodeContents(el)
  const clipped = outer.cloneRange()
  if (clipped.compareBoundaryPoints(Range.START_TO_START, elRange) < 0) {
    clipped.setStart(elRange.startContainer, elRange.startOffset)
  }
  if (clipped.compareBoundaryPoints(Range.END_TO_END, elRange) > 0) {
    clipped.setEnd(elRange.endContainer, elRange.endOffset)
  }
  if (clipped.collapsed) return null
  if (!rangeFullyInsideElement(clipped, el)) return null
  return clipped
}

/** Erase annotations only where they intersect `range` (preserves unselected slices). */
export function eraseAnnotationsIntersectingRange(range: Range, container: HTMLElement): boolean {
  const anns = [...container.querySelectorAll(ANNOTATION_SELECTOR)].filter((el) => range.intersectsNode(el))
  if (anns.length === 0) return false

  // Reverse document order so earlier splits don't invalidate later nodes.
  anns.reverse()
  let changed = false
  for (const el of anns) {
    if (!container.contains(el)) continue
    const sub = rangeIntersectionWithElement(range, el)
    if (!sub) continue
    if (eraseAnnotationInRange(sub, el)) changed = true
  }
  return changed
}

/**
 * True when the selection only partially overlaps an annotation
 * (starts/ends inside one but isn't fully contained, or crosses multiple).
 * Fully-inside selections return false so callers can toggle/recolor.
 */
export function rangeSpansPartialAnnotation(range: Range, container: HTMLElement): boolean {
  const startEl = annotationElementFromNode(range.startContainer, container)
  const endEl = annotationElementFromNode(range.endContainer, container)

  if (startEl && startEl === endEl && rangeFullyInsideElement(range, startEl)) {
    return false
  }

  if (Boolean(startEl) !== Boolean(endEl)) return true
  if (startEl && endEl && startEl !== endEl) return true

  if (!startEl && !endEl) {
    const fragment = range.cloneContents()
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT)
    let el = walker.nextNode()
    while (el) {
      if (el instanceof Element && el.matches(ANNOTATION_SELECTOR)) return true
      el = walker.nextNode()
    }
  }

  return false
}
