import { cn } from "@/lib/utils"

type PracticeTimeUpModalProps = {
  open: boolean
  submitting?: boolean
  onNext: () => void
  titleId?: string
  title?: string
  message?: string
  nextLabel?: string
}

/** Figma `20645:70277` — Time's Up shell (dark Neutral / primary-25 elevated) */
const TIME_UP_MODAL_SHELL_CLASS =
  "flex w-full max-w-[484px] flex-col items-center gap-6 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--primary-25)] p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

/** Figma `20645:70285` — primary Next CTA */
const TIME_UP_NEXT_BUTTON_CLASS =
  "inline-flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[var(--primary-border)] bg-[var(--primary)] px-4 py-2 text-base font-semibold leading-[1.5] tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[var(--primary-600)] disabled:opacity-50"

function PracticeTimeUpModal({
  open,
  submitting = false,
  onNext,
  titleId = "practice-time-up-title",
  title = "Time's Up!",
  message = "Your time is up! Please click next to see result data",
  nextLabel = "Next",
}: PracticeTimeUpModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={TIME_UP_MODAL_SHELL_CLASS}>
        <div className="flex w-full max-w-[436px] flex-col items-center">
          <h2
            id={titleId}
            className="w-full text-center text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)]"
          >
            {title}
          </h2>
        </div>

        <div className="flex w-full max-w-[436px] flex-col gap-4">
          <p className="text-center text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
            {message}
          </p>

          <div className="flex items-center justify-center">
            <button
              type="button"
              className={cn(TIME_UP_NEXT_BUTTON_CLASS)}
              disabled={submitting}
              onClick={onNext}
            >
              {submitting ? "Submitting…" : nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { PracticeTimeUpModal }
