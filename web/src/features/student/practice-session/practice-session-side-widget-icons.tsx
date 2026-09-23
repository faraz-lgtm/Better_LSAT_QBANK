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
function SideWidgetFullScreenIcon({ className }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={cn("size-5", className)}>
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
function SideWidgetMedSizeIcon({ className }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={cn("size-5", className)}>
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

function officialRailIconClass(className: string | undefined) {
  return cn("size-5", className)
}

/** LawHub `fas expand` — Full Screen */
function OfficialRailExpandIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden className={officialRailIconClass(className)} data-official-rail-icon="expand" {...props}>
      <path d="M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H64v84c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-40c-6.6 0-12 5.4-12 12v84h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-40c0-6.6-5.4-12-12-12H64v-84c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z" />
    </svg>
  )
}

/** LawHub `far expand` — Normal view */
function OfficialRailCollapseViewIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden className={officialRailIconClass(className)} data-official-rail-icon="collapse-view" {...props}>
      <path d="M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v24c0 6.6-5.4 12-12 12H48v100c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v24c0 6.6 5.4 12 12 12h100v100c0 6.6 5.4 12 12 12h24c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-24c-6.6 0-12 5.4-12 12v100H300c-6.6 0-12 5.4-12 12v24c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-24c0-6.6-5.4-12-12-12H48V332c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z" />
    </svg>
  )
}

/** LawHub Review — choice-card */
function OfficialRailReviewIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={officialRailIconClass(className)} data-official-rail-icon="review" {...props}>
      <path d="M3.71875 3.71875H16.2812V16.2812H3.71875V3.71875ZM2.57812 2C2.41146 2 2.27344 2.05729 2.16406 2.17188C2.05469 2.28646 2 2.42188 2 2.57812V17.4375C2 17.5938 2.05469 17.7266 2.16406 17.8359C2.27344 17.9453 2.41146 18 2.57812 18H17.4219C17.5885 18 17.7266 17.9453 17.8359 17.8359C17.9453 17.7266 18 17.5938 18 17.4375V2.57812C18 2.42188 17.9453 2.28646 17.8359 2.17188C17.7266 2.05729 17.5885 2 17.4219 2H2.57812ZM6.57812 12H7.71875V13.1406H6.57812V12ZM6 10.8594C5.84375 10.8594 5.70833 10.9141 5.59375 11.0234C5.47917 11.1328 5.42188 11.2708 5.42188 11.4375V13.7188C5.42188 13.875 5.47917 14.0078 5.59375 14.1172C5.70833 14.2266 5.84375 14.2812 6 14.2812H8.28125C8.4375 14.2812 8.57292 14.2266 8.6875 14.1172C8.80208 14.0078 8.85938 13.875 8.85938 13.7188V11.4375C8.85938 11.2708 8.80208 11.1328 8.6875 11.0234C8.57292 10.9141 8.4375 10.8594 8.28125 10.8594H6ZM10 7.4375C10 7.19792 10.0833 6.99479 10.25 6.82812C10.4167 6.66146 10.6198 6.57812 10.8594 6.57812H13.7188C13.9479 6.57812 14.1484 6.66146 14.3203 6.82812C14.4922 6.99479 14.5781 7.19792 14.5781 7.4375C14.5781 7.66667 14.4922 7.86458 14.3203 8.03125C14.1484 8.19792 13.9479 8.28125 13.7188 8.28125H10.8594C10.6198 8.28125 10.4167 8.19792 10.25 8.03125C10.0833 7.86458 10 7.66667 10 7.4375ZM5.42188 6.35938V9.14062C5.42188 9.29688 5.47917 9.43229 5.59375 9.54688C5.70833 9.66146 5.84375 9.71875 6 9.71875C6.15625 9.71875 6.29167 9.66146 6.40625 9.54688C6.52083 9.43229 6.57812 9.29688 6.57812 9.14062V8.57812H9.23438L8.28125 7.14062L9.23438 5.71875H6.0625C5.88542 5.71875 5.73438 5.78125 5.60938 5.90625C5.48438 6.03125 5.42188 6.18229 5.42188 6.35938ZM10 12.5781C10 12.3385 10.0833 12.1354 10.25 11.9688C10.4167 11.8021 10.6198 11.7188 10.8594 11.7188H13.7188C13.9479 11.7188 14.1484 11.8021 14.3203 11.9688C14.4922 12.1354 14.5781 12.3385 14.5781 12.5781C14.5781 12.8073 14.4922 13.0078 14.3203 13.1797C14.1484 13.3516 13.9479 13.4375 13.7188 13.4375H10.8594C10.6198 13.4375 10.4167 13.3516 10.25 13.1797C10.0833 13.0078 10 12.8073 10 12.5781Z" />
    </svg>
  )
}

/** LawHub `far universal-access` */
function OfficialRailAccessibilityIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden className={officialRailIconClass(className)} data-official-rail-icon="accessibility" {...props}>
      <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm161.5-86.1l11.9 5.1c26.1 11.2 54.2 17 82.7 17s56.5-5.8 82.7-17l11.9-5.1c12.2-5.2 26.3 .4 31.5 12.6s-.4 26.3-12.6 31.5l-11.9 5.1c-17.3 7.4-35.2 12.9-53.6 16.3v50.1c0 4.3 .7 8.6 2.1 12.6l28.7 86.1c4.2 12.6-2.6 26.2-15.2 30.4s-26.2-2.6-30.4-15.2l-24.4-73.2c-1.3-3.8-4.8-6.4-8.8-6.4s-7.6 2.6-8.8 6.4l-24.4 73.2c-4.2 12.6-17.8 19.4-30.4 15.2s-19.4-17.8-15.2-30.4l28.7-86.1c1.4-4.1 2.1-8.3 2.1-12.6V235.5c-18.4-3.5-36.3-8.9-53.6-16.3l-11.9-5.1c-12.2-5.2-17.8-19.3-12.6-31.5s19.3-17.8 31.5-12.6zM256 80a40 40 0 1 1 0 80 40 40 0 1 1 0-80z" />
    </svg>
  )
}

