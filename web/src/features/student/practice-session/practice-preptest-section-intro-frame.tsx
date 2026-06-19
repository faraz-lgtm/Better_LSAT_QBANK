import type { ReactNode } from "react"

import { CARD_SHADOW } from "@/features/student/practice-session/practice-preptest-section-intro-panel"
import { cn } from "@/lib/utils"

type PracticePrepTestSectionIntroFrameProps = {
  header: ReactNode
  children: ReactNode
  className?: string
}

/** Figma `18617:26304` — 1280×760 section intro shell */
function PracticePrepTestSectionIntroFrame({
  header,
  children,
  className,
}: PracticePrepTestSectionIntroFrameProps) {
  return (
    <div
      className={cn(
        "practice-section-intro relative mx-auto h-[min(760px,calc(100svh-2rem))] w-full max-w-[1280px] overflow-hidden rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] text-base",
        CARD_SHADOW,
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 z-10">{header}</div>
      <div className="absolute left-1/2 top-[127px] w-[648px] max-w-[calc(100%-2rem)] -translate-x-1/2">
        {children}
      </div>
    </div>
  )
}

export { PracticePrepTestSectionIntroFrame }
