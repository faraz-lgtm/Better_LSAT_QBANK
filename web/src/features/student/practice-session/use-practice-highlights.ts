import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react"

import {
  annotationElementFromNode,
  applyHighlightColorInMark,
  eraseAnnotationsIntersectingRange,
  highlightContainingRange,
  isRangeInSingleContainer,
  rangeSpansPartialAnnotation,
  underlineContainingRange,
  unwrapElement,
  wrapRangeWithElement,
} from "@/features/student/practice-session/practice-annotation-dom"
import type { PassageHighlightMenu } from "@/features/student/practice-session/practice-session-highlight-popover"
import {
  buildAccessibilityContentStyle,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  type PracticeSessionAccessibilitySettings,
} from "@/features/student/practice-session/practice-session-accessibility"
import {
  FONT_SCALE_STEPS,
  isPassageHighlightColor,
  LINE_SPACING_STEPS,
  type HighlightColor,
  type PassageHighlightColor,
  type PracticeToolMode,
  type RegionKey,
} from "@/features/student/practice-session/practice-session-types"
import { stripFindMarksFromHtml } from "@/lib/html/highlight-find-in-html"

function nextStep<T>(steps: readonly T[], current: T): T {
  const idx = steps.indexOf(current)
  const next = idx < 0 ? 0 : (idx + 1) % steps.length
  return steps[next]!
}

function clearSelection() {
  window.getSelection()?.removeAllRanges()
  // Wrapping/splitting marks can leave a stale range until the next frame in some browsers.
  requestAnimationFrame(() => {
    window.getSelection()?.removeAllRanges()
  })
}

const POINTER_CLICK_MAX_DISTANCE_PX = 8

type PointerAnchor = {
  x: number
  y: number
  downX: number
  downY: number
  has: boolean
}

function isPointerClick(pointer: PointerAnchor): boolean {
  if (!pointer.has) return true
  return Math.hypot(pointer.x - pointer.downX, pointer.y - pointer.downY) < POINTER_CLICK_MAX_DISTANCE_PX
}

function nearestClientRect(rects: DOMRectList | undefined, x: number, y: number): DOMRect | null {
  if (!rects || rects.length === 0) return null
  let best = rects[0]!
  let bestDist = Infinity
  for (const rect of rects) {
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return rect
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dist = Math.hypot(cx - x, cy - y)
    if (dist < bestDist) {
      best = rect
      bestDist = dist
    }
  }
  return best
}

function rangeClientRect(range: Range): DOMRect {
  try {
    if (typeof range.getClientRects === "function") {
      const rects = range.getClientRects()
      if (rects.length > 0) return rects[rects.length - 1]!
    }
    if (typeof range.getBoundingClientRect === "function") {
      return range.getBoundingClientRect()
    }
  } catch {
    // Detached range or jsdom without layout.
  }
  const node = range.startContainer
  const el = node instanceof Element ? node : node.parentElement
  return el?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0)
}

function markLineRect(mark: Element, x: number, y: number): DOMRect {
  return nearestClientRect(mark.getClientRects(), x, y) ?? mark.getBoundingClientRect()
}

function menuPositionFromPointer(clientX: number, clientY: number): Pick<PassageHighlightMenu, "x" | "y" | "below"> {
  const below = clientY < 96
  return { x: clientX, y: clientY, below }
}

function menuPositionFromRect(rect: DOMRect): Pick<PassageHighlightMenu, "x" | "y" | "below"> {
  const below = rect.top < 96
  return {
    x: rect.left + rect.width / 2,
    y: below ? rect.bottom : rect.top,
    below,
  }
}

function hasViewportPoint(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && (x !== 0 || y !== 0)
}

