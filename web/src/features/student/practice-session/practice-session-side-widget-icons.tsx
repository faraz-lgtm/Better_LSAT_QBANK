import type { SVGProps } from "react"

type SideWidgetIconProps = SVGProps<SVGSVGElement>

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

/** Review — three list rows with leading squares */
function SideWidgetReviewIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <rect x="3.25" y="4" width="2.75" height="2.75" rx="0.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 5.375H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="3.25" y="8.625" width="2.75" height="2.75" rx="0.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 10H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="3.25" y="13.25" width="2.75" height="2.75" rx="0.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 14.625H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Accessibility — figure with outstretched arms and three dots below */
function SideWidgetAccessibilityIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <circle cx="10" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 7H15.5M10 5.5V11M7 15L10 11L13 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 17.25H7.25M9.35 17.25H10.65M12.75 17.25H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Flag — outline waving flag; parent may apply `fill-current` when active */
function SideWidgetFlagIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path d="M5 3V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M5 3.75C5 3.75 6.15 3.1 8.4 3.1C10.65 3.1 11.6 4.35 14 4.35C15.05 4.35 15.85 4.1 16.25 3.9V10.85C15.85 11.05 15.05 11.3 14 11.3C11.6 11.3 10.65 10.05 8.4 10.05C6.15 10.05 5 10.7 5 10.7V3.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Response masking — eye with slash */
function SideWidgetResponseMaskingIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M3.5 10C4.95 7.2 7.25 5.75 10 5.75C12.75 5.75 15.05 7.2 16.5 10C15.05 12.8 12.75 14.25 10 14.25C7.25 14.25 4.95 12.8 3.5 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="1.85" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 4.5L16 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
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
  SideWidgetCollapseMenuIcon,
  SideWidgetFlagIcon,
  SideWidgetFullScreenIcon,
  SideWidgetMedSizeIcon,
  SideWidgetOpenMenuIcon,
  SideWidgetResponseMaskingIcon,
  SideWidgetReviewIcon,
}