/** LawHub `fas flag` */
function OfficialRailFlagIcon({ className, active = false, ...props }: SideWidgetIconProps & { active?: boolean }) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden className={officialRailIconClass(className)} data-official-rail-icon={active ? "flag-active" : "flag"} {...props}>
      <path d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32L0 64 0 368 0 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-128 64.3-16.1c41.1-10.3 84.6-5.5 122.5 13.4c44.2 22.1 95.5 24.8 141.7 7.4l34.7-13c12.5-4.7 20.8-16.6 20.8-30l0-247.7c0-23-24.2-38-44.8-27.7l-9.6 4.8c-46.3 23.2-100.8 23.2-147.1 0c-35.1-17.6-75.4-22-113.5-12.5L64 48l0-16z" />
    </svg>
  )
}

/** LawHub Response Masking — strikethrough eliminator */
function OfficialRailMaskingIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={officialRailIconClass(className)} data-official-rail-icon="masking" {...props}>
      <path d="M13.0573 11.1974V12.3254C13.0573 12.9154 12.9979 13.3984 12.879 13.7744C12.7601 14.1504 12.5761 14.4194 12.327 14.5813C12.0665 14.7549 11.7127 14.8792 11.2654 14.9544C10.8181 15.0296 10.2718 15.0615 9.62633 15.0499C9.32059 15.0499 9.04034 15.0296 8.78556 14.9892C8.53079 14.9487 8.30149 14.8879 8.09766 14.8069L5.78769 16.9588C6.2293 17.2943 6.73885 17.5488 7.31635 17.7223C7.89384 17.8959 8.54494 17.9884 9.26964 18C9.77919 18 10.235 17.9682 10.6369 17.9046C11.0389 17.8409 11.3871 17.7397 11.6815 17.6009C11.9759 17.4852 12.2335 17.329 12.4544 17.1323C12.6752 16.9356 12.8535 16.7043 12.9894 16.4382H13.0573V17.8265H16.0807V7.39696L11.9873 11.1974H13.0573ZM16.811 2.31236L15.1465 3.89154C15.0333 3.74114 14.9115 3.60231 14.7813 3.47505C14.6511 3.34779 14.5067 3.2321 14.3482 3.12798C13.782 2.7462 13.1196 2.46276 12.3609 2.27766C11.6023 2.09255 10.7473 2 9.79618 2C9.23001 2 8.69781 2.04049 8.19958 2.12148C7.71267 2.21403 7.2569 2.35575 6.83227 2.54664C6.40764 2.73753 6.01415 2.97758 5.6518 3.26681C5.28946 3.55604 4.96674 3.89732 4.68365 4.29067L7.07856 6.16486C7.20311 5.93348 7.35598 5.7397 7.53716 5.58351C7.71833 5.42733 7.92215 5.29718 8.14862 5.19306C8.36377 5.11208 8.62137 5.05134 8.92144 5.01085C9.22151 4.97035 9.56405 4.95011 9.94905 4.95011C10.7304 4.93854 11.3645 5.02531 11.8514 5.21041C12.3383 5.39552 12.678 5.67896 12.8705 6.06074L10.1868 8.61171H8.84501C8.02972 8.62328 7.31635 8.74187 6.70488 8.96746C6.09342 9.19306 5.5782 9.52567 5.15924 9.96529C4.75159 10.3933 4.44303 10.8792 4.23355 11.423C4.02406 11.9667 3.91932 12.5683 3.91932 13.2278C3.91932 13.4476 3.93064 13.6558 3.95329 13.8525C3.97594 14.0492 4.01557 14.2401 4.07219 14.4252L2 16.3861L3.18896 17.6876L18 3.61388L16.811 2.31236Z" />
    </svg>
  )
}

/** Collapsed right rail: bar on the right, arrow pointing left to open. */
function OfficialRailOpenMenuIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={officialRailIconClass(className)} data-official-rail-icon="open-menu" {...props}>
      <path d="M16.25 3.75v12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.5 10H4.25M7.25 7 4.25 10l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Expanded right rail: arrow pointing right into the bar to collapse. */
function OfficialRailCollapseMenuIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={officialRailIconClass(className)} data-official-rail-icon="collapse-menu" {...props}>
      <path d="M16.25 3.75v12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.25 10h8.25M9.5 7l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function OfficialRailDockIcon({ className, expanded = false, ...props }: SideWidgetIconProps & { expanded?: boolean }) {
  return expanded ? (
    <OfficialRailCollapseMenuIcon className={className} {...props} />
  ) : (
    <OfficialRailOpenMenuIcon className={className} {...props} />
  )
}

export {
  OfficialRailAccessibilityIcon,
  OfficialRailCollapseMenuIcon,
  OfficialRailCollapseViewIcon,
  OfficialRailDockIcon,
  OfficialRailExpandIcon,
  OfficialRailFlagIcon,
  OfficialRailMaskingIcon,
  OfficialRailOpenMenuIcon,
  OfficialRailReviewIcon,
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
