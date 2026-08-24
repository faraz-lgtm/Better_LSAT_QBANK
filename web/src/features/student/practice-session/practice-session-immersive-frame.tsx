import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

const IMMERSIVE_SCRIM_BACKDROP_STYLE = {
  background: "#F2F4F7",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
} as const

type PracticeSessionImmersiveFrameProps = {
  children: ReactNode
  className?: string
  hideScrim?: boolean
}

function PracticeSessionImmersiveFrame({ children, className, hideScrim = false }: PracticeSessionImmersiveFrameProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-40 flex items-center justify-center overflow-hidden p-4 md:p-8",
        className,
      )}
    >
      {!hideScrim ? (
        <div
          className="pointer-events-none fixed inset-0"
          style={IMMERSIVE_SCRIM_BACKDROP_STYLE}
          aria-hidden
        />
      ) : null}
      <div className="relative flex h-full max-h-full min-h-0 w-full max-w-[1440px] min-w-0 flex-col items-stretch">
        {children}
      </div>
    </div>,
    document.body,
  )
}

export { PracticeSessionImmersiveFrame, IMMERSIVE_SCRIM_BACKDROP_STYLE as IMMERSIVE_SCRIM_STYLE }
