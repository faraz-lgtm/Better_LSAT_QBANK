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
  OFFICIAL_HIGHLIGHT_POPOVER_CARD_CLASS,
  OFFICIAL_HIGHLIGHT_POPOVER_HEADER_CLASS,
  OFFICIAL_HIGHLIGHT_POPOVER_STACK_CLASS,
  OFFICIAL_HIGHLIGHT_POPOVER_SWATCH_CLASS,
  OFFICIAL_HIGHLIGHT_POPOVER_SWATCH_ROW_CLASS,
  OFFICIAL_HIGHLIGHT_REMOVE_CARD_CLASS,
} from "@/features/student/practice-session/practice-session-official-styles"
import {
  PASSAGE_HIGHLIGHT_COLORS,
  type PassageHighlightColor,
} from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

const POPOVER_GAP_PX = 2
const POPOVER_VIEWPORT_PAD_PX = 8

function readAppZoom(): number {
  if (typeof document === "undefined") return 1
  const style = getComputedStyle(document.documentElement)
  const raw = style.getPropertyValue("--app-zoom") || style.zoom
  const zoom = Number.parseFloat(String(raw))
  return Number.isFinite(zoom) && zoom > 0 ? zoom : 1
}
const HIGHLIGHT_POPOVER_WIDTH_PX = 168
const OFFICIAL_HIGHLIGHT_POPOVER_WIDTH_PX = 216
const HIGHLIGHT_POPOVER_EXPANDED_HEIGHT_PX = 80
const OFFICIAL_HIGHLIGHT_POPOVER_EXPANDED_HEIGHT_PX = 128
const HIGHLIGHT_POPOVER_COLLAPSED_HEIGHT_PX = 44
const OFFICIAL_HIGHLIGHT_POPOVER_COLLAPSED_HEIGHT_PX = 56
const REMOVE_POPOVER_WIDTH_PX = 112
const REMOVE_POPOVER_HEIGHT_PX = 36

const OFFICIAL_SWATCH_FILL: Record<PassageHighlightColor, string> = {
  yellow: "#FFF3B0",
  pink: "#F8E2E2",
  green: "#C5EED6",
  blue: "#C5E8F8",
}

type OfficialSwatchStroke = "solid" | "dash-spaced" | "dash-tight" | "dotted"

const OFFICIAL_SWATCH_STROKE: Record<
  PassageHighlightColor,
  { style: OfficialSwatchStroke; dasharray?: string; linecap?: "round" | "butt" }
> = {
  yellow: { style: "solid" },
  pink: { style: "dash-spaced", dasharray: "3.2 4.8" },
  green: { style: "dash-tight", dasharray: "1.5 1.2" },
  blue: { style: "dotted", dasharray: "0.01 3.1", linecap: "round" },
}

function OfficialSwatchRing({ color }: { color: PassageHighlightColor }) {
  const stroke = OFFICIAL_SWATCH_STROKE[color]
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 24 24" aria-hidden>
      <circle
        data-official-swatch-ring=""
        cx="12"
        cy="12"
        r="10.25"
        fill="none"
        stroke="#2c3143"
        strokeWidth="1.6"
        strokeDasharray={stroke.dasharray}
        strokeLinecap={stroke.linecap ?? "butt"}
      />
    </svg>
  )
}

function OfficialHighlighterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m9 11-6 6v3h9l3-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.2 20.6h8.2" stroke="#90CAF9" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function OfficialCaret({ up }: { up: boolean }) {
  return (
    <svg className="size-3 shrink-0 text-[#757575]" viewBox="0 0 12 8" fill="currentColor" aria-hidden>
      {up ? <path d="M1.2 7.2 6 1.6l4.8 5.6H1.2Z" /> : <path d="M1.2.8h9.6L6 6.4 1.2.8Z" />}
    </svg>
  )
}

function OfficialRemoveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 24" fill="none" aria-hidden data-official-remove-icon="">
      <svg x="0" y="1" width="20" height="22" viewBox="0 0 544 512">
        <path
          fill="currentColor"
          d="M0 479.98L99.92 512l35.45-35.45-67.04-67.04L0 479.98zm124.61-240.01a36.592 36.592 0 0 0-10.79 38.1l13.05 42.83-50.93 50.94 96.23 96.23 50.86-50.86 42.74 13.08c13.73 4.2 28.65-.01 38.15-10.78l35.55-41.64-173.34-173.34-41.52 35.44zm403.31-160.7l-63.2-63.2c-20.49-20.49-53.38-21.52-75.12-2.35L190.55 183.68l169.77 169.78L530.27 154.4c19.18-21.74 18.15-54.63-2.35-75.13z"
        />
      </svg>
      <path d="M18.2 7.4 26.4 16.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M26.4 7.4 18.2 16.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function OfficialTooltipPointer({ placement }: { placement: "top" | "bottom" }) {
  return (
    <span
      aria-hidden
      data-official-highlight-pointer=""
      className={cn(
        "pointer-events-none absolute left-1/2 z-0 size-2.5 -translate-x-1/2 rotate-45 bg-[#ffffff] shadow-[1px_1px_2px_rgba(16,24,40,0.08)]",
        placement === "bottom" ? "-bottom-[5px]" : "-top-[5px]",
      )}
    />
  )
}

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
  variant?: "default" | "official"
}

function clampFixedPoint(
  visualX: number,
  visualY: number,
  width: number,
  height: number,
): { left: number; top: number } {
  const zoom = readAppZoom()
  const x = visualX / zoom
  const y = visualY / zoom
  const vw = (typeof window === "undefined" ? width : window.innerWidth) / zoom
  const vh = (typeof window === "undefined" ? height : window.innerHeight) / zoom
  const half = width / 2
  const left = Math.min(
    Math.max(x, half + POPOVER_VIEWPORT_PAD_PX),
    vw - half - POPOVER_VIEWPORT_PAD_PX,
  )
  const top = Math.min(Math.max(y, POPOVER_VIEWPORT_PAD_PX), vh - height - POPOVER_VIEWPORT_PAD_PX)
  return { left, top }
}

/** Park the official chip just above the first selected word so the pointer hits it. */
function officialOnFirstWord(
  x: number,
  wordTop: number,
  width: number,
  height: number,
): { left: number; top: number } {
  return clampFixedPoint(x, wordTop - height, width, height)
}

function clampPopoverPosition(
  x: number,
  y: number,
  below: boolean,
  width: number,
  height: number,
  gapPx = POPOVER_GAP_PX,
): { left: number; top: number } {
  const preferredTop = below ? y + gapPx : y - gapPx - height
  return clampFixedPoint(x, preferredTop, width, height)
}

