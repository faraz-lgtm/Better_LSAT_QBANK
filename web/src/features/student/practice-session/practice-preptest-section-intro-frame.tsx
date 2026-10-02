import type { ReactNode } from "react"

import { CARD_SHADOW } from "@/features/student/practice-session/practice-preptest-section-intro-panel"
import { cn } from "@/lib/utils"

type PracticePrepTestSectionIntroFrameProps = {
  header: ReactNode
  children: ReactNode
  className?: string
}

/** Section-intro shell — compact centered modal wrapping the directions card */
function PracticePrepTestSectionIntroFrame({
  header,
  children,
  className,
}: PracticePrepTestSectionIntroFrameProps) {
  return (
    <div
      className={cn(
        "practice-section-intro relative mx-auto flex w-full max-w-[648px] flex-col overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-base",
        CARD_SHADOW,
        className,
      )}
    >
      <div className="shrink-0">{header}</div>
      <div className="flex w-full justify-center px-6 pb-10 pt-8">
        <div className="w-full max-w-[648px]">{children}</div>
      </div>
    </div>
  )
}

export { PracticePrepTestSectionIntroFrame }
