import { useCallback, useState, type CSSProperties, type MouseEvent } from "react"

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
import {
  buildAccessibilityContentStyle,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  type PracticeSessionAccessibilitySettings,
} from "@/features/student/practice-session/practice-session-accessibility"
import {
  FONT_SCALE_STEPS,
  LINE_SPACING_STEPS,
  type HighlightColor,
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

export function usePracticeHighlights() {
  const [activeColor, setActiveColor] = useState<HighlightColor | null>(null)
  const [toolMode, setToolMode] = useState<PracticeToolMode>("none")
  const [accessibilitySettings, setAccessibilitySettings] = useState<PracticeSessionAccessibilitySettings>(
    DEFAULT_ACCESSIBILITY_SETTINGS,
  )
  const [boldEnabled, setBoldEnabled] = useState(false)
  const [italicEnabled, setItalicEnabled] = useState(false)
  const [regionHtml, setRegionHtml] = useState<Record<RegionKey, string>>({})

  const { fontScale, lineSpacing } = accessibilitySettings

  const getRegionHtml = useCallback(
    (key: RegionKey, baseHtml: string) => regionHtml[key] ?? baseHtml,
    [regionHtml],
  )

  const saveRegionHtml = useCallback((key: RegionKey, html: string) => {
    setRegionHtml((prev) => ({ ...prev, [key]: stripFindMarksFromHtml(html) }))
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
    },
    [activeColor, toolMode],
  )

  const selectEraser = useCallback(() => {
    setToolMode((m) => (m === "eraser" ? "none" : "eraser"))
    setActiveColor(null)
  }, [])

  const selectUnderline = useCallback(() => {
    setToolMode((m) => (m === "underline" ? "none" : "underline"))
    setActiveColor(null)
  }, [])

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

  const removeAnnotationElement = useCallback(
    (regionKey: RegionKey, container: HTMLElement, el: Element) => {
      unwrapElement(el)
      saveRegionHtml(regionKey, container.innerHTML)
      clearSelection()
    },
    [saveRegionHtml],
  )

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

  const handleContentMouseUp = useCallback(
    (regionKey: RegionKey, container: HTMLElement | null, event?: MouseEvent) => {
      if (!container || toolMode === "none") return

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
        const existingMark = highlightContainingRange(range, container)
        if (existingMark) {
          if (applyHighlightColorInMark(range, existingMark, activeColor)) {
            saveRegionHtml(regionKey, container.innerHTML)
            clearSelection()
            event?.stopPropagation()
          }
          return
        }
        if (rangeSpansPartialAnnotation(range, container)) return
        const mark = document.createElement("mark")
        mark.setAttribute("data-highlight", activeColor)
        if (wrapRangeWithElement(range, mark)) {
          saveRegionHtml(regionKey, container.innerHTML)
          clearSelection()
          event?.stopPropagation()
        }
      }
    },
    [activeColor, removeAnnotationElement, saveRegionHtml, toolMode],
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
  }
}
