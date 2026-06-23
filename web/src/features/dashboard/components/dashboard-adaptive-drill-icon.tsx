import type { SVGProps } from "react"

/** Figma `18066:10327` filter icon — adaptive drill card with sliders */
function DashboardAdaptiveDrillIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M4 19V5C4 3.34315 5.34315 2 7 2H17C18.6569 2 20 3.34315 20 5V16M4 19C4 20.6569 5.34315 22 7 22H17C18.6569 22 20 20.6569 20 19V16M4 19C4 17.3431 5.34315 16 7 16H20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 6.5H9.77778M15.8889 6.5H17M15.8889 6.5C15.8889 7.32843 15.1427 8 14.2222 8H13.1111C12.1906 8 11.4444 7.32843 11.4444 6.5C11.4444 5.67157 12.1906 5 13.1111 5L14.2222 5C15.1427 5 15.8889 5.67157 15.8889 6.5ZM14.2222 11.5H17M7 11.5H8.11111M8.11111 11.5C8.11111 12.3284 8.8573 13 9.77778 13H10.8889C11.8094 13 12.5556 12.3284 12.5556 11.5C12.5556 10.6716 11.8094 10 10.8889 10H9.77778C8.8573 10 8.11111 10.6716 8.11111 11.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export { DashboardAdaptiveDrillIcon }