function PracticeSessionHighlightPopover({
  menu,
  onApplyColor,
  onRemove,
  onToggleExpanded,
  onDismiss,
  isAnchorConnected,
  variant = "default",
}: PracticeSessionHighlightPopoverProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const official = variant === "official"
  const highlightWidth = official ? OFFICIAL_HIGHLIGHT_POPOVER_WIDTH_PX : HIGHLIGHT_POPOVER_WIDTH_PX
  const expandedHeight = official ? OFFICIAL_HIGHLIGHT_POPOVER_EXPANDED_HEIGHT_PX : HIGHLIGHT_POPOVER_EXPANDED_HEIGHT_PX
  const collapsedHeight = official
    ? OFFICIAL_HIGHLIGHT_POPOVER_COLLAPSED_HEIGHT_PX
    : HIGHLIGHT_POPOVER_COLLAPSED_HEIGHT_PX

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
      ? { width: highlightWidth, height: expandedHeight }
      : menu.mode === "remove"
        ? official
          ? { width: highlightWidth, height: collapsedHeight }
          : { width: REMOVE_POPOVER_WIDTH_PX, height: REMOVE_POPOVER_HEIGHT_PX }
        : {
            width: highlightWidth,
            height: menu.expanded ? expandedHeight : collapsedHeight,
          }

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el || !menu) return
    const card = el.querySelector("[data-official-highlight-card]")
    const measured = (card instanceof HTMLElement ? card : el).getBoundingClientRect()
    const width = measured.width || size.width
    const height = measured.height || size.height
    const next = official
      ? officialOnFirstWord(menu.x, menu.y, width, height)
      : clampPopoverPosition(menu.x, menu.y, menu.below, width, height)
    el.style.left = `${next.left}px`
    el.style.top = `${next.top}px`
  }, [menu, official, size.height, size.width])

  if (!menu || typeof document === "undefined") return null

  const { left, top } = official
    ? officialOnFirstWord(menu.x, menu.y, size.width, size.height)
    : clampPopoverPosition(menu.x, menu.y, menu.below, size.width, size.height)

  return createPortal(
    <div
      ref={rootRef}
      className="pointer-events-auto fixed z-[100] select-none"
      style={{ left, top, transform: "translateX(-50%)" }}
      data-passage-highlight-popover=""
      onPointerDown={(event) => event.preventDefault()}
    >
      {menu.mode === "remove" ? (
        official ? (
          <div className="relative">
            {menu.below ? <OfficialTooltipPointer placement="top" /> : null}
            <button
              type="button"
              className={OFFICIAL_HIGHLIGHT_REMOVE_CARD_CLASS}
              data-official-highlight-card=""
              aria-label="Remove highlight"
              onClick={onRemove}
            >
              <OfficialRemoveIcon className="size-6 shrink-0 text-[#2c3143]" />
              Remove
            </button>
            {menu.below ? null : <OfficialTooltipPointer placement="bottom" />}
          </div>
        ) : (
          <button
            type="button"
            className={PASSAGE_HIGHLIGHT_REMOVE_CARD_CLASS}
            aria-label="Remove highlight"
            onClick={onRemove}
          >
            <Eraser className="size-4 shrink-0 text-[#0d0d12]" strokeWidth={2} aria-hidden />
            Remove
          </button>
        )
      ) : (
        official ? (
          <div className={cn(OFFICIAL_HIGHLIGHT_POPOVER_STACK_CLASS, "relative")} role="toolbar" aria-label="Highlight">
            {menu.below ? <OfficialTooltipPointer placement="top" /> : null}
            <div className={OFFICIAL_HIGHLIGHT_POPOVER_CARD_CLASS} data-official-highlight-card="">
              <button
                type="button"
                className={OFFICIAL_HIGHLIGHT_POPOVER_HEADER_CLASS}
                aria-expanded={menu.expanded}
                aria-label={menu.expanded ? "Collapse highlight colors" : "Expand highlight colors"}
                onClick={onToggleExpanded}
              >
                <OfficialHighlighterIcon className="size-6 shrink-0 text-[#2c3143]" />
                <span className="flex-1 text-left">Highlight</span>
                <OfficialCaret up={menu.expanded} />
              </button>
            </div>
            {menu.expanded ? (
              <div className={OFFICIAL_HIGHLIGHT_POPOVER_CARD_CLASS}>
                <div className={OFFICIAL_HIGHLIGHT_POPOVER_SWATCH_ROW_CLASS}>
                  {PASSAGE_HIGHLIGHT_COLORS.map((swatch) => {
                    const selected = menu.selectedColor === swatch.id
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        className={OFFICIAL_HIGHLIGHT_POPOVER_SWATCH_CLASS}
                        style={{ backgroundColor: OFFICIAL_SWATCH_FILL[swatch.id] }}
                        data-official-swatch-style={OFFICIAL_SWATCH_STROKE[swatch.id].style}
                        aria-label={`Highlight ${swatch.id}`}
                        aria-pressed={selected}
                        onClick={() => onApplyColor(swatch.id)}
                      >
                        <OfficialSwatchRing color={swatch.id} />
                        {selected ? (
                          <Check
                            data-official-check=""
                            className="absolute inset-0 z-[1] m-auto size-3.5 text-[#2c3143]"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
            {menu.below ? null : <OfficialTooltipPointer placement="bottom" />}
          </div>
        ) : (
        <div
          className={PASSAGE_HIGHLIGHT_POPOVER_CARD_CLASS}
          role="toolbar"
          aria-label="Highlight"
        >
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
                      borderColor: selected ? swatch.border : "var(--greyscale-100)",
                    }}
                    aria-label={`Highlight ${swatch.id}`}
                    aria-pressed={selected}
                    onClick={() => onApplyColor(swatch.id)}
                  >
                    {selected ? (
                      <Check className="absolute inset-0 m-auto size-3 text-[#0d0d12]" strokeWidth={3} aria-hidden />
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
        )
      )}
    </div>,
    document.body,
  )
}

export { PracticeSessionHighlightPopover }
