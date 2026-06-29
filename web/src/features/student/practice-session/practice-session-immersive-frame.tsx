import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

const IMMERSIVE_SCRIM_BACKDROP_STYLE = {
  background: "#041a44",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
} as const

type PracticeSessionImmersiveFrameProps = {
  children: ReactNode
  className?: string
}

function PracticeSessionImmersiveFrame({ children, className }: PracticeSessionImmersiveFrameProps) {
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
      <div
        className="pointer-events-none fixed inset-0"
        style={IMMERSIVE_SCRIM_BACKDROP_STYLE}
        aria-hidden
      />
      <div className="relative flex h-full max-h-full w-full max-w-[1280px] min-h-0 min-w-0 flex-col">
        {children}
      </div>
    </div>,
    document.body,
  )
}

export { PracticeSessionImmersiveFrame, IMMERSIVE_SCRIM_BACKDROP_STYLE as IMMERSIVE_SCRIM_STYLE }
