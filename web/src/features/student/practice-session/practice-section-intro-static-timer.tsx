import { formatPracticeElapsed } from "@/features/student/practice-session/use-practice-session-timer"
import { cn } from "@/lib/utils"

type PracticeSectionIntroStaticTimerProps = {
  label?: string
  displaySeconds: number
  className?: string
}

const SECTION_INTRO_FIGMA = "/figma/section-intro"

/** Figma `20596:139525` — timer pill (clock + label + time, no progress bar). */
function PracticeSectionIntroStaticTimer({
  label = "Time Left",
  displaySeconds,
  className,
}: PracticeSectionIntroStaticTimerProps) {
  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3",
        className,
      )}
      aria-hidden
    >
      <div className="flex items-center gap-2.5">
        <span className="relative inline-flex size-6 shrink-0 items-start justify-center overflow-clip rounded-lg pt-1 px-1">
          <img
            src={`${SECTION_INTRO_FIGMA}/timer.svg`}
            alt=""
            width={16}
            height={16}
            className="size-4 max-w-none object-contain"
            draggable={false}
          />
        </span>
        <span className="shrink-0 whitespace-nowrap text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
          {label}
        </span>
        <span className="w-[46px] shrink-0 whitespace-nowrap text-right text-[14px] font-semibold leading-[1.5] tabular-nums tracking-[0.28px] text-[#041a44]">
          {formatPracticeElapsed(displaySeconds)}
        </span>
      </div>
    </div>
  )
}

export { PracticeSectionIntroStaticTimer, SECTION_INTRO_FIGMA }
