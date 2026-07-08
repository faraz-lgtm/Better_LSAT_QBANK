import type { SVGProps } from "react"

type FinishMenuIconProps = SVGProps<SVGSVGElement>

/** Figma `19641:45663` — submit section */
function FinishMenuSubmitIcon({ className, ...props }: FinishMenuIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M4.5 10.5L15.5 5.5L10.5 15.5L9.25 11.25L4.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4.5 10.5H7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.25 8.25L4.5 10.5L6.25 12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Figma `19641:45663` — save and exit */
function FinishMenuSaveExitIcon({ className, ...props }: FinishMenuIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M7.5 5.5H13.5V14.5H7.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7.5 5.5H11.5L13.5 7.5V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M4.5 10H6.5M4.5 10L6 8.5M4.5 10L6 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { FinishMenuSaveExitIcon, FinishMenuSubmitIcon }
