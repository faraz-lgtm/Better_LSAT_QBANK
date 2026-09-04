import { cn } from "@/lib/utils"

type PracticeSessionPauseModalProps = {
  open: boolean
  title?: string
  message?: string
  saving?: boolean
  onSaveAndExit: () => void
  onResume: () => void
}

/** Matches practice complete / pause modal chrome (Figma dark Neutral-0 elevated) */
const PAUSE_MODAL_SAVE_EXIT_BUTTON_CLASS =
  "inline-flex h-[48px] min-w-[140px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[var(--greyscale-100)] bg-transparent px-4 py-2 text-base font-semibold leading-[1.5] tracking-[0.32px] text-[var(--primary)] shadow-[0px_1px_2px_rgba(13,13,18,0.06)] transition hover:bg-[var(--primary-0)] disabled:opacity-50"

const PAUSE_MODAL_RESUME_BUTTON_CLASS =
  "inline-flex h-[48px] min-w-[140px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[var(--primary-border)] bg-[var(--primary)] px-4 py-2 text-base font-semibold leading-[1.5] tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[var(--primary-600)] disabled:opacity-50"

function PracticeSessionPauseModal({
  open,
  title = "Section",
  message = "Your section is paused",
  saving = false,
  onSaveAndExit,
  onResume,
}: PracticeSessionPauseModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-session-pause-title"
    >
      <div className="flex w-full max-w-[484px] flex-col items-center gap-6 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--primary-25)] p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <div className="flex w-full max-w-[436px] flex-col items-center gap-4">
          <h2
            id="practice-session-pause-title"
            className="w-full text-center text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)]"
          >
            {title}
          </h2>
          <p className="text-center text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
            {message}
          </p>
        </div>

        <div className="flex w-full max-w-[436px] items-center justify-center gap-8">
          <button
            type="button"
            className={cn(PAUSE_MODAL_SAVE_EXIT_BUTTON_CLASS)}
            disabled={saving}
            onClick={onSaveAndExit}
          >
            Save &amp; Exit
          </button>
          <button
            type="button"
            className={cn(PAUSE_MODAL_RESUME_BUTTON_CLASS)}
            disabled={saving}
            onClick={onResume}
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  )
}

export { PracticeSessionPauseModal }