export function usePracticeHighlights() {
  const [activeColor, setActiveColor] = useState<HighlightColor | null>(null)
  const [toolMode, setToolMode] = useState<PracticeToolMode>("none")
  const [accessibilitySettings, setAccessibilitySettings] = useState<PracticeSessionAccessibilitySettings>(
    DEFAULT_ACCESSIBILITY_SETTINGS,
  )
  const [boldEnabled, setBoldEnabled] = useState(false)
  const [italicEnabled, setItalicEnabled] = useState(false)
  const [regionHtml, setRegionHtml] = useState<Record<RegionKey, string>>({})
  const [selectionMenu, setSelectionMenu] = useState<PassageHighlightMenu | null>(null)
  const [lastPassageColor, setLastPassageColor] = useState<PassageHighlightColor>("yellow")

  const rangeRef = useRef<Range | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)
  const regionKeyRef = useRef<RegionKey | null>(null)
  const markRef = useRef<Element | null>(null)
  const pointerRef = useRef<PointerAnchor>({ x: 0, y: 0, downX: 0, downY: 0, has: false })

  const { fontScale, lineSpacing } = accessibilitySettings

  useEffect(() => {
    function savePointer(event: PointerEvent) {
      const next = { x: event.clientX, y: event.clientY, has: true }
      if (event.type === "pointerdown") {
        pointerRef.current = { ...next, downX: event.clientX, downY: event.clientY }
        return
      }
      pointerRef.current = { ...pointerRef.current, ...next }
    }
    window.addEventListener("pointerdown", savePointer, true)
    window.addEventListener("pointermove", savePointer, true)
    window.addEventListener("pointerup", savePointer, true)
    return () => {
      window.removeEventListener("pointerdown", savePointer, true)
      window.removeEventListener("pointermove", savePointer, true)
      window.removeEventListener("pointerup", savePointer, true)
    }
  }, [])

  const resolveMenuAnchor = useCallback(
    (event: MouseEvent | undefined, fallbackRect: (x: number, y: number) => DOMRect) => {
      const pointer = pointerRef.current
      const fromPointer = pointer.has && hasViewportPoint(pointer.x, pointer.y)
      const fromEvent = event != null && hasViewportPoint(event.clientX, event.clientY)
      const x = fromPointer ? pointer.x : fromEvent ? event.clientX : 0
      const y = fromPointer ? pointer.y : fromEvent ? event.clientY : 0
      if (hasViewportPoint(x, y)) return menuPositionFromPointer(x, y)
      return menuPositionFromRect(fallbackRect(x, y))
    },
    [],
  )

  const getRegionHtml = useCallback(
    (key: RegionKey, baseHtml: string) => regionHtml[key] ?? baseHtml,
    [regionHtml],
  )

  const saveRegionHtml = useCallback((key: RegionKey, html: string) => {
    setRegionHtml((prev) => ({ ...prev, [key]: stripFindMarksFromHtml(html) }))
  }, [])

  const dismissSelectionMenu = useCallback(() => {
    rangeRef.current = null
    containerRef.current = null
    regionKeyRef.current = null
    markRef.current = null
    setSelectionMenu(null)
  }, [])

  const isSelectionMenuAnchorConnected = useCallback(() => {
    if (markRef.current) return markRef.current.isConnected
    if (rangeRef.current) return rangeRef.current.startContainer.isConnected
    return false
  }, [])

  const selectColor = useCallback(
    (color: HighlightColor) => {
      if (toolMode === "highlighter" && activeColor === color) {
        setActiveColor(null)
        setToolMode("none")
        return
      }
      setActiveColor(color)
      setToolMode("highlighter")
      dismissSelectionMenu()
    },
    [activeColor, dismissSelectionMenu, toolMode],
  )

  const selectEraser = useCallback(() => {
    setToolMode((m) => (m === "eraser" ? "none" : "eraser"))
    setActiveColor(null)
    dismissSelectionMenu()
  }, [dismissSelectionMenu])

  const selectUnderline = useCallback(() => {
    setToolMode((m) => (m === "underline" ? "none" : "underline"))
    setActiveColor(null)
    dismissSelectionMenu()
  }, [dismissSelectionMenu])

  const cycleFontSize = useCallback(() => {
    setAccessibilitySettings((current) => ({
      ...current,
      fontScale: nextStep(FONT_SCALE_STEPS, current.fontScale as (typeof FONT_SCALE_STEPS)[number]),
    }))
  }, [])

  const cycleLineSpacing = useCallback(() => {
    setAccessibilitySettings((current) => ({
      ...current,
      lineSpacing: nextStep(LINE_SPACING_STEPS, current.lineSpacing as (typeof LINE_SPACING_STEPS)[number]),
    }))
  }, [])

  const applyAccessibilitySettings = useCallback((settings: PracticeSessionAccessibilitySettings) => {
    setAccessibilitySettings(settings)
  }, [])

  const toggleBold = useCallback(() => {
    setBoldEnabled((enabled) => !enabled)
  }, [])

  const toggleItalic = useCallback(() => {
    setItalicEnabled((enabled) => !enabled)
  }, [])

  const applyColorToRange = useCallback(
    (regionKey: RegionKey, container: HTMLElement, range: Range, color: HighlightColor) => {
      const existingMark = highlightContainingRange(range, container)
      if (existingMark) {
        if (!applyHighlightColorInMark(range, existingMark, color)) return false
      } else {
        if (rangeSpansPartialAnnotation(range, container)) return false
        const mark = document.createElement("mark")
        mark.setAttribute("data-highlight", color)
        if (!wrapRangeWithElement(range, mark)) return false
      }
      saveRegionHtml(regionKey, container.innerHTML)
      clearSelection()
      return true
    },
    [saveRegionHtml],
  )

  const removeAnnotationElement = useCallback(
    (regionKey: RegionKey, container: HTMLElement, el: Element) => {
      unwrapElement(el)
      saveRegionHtml(regionKey, container.innerHTML)
      clearSelection()
    },
    [saveRegionHtml],
  )

  const applySelectionColor = useCallback(
    (color: PassageHighlightColor) => {
      const range = rangeRef.current
      const container = containerRef.current
      const regionKey = regionKeyRef.current
      if (!range || !container || !regionKey) return
      setLastPassageColor(color)
      applyColorToRange(regionKey, container, range, color)
      dismissSelectionMenu()
    },
    [applyColorToRange, dismissSelectionMenu],
  )

  const removeSelectionHighlight = useCallback(() => {
    const mark = markRef.current
    const container = containerRef.current
    const regionKey = regionKeyRef.current
    if (!mark || !container || !regionKey) return
    removeAnnotationElement(regionKey, container, mark)
    dismissSelectionMenu()
  }, [dismissSelectionMenu, removeAnnotationElement])

  const toggleSelectionExpanded = useCallback(() => {
    setSelectionMenu((current) => {
      if (!current || current.mode !== "highlight") return current
      return { ...current, expanded: !current.expanded }
    })
  }, [])

  const handleContentClick = useCallback(
    (regionKey: RegionKey, container: HTMLElement | null, event: MouseEvent) => {
      if (!container || toolMode !== "eraser") return
      const selection = window.getSelection()
      // Selection erase is handled on mouseup; click only clears a whole mark when collapsed.
      if (selection && !selection.isCollapsed) return
      const el = annotationElementFromNode(event.target as Node, container)
      if (!el) return
      event.preventDefault()
      event.stopPropagation()
      removeAnnotationElement(regionKey, container, el)
    },
    [removeAnnotationElement, toolMode],
  )

  const openHighlightMenu = useCallback(
    (regionKey: RegionKey, container: HTMLElement, range: Range, event?: MouseEvent) => {
      const existingMark = highlightContainingRange(range, container)
      const markColor = existingMark?.getAttribute("data-highlight")
      const selectedColor = isPassageHighlightColor(markColor) ? markColor : lastPassageColor
      rangeRef.current = range.cloneRange()
      containerRef.current = container
      regionKeyRef.current = regionKey
      markRef.current = null
      setSelectionMenu({
        mode: "highlight",
        ...resolveMenuAnchor(event, () => rangeClientRect(range)),
        expanded: true,
        selectedColor,
      })
    },
    [lastPassageColor, resolveMenuAnchor],
  )

  const openRemoveMenu = useCallback(
    (regionKey: RegionKey, container: HTMLElement, mark: Element, event?: MouseEvent) => {
      rangeRef.current = null
      containerRef.current = container
      regionKeyRef.current = regionKey
      markRef.current = mark
      setSelectionMenu({
        mode: "remove",
        ...resolveMenuAnchor(event, (x, y) => markLineRect(mark, x, y)),
      })
    },
    [resolveMenuAnchor],
  )

  const handleContentMouseUp = useCallback(
    (regionKey: RegionKey, container: HTMLElement | null, event?: MouseEvent) => {
      if (!container) return

      if (toolMode === "none") {
        const clickTarget = event?.target
        const clicked = clickTarget instanceof Node ? annotationElementFromNode(clickTarget, container) : null
        if (clicked?.matches("mark[data-highlight]") && isPointerClick(pointerRef.current)) {
          openRemoveMenu(regionKey, container, clicked, event)
          event?.stopPropagation()
          return
        }
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          if (!isRangeInSingleContainer(range, container)) return
          openHighlightMenu(regionKey, container, range, event)
          event?.stopPropagation()
          return
        }
        dismissSelectionMenu()
        return
      }

      if (toolMode === "eraser") {
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          if (isRangeInSingleContainer(range, container)) {
            if (eraseAnnotationsIntersectingRange(range, container)) {
              saveRegionHtml(regionKey, container.innerHTML)
              clearSelection()
              event?.stopPropagation()
            }
          }
          return
        }
        const clickTarget = event?.target
        const clicked = clickTarget instanceof Node ? annotationElementFromNode(clickTarget, container) : null
        if (clicked) {
          removeAnnotationElement(regionKey, container, clicked)
        }
        return
      }

      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return
      const range = selection.getRangeAt(0)
      if (!isRangeInSingleContainer(range, container)) return

      if (toolMode === "underline") {
        const existingU = underlineContainingRange(range, container)
        if (existingU) {
          removeAnnotationElement(regionKey, container, existingU)
          return
        }
        if (rangeSpansPartialAnnotation(range, container)) return
        const u = document.createElement("u")
        if (wrapRangeWithElement(range, u)) {
          saveRegionHtml(regionKey, container.innerHTML)
          clearSelection()
          event?.stopPropagation()
        }
        return
      }

      if (toolMode === "highlighter" && activeColor) {
        if (applyColorToRange(regionKey, container, range, activeColor)) {
          event?.stopPropagation()
        }
      }
    },
    [
      activeColor,
      applyColorToRange,
      dismissSelectionMenu,
      openHighlightMenu,
      openRemoveMenu,
      removeAnnotationElement,
      saveRegionHtml,
      toolMode,
    ],
  )

  const contentStyle: CSSProperties = buildAccessibilityContentStyle(accessibilitySettings, {
    boldEnabled,
    italicEnabled,
  })

  return {
    activeColor,
    toolMode,
    accessibilitySettings,
    fontScale,
    lineSpacing,
    boldEnabled,
    italicEnabled,
    contentStyle,
    getRegionHtml,
    selectColor,
    selectEraser,
    selectUnderline,
    cycleFontSize,
    cycleLineSpacing,
    applyAccessibilitySettings,
    toggleBold,
    toggleItalic,
    handleContentMouseUp,
    handleContentClick,
    selectionMenu,
    applySelectionColor,
    removeSelectionHighlight,
    toggleSelectionExpanded,
    dismissSelectionMenu,
    isSelectionMenuAnchorConnected,
  }
}
