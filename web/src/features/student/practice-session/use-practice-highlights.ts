import { useCallback, useState, type CSSProperties, type MouseEvent } from "react"

import {
  annotationContainingRange,
  annotationElementFromNode,
  isRangeInSingleContainer,
  rangeSpansPartialAnnotation,
  underlineContainingRange,
  unwrapElement,
} from "@/features/student/practice-session/practice-annotation-dom"
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
  const selection = window.getSelection()
  selection?.removeAllRanges()
}

export function usePracticeHighlights() {
  const [activeColor, setActiveColor] = useState<HighlightColor | null>(null)
  const [toolMode, setToolMode] = useState<PracticeToolMode>("none")
  const [fontScale, setFontScale] = useState<number>(1)
  const [lineSpacing, setLineSpacing] = useState<number>(1)
  const [boldEnabled, setBoldEnabled] = useState(false)
  const [italicEnabled, setItalicEnabled] = useState(false)
  const [regionHtml, setRegionHtml] = useState<Record<RegionKey, string>>({})

  const getRegionHtml = useCallback(
    (key: RegionKey, baseHtml: string) => regionHtml[key] ?? baseHtml,
    [regionHtml],
  )

  const saveRegionHtml = useCallback((key: RegionKey, html: string) => {
    setRegionHtml((prev) => ({ ...prev, [key]: stripFindMarksFromHtml(html) }))
  }, [])

  const selectColor = useCallback((color: HighlightColor) => {
    setActiveColor(color)
    setToolMode("highlighter")
  }, [])

  const selectEraser = useCallback(() => {
    setToolMode((m) => (m === "eraser" ? "none" : "eraser"))
    setActiveColor(null)
  }, [])

  const selectUnderline = useCallback(() => {
    setToolMode((m) => (m === "underline" ? "none" : "underline"))
    setActiveColor(null)
  }, [])

  const cycleFontSize = useCallback(() => {
    setFontScale((s) => nextStep(FONT_SCALE_STEPS, s as (typeof FONT_SCALE_STEPS)[number]))
  }, [])

  const cycleLineSpacing = useCallback(() => {
    setLineSpacing((s) => nextStep(LINE_SPACING_STEPS, s as (typeof LINE_SPACING_STEPS)[number]))
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
        const clickTarget = event?.target
        const clicked = clickTarget instanceof Node ? annotationElementFromNode(clickTarget, container) : null
        if (clicked) {
          removeAnnotationElement(regionKey, container, clicked)
          return
        }
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          if (isRangeInSingleContainer(range, container)) {
            const ann = annotationContainingRange(range, container)
            if (ann) {
              removeAnnotationElement(regionKey, container, ann)
              return
            }
          }
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
        try {
          const u = document.createElement("u")
          range.surroundContents(u)
          saveRegionHtml(regionKey, container.innerHTML)
          clearSelection()
        } catch {
          // surroundContents fails when range spans partial elements
        }
        return
      }

      if (toolMode === "highlighter" && activeColor) {
        if (rangeSpansPartialAnnotation(range, container)) return
        try {
          const mark = document.createElement("mark")
          mark.setAttribute("data-highlight", activeColor)
          range.surroundContents(mark)
          saveRegionHtml(regionKey, container.innerHTML)
          clearSelection()
        } catch {
          // surroundContents fails when range spans partial elements
        }
      }
    },
    [activeColor, removeAnnotationElement, saveRegionHtml, toolMode],
  )

  const contentStyle: CSSProperties = {
    ["--practice-font-scale" as string]: String(fontScale),
    ["--practice-line-height-scale" as string]: String(lineSpacing),
    fontWeight: boldEnabled ? 700 : undefined,
    fontStyle: italicEnabled ? "italic" : undefined,
  }

  return {
    activeColor,
    toolMode,
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
    toggleBold,
    toggleItalic,
    handleContentMouseUp,
    handleContentClick,
  }
}
