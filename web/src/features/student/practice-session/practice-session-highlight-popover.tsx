import { useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, ChevronUp, Eraser, Highlighter } from "lucide-react"

import {
  PASSAGE_HIGHLIGHT_POPOVER_CARD_CLASS,
  PASSAGE_HIGHLIGHT_POPOVER_HEADER_CLASS,
  PASSAGE_HIGHLIGHT_POPOVER_SWATCH_CLASS,
  PASSAGE_HIGHLIGHT_POPOVER_SWATCH_ROW_CLASS,
  PASSAGE_HIGHLIGHT_REMOVE_CARD_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  PASSAGE_HIGHLIGHT_COLORS,
  type PassageHighlightColor,
} from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

const POPOVER_GAP_PX = 2
const POPOVER_VIEWPORT_PAD_PX = 8
const HIGHLIGHT_POPOVER_WIDTH_PX = 168
const HIGHLIGHT_POPOVER_EXPANDED_HEIGHT_PX = 80
const HIGHLIGHT_POPOVER_COLLAPSED_HEIGHT_PX = 44
const REMOVE_POPOVER_WIDTH_PX = 112
const REMOVE_POPOVER_HEIGHT_PX = 36

export type PassageHighlightMenu =
  | {
      mode: "highlight"
      x: number
      y: number
      below: boolean
      expanded: boolean
      selectedColor: PassageHighlightColor | null
    }
  | {
      mode: "remove"
      x: number
      y: number
      below: boolean
    }

type PracticeSessionHighlightPopoverProps = {
  menu: PassageHighlightMenu | null
  onApplyColor: (color: PassageHighlightColor) => void
  onRemove: () => void
  onToggleExpanded: () => void
  onDismiss: () => void
  isAnchorConnected: () => boolean
}

function clampPopoverPosition(
  x: number,
  y: number,
  below: boolean,
  width: number,
  height: number,
): { left: number; top: number } {
  const vw = typeof window === "undefined" ? width : window.innerWidth
  const vh = typeof window === "undefined" ? height : window.innerHeight
  const half = width / 2
  const left = Math.min(
    Math.max(x, half + POPOVER_VIEWPORT_PAD_PX),
    vw - half - POPOVER_VIEWPORT_PAD_PX,
  )
  const preferredTop = below ? y + POPOVER_GAP_PX : y - POPOVER_GAP_PX - height
  const top = Math.min(
    Math.max(preferredTop, POPOVER_VIEWPORT_PAD_PX),
    vh - height - POPOVER_VIEWPORT_PAD_PX,
  )
  return { left, top }
}

function PracticeSessionHighlightPopover({
  menu,
  onApplyColor,
  onRemove,
  onToggleExpanded,
  onDismiss,
  isAnchorConnected,
}: PracticeSessionHighlightPopoverProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!menu) return
    if (!isAnchorConnected()) onDismiss()
  }, [isAnchorConnected, menu, onDismiss])

  useLayoutEffect(() => {
    if (!menu) return

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current
      if (root && event.target instanceof Node && root.contains(event.target)) return
      onDismiss()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss()
    }

    function onScroll() {
      onDismiss()
    }

    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [menu, onDismiss])

  const size =
    !menu
      ? { width: HIGHLIGHT_POPOVER_WIDTH_PX, height: HIGHLIGHT_POPOVER_EXPANDED_HEIGHT_PX }
      : menu.mode === "remove"
        ? { width: REMOVE_POPOVER_WIDTH_PX, height: REMOVE_POPOVER_HEIGHT_PX }
        : {
            width: HIGHLIGHT_POPOVER_WIDTH_PX,
            height: menu.expanded ? HIGHLIGHT_POPOVER_EXPANDED_HEIGHT_PX : HIGHLIGHT_POPOVER_COLLAPSED_HEIGHT_PX,
          }

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el || !menu) return
    const measured = el.getBoundingClientRect()
    const width = measured.width || size.width
    const height = measured.height || size.height
    const next = clampPopoverPosition(menu.x, menu.y, menu.below, width, height)
    el.style.left = `${next.left}px`
    el.style.top = `${next.top}px`
  }, [menu, size.height, size.width])

  if (!menu || typeof document === "undefined") return null

  const { left, top } = clampPopoverPosition(menu.x, menu.y, menu.below, size.width, size.height)

  return createPortal(
    <div
      ref={rootRef}
      className="pointer-events-auto fixed z-[100] select-none"
      style={{ left, top, transform: "translateX(-50%)" }}
      data-passage-highlight-popover=""
      onPointerDown={(event) => event.preventDefault()}
    >
      {menu.mode === "remove" ? (
        <button
          type="button"
          className={PASSAGE_HIGHLIGHT_REMOVE_CARD_CLASS}
          aria-label="Remove highlight"
          onClick={onRemove}
        >
          <Eraser className="size-4 shrink-0 text-[#0d0d12]" strokeWidth={2} aria-hidden />
          Remove
        </button>
      ) : (
        <div className={PASSAGE_HIGHLIGHT_POPOVER_CARD_CLASS} role="toolbar" aria-label="Highlight">
          <button
            type="button"
            className={PASSAGE_HIGHLIGHT_POPOVER_HEADER_CLASS}
            aria-expanded={menu.expanded}
            aria-label={menu.expanded ? "Collapse highlight colors" : "Expand highlight colors"}
            onClick={onToggleExpanded}
          >
            <Highlighter className="size-4 shrink-0 text-[#0d0d12]" strokeWidth={2} aria-hidden />
            <span className="flex-1 text-left">Highlight</span>
            {menu.expanded ? (
              <ChevronUp className="size-4 shrink-0 text-[#0d0d12]" strokeWidth={2} aria-hidden />
            ) : (
              <ChevronDown className="size-4 shrink-0 text-[#0d0d12]" strokeWidth={2} aria-hidden />
            )}
          </button>
          {menu.expanded ? (
            <div className={PASSAGE_HIGHLIGHT_POPOVER_SWATCH_ROW_CLASS}>
              {PASSAGE_HIGHLIGHT_COLORS.map((swatch) => {
                const selected = menu.selectedColor === swatch.id
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    className={cn(
                      PASSAGE_HIGHLIGHT_POPOVER_SWATCH_CLASS,
                      selected && "border-dashed",
                    )}
                    style={{
                      backgroundColor: swatch.hex,
                      borderColor: selected ? swatch.border : "#dfe1e7",
                    }}
                    aria-label={`Highlight ${swatch.id}`}
                    aria-pressed={selected}
                    onClick={() => onApplyColor(swatch.id)}
                  >
                    {selected ? (
                      <Check
                        className="absolute inset-0 m-auto size-3 text-[#0d0d12]"
                        strokeWidth={3}
                        aria-hidden
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>,
    document.body,
  )
}

export { PracticeSessionHighlightPopover }
