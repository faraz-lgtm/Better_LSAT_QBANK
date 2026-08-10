import type { SVGProps } from "react"

type SideWidgetIconProps = SVGProps<SVGSVGElement>

/** Figma `18781:29066` — full screen */
function SideWidgetFullScreenIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M7.5 4.5H5.5V6.5M14.5 4.5H12.5V6.5M5.5 13.5V15.5H7.5M12.5 15.5H14.5V13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Figma `18781:29066` — review */
function SideWidgetReviewIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path d="M4.5 6.5H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.5 10H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.5 13.5H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Figma `18781:29066` — accessibility */
function SideWidgetAccessibilityIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <circle cx="10" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 7H13.5M10 6V11.5M7.5 15.5L10 11.5L12.5 15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.5 9.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Figma-style filled flag (matches active blue flag treatment) */
function SideWidgetFlagIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M5.25 3.25V16.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M5.25 3.5C5.25 3.5 6.35 2.85 8.75 2.85C11.15 2.85 12.1 4.15 14.5 4.15C15.55 4.15 16.35 3.9 16.75 3.7V10.85C16.35 11.05 15.55 11.3 14.5 11.3C12.1 11.3 11.15 10 8.75 10C6.35 10 5.25 10.65 5.25 10.65V3.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Figma `18781:29066` — response masking */
function SideWidgetResponseMaskingIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M4.5 10.5C5.8 7.8 7.7 6.5 10 6.5C12.3 6.5 14.2 7.8 15.5 10.5C14.2 13.2 12.3 14.5 10 14.5C7.7 14.5 5.8 13.2 4.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10.5" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 5.5L15.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Figma `18781:29066` — collapse menu */
function SideWidgetCollapseMenuIcon({ className, ...props }: SideWidgetIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path d="M14.5 4.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M4.5 10H10.5M8 7.5L10.5 10L8 12.5"
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
  SideWidgetResponseMaskingIcon,
  SideWidgetReviewIcon,
}
