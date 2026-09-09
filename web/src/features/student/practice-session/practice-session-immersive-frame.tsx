import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { OFFICIAL_IMMERSIVE_FRAME_CLASS } from "@/features/student/practice-session/practice-session-official-styles"
import { cn } from "@/lib/utils"

const IMMERSIVE_SCRIM_BACKDROP_STYLE = {
  background: "var(--background)",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
} as const

type PracticeSessionImmersiveFrameProps = {
  children: ReactNode
  className?: string
  hideScrim?: boolean
  /** Skip the 1920px cap (results / review shells that own their own width). */
  fullBleed?: boolean
  /** Fill the viewport horizontally, still capped at the Figma 1920px desktop canvas. */
  fullWidth?: boolean
}

function PracticeSessionImmersiveFrame({
  children,
  className,
  hideScrim = false,
  fullBleed = false,
  fullWidth = false,
}: PracticeSessionImmersiveFrameProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const edgeToEdge = fullBleed || fullWidth
  const hideBackdrop = hideScrim || edgeToEdge

  return createPortal(
    <div
      data-practice-session-immersive-frame
      className={cn(
        "fixed inset-0 z-40 flex items-center justify-center overflow-hidden",
        edgeToEdge ? OFFICIAL_IMMERSIVE_FRAME_CLASS : "p-4 md:p-8",
        className,
      )}
    >
      {!hideBackdrop ? (
        <div
          className="pointer-events-none fixed inset-0"
          style={IMMERSIVE_SCRIM_BACKDROP_STYLE}
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "relative flex h-full max-h-full min-h-0 w-full min-w-0 flex-col items-stretch",
          fullBleed ? "max-w-none" : "mx-auto max-w-[1920px]",
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export { PracticeSessionImmersiveFrame, IMMERSIVE_SCRIM_BACKDROP_STYLE as IMMERSIVE_SCRIM_STYLE }
