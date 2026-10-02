import {
  PracticeSectionIntroStaticTimer,
  SECTION_INTRO_FIGMA,
} from "@/features/student/practice-session/practice-section-intro-static-timer"
import { cn } from "@/lib/utils"

type PracticeSectionIntroHeaderProps = {
  title: string
  timerLabel?: string
  timerDisplaySeconds: number
  onPause: () => void
  onClose: () => void
}

const iconButtonClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] transition-colors hover:bg-[var(--greyscale-25)]"

/** Figma `20596:139521` — section intro header (title + timer pill + pause + close). */
function PracticeSectionIntroHeader({
  title,
  timerLabel,
  timerDisplaySeconds,
  onPause,
  onClose,
}: PracticeSectionIntroHeaderProps) {
  return (
    <header className="practice-session-header flex w-full shrink-0 items-center rounded-t-[16px] border-b border-[var(--greyscale-100)] bg-[#eceff3] px-6 py-3">
      <div className="flex w-full min-w-0 items-center justify-between gap-4">
        <p
          className="min-w-0 truncate text-[20px] font-bold leading-[1.35] text-[#041a44]"
          title={title}
        >
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-2.5">
          <PracticeSectionIntroStaticTimer label={timerLabel} displaySeconds={timerDisplaySeconds} />
          <button type="button" className={cn(iconButtonClass)} aria-label="Pause" onClick={onPause}>
            <span className="relative inline-flex h-5 w-[22px] shrink-0 overflow-clip" aria-hidden>
              <img
                src={`${SECTION_INTRO_FIGMA}/pause.svg`}
                alt=""
                width={22}
                height={20}
                className="size-full max-w-none object-contain"
                draggable={false}
              />
            </span>
          </button>
          <button
            type="button"
            className={cn(iconButtonClass)}
            aria-label="Close section introduction"
            onClick={onClose}
          >
            <span className="relative inline-flex size-5 shrink-0 overflow-clip" aria-hidden>
              <img
                src={`${SECTION_INTRO_FIGMA}/close.svg`}
                alt=""
                width={20}
                height={20}
                className="size-full max-w-none object-contain"
                draggable={false}
              />
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

export { PracticeSectionIntroHeader }
