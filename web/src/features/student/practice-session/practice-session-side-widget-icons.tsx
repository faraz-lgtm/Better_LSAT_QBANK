import type { SVGProps } from "react"

import { cn } from "@/lib/utils"

type SideWidgetIconProps = SVGProps<SVGSVGElement>

/** Figma `20268:102762` — exam side-widget glyphs */
const EXAM_SIDE_WIDGET_FIGMA = "/figma/exam-side-widget"

function SideWidgetFigmaIcon({
  src,
  size,
  glyphWidth,
  glyphHeight,
  rotate,
  className,
}: {
  src: string
  size: 20 | 24
  glyphWidth?: number
  glyphHeight?: number
  rotate?: "90" | "270"
  className?: string
}) {
  const hasInset = glyphWidth != null && glyphHeight != null
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-clip",
        rotate === "90" && "rotate-90",
        rotate === "270" && "rotate-[270deg]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        width={glyphWidth ?? size}
        height={glyphHeight ?? size}
        className={cn("max-w-none", hasInset ? "absolute" : "size-full object-contain")}
        style={
          hasInset
            ? {
                width: glyphWidth,
                height: glyphHeight,
                left: (size - glyphWidth) / 2,
                top: (size - glyphHeight) / 2,
              }
            : undefined
        }
        draggable={false}
      />
    </span>
  )
}

/** Full size — four arrows pointing outward to corners */
function SideWidgetFullScreenIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M8 3.5H3.5V8M12 3.5H16.5V8M3.5 12V16.5H8M16.5 12V16.5H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 8L4.25 4.25M12 8L15.75 4.25M8 12L4.25 15.75M12 12L15.75 15.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Med size — four arrows pointing inward (exit full screen) */
function SideWidgetMedSizeIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M4.25 4.25L8 8M15.75 4.25L12 8M4.25 15.75L8 12M15.75 15.75L12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 4.5V8H4.5M12 4.5V8H15.5M4.5 12H8V15.5M12 15.5V12H15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Figma `20268:102762` — expand/collapse (download-circle-01, rotated) */
function SideWidgetCollapseDockIcon({
  className,
  expanded = false,
}: SideWidgetIconProps & { expanded?: boolean }) {
  return (
    <SideWidgetFigmaIcon
      src={`${EXAM_SIDE_WIDGET_FIGMA}/download-circle-01.svg`}
      size={20}
      rotate={expanded ? "270" : "90"}
      className={className}
    />
  )
}

/** Figma `20268:102762` — review / menu-line-horizontal */
function SideWidgetReviewIcon({ className }: SideWidgetIconProps) {
  return (
    <SideWidgetFigmaIcon
      src={`${EXAM_SIDE_WIDGET_FIGMA}/menu-line-horizontal.svg`}
      size={24}
      glyphWidth={11.5}
      glyphHeight={9.5}
      className={className}
    />
  )
}

/** Figma `20268:102762` — accessibility */
function SideWidgetAccessibilityIcon({ className }: SideWidgetIconProps) {
  return (
    <SideWidgetFigmaIcon
      src={`${EXAM_SIDE_WIDGET_FIGMA}/accessibility.svg`}
      size={24}
      className={className}
    />
  )
}

/** Figma `20268:102762` — flag; official flagged uses LawHub filled pennant `20257:89990` */
function SideWidgetFlagIcon({ className, active = false }: SideWidgetIconProps & { active?: boolean }) {
  if (active) {
    return (
      <SideWidgetFigmaIcon
        src="/figma/exam-official/review-flag.svg"
        size={20}
        glyphWidth={16}
        glyphHeight={18}
        className={className}
      />
    )
  }
  return (
    <SideWidgetFigmaIcon src={`${EXAM_SIDE_WIDGET_FIGMA}/flag.svg`} size={20} className={className} />
  )
}

/** Figma `20268:102762` — response masking / eye-slash */
function SideWidgetResponseMaskingIcon({ className }: SideWidgetIconProps) {
  return (
    <SideWidgetFigmaIcon
      src={`${EXAM_SIDE_WIDGET_FIGMA}/eye-slash.svg`}
      size={20}
      className={className}
    />
  )
}

function SideWidgetExpandIcon({ className }: SideWidgetIconProps) {
  return (
    <SideWidgetFigmaIcon src="/figma/exam-official/arrows-pointing-out.svg" size={20} className={className} />
  )
}

function SideWidgetArrowsPointingInIcon({ className }: SideWidgetIconProps) {
  return (
    <SideWidgetFigmaIcon src="/figma/exam-official/arrows-pointing-in.svg" size={20} className={className} />
  )
}

function SideWidgetHighlighterIcon({ className }: SideWidgetIconProps) {
  return <SideWidgetFigmaIcon src="/figma/exam-official/pen.svg" size={20} className={className} />
}

function SideWidgetEraserIcon({ className }: SideWidgetIconProps) {
  return (
    <SideWidgetFigmaIcon
      src={`${EXAM_SIDE_WIDGET_FIGMA}/download-circle-01.svg`}
      size={20}
      rotate="90"
      className={className}
    />
  )
}

/** Close menu — arrow right into vertical bar */
function SideWidgetCollapseMenuIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path d="M16 4.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M4 10H13M10.25 7L13 10L10.25 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Open menu — vertical bar with arrow left */
function SideWidgetOpenMenuIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path d="M4 4.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M16 10H7M9.75 7L7 10L9.75 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export {
  SideWidgetAccessibilityIcon,
  SideWidgetArrowsPointingInIcon,
  SideWidgetCollapseDockIcon,
  SideWidgetCollapseMenuIcon,
  SideWidgetEraserIcon,
  SideWidgetExpandIcon,
  SideWidgetFlagIcon,
  SideWidgetFullScreenIcon,
  SideWidgetHighlighterIcon,
  SideWidgetMedSizeIcon,
  SideWidgetOpenMenuIcon,
  SideWidgetResponseMaskingIcon,
  SideWidgetReviewIcon,
}
