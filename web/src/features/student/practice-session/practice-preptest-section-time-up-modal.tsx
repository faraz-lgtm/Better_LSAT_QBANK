import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

const MODAL_SHELL_CLASS =
  "flex w-full max-w-[484px] flex-col items-center gap-6 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--primary-25)] p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

const SCORE_FIELD_CLASS =
  "h-[40px] w-full max-w-[300px] rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--primary-0)] px-4 py-2 text-center text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] outline-none placeholder:text-[var(--greyscale-500)] focus:border-[var(--primary)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

const SCORE_DISPLAY_CLASS =
  "flex h-[40px] w-full max-w-[300px] items-center justify-center rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--primary-0)] px-4 py-2 shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"

const CONTINUE_BTN_CLASS =
  "inline-flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[var(--primary-border)] bg-[var(--primary)] px-4 py-2 text-base font-semibold leading-[1.5] tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[var(--primary-600)] disabled:opacity-50"

const SKIP_BTN_CLASS =
  "inline-flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] px-4 py-2 text-base font-semibold leading-[1.5] tracking-[0.32px] text-[var(--primary)] transition hover:underline disabled:opacity-50"

export type PracticePrepTestSectionTimeUpStep = "predict" | "done"

export type PracticePrepTestSectionTimeUpSummary = {
  incorrectCount: number
  perSectionLabel: string
}

type PracticePrepTestSectionTimeUpModalProps = {
  open: boolean
  step: PracticePrepTestSectionTimeUpStep
  summary: PracticePrepTestSectionTimeUpSummary
  predictedScore: number | null
  continuing?: boolean
  onPredictedScoreChange: (score: number | null) => void
  onSkip: () => void
  onContinue: () => void
  titleId?: string
}

function formatIncorrectSummary(summary: PracticePrepTestSectionTimeUpSummary): string {
  const noun = summary.incorrectCount === 1 ? "question" : "questions"
  return `${summary.incorrectCount} ${noun} incorrect · ${summary.perSectionLabel}`
}

function PracticePrepTestSectionTimeUpModal({
  open,
  step,
  summary,
  predictedScore,
  continuing = false,
  onPredictedScoreChange,
  onSkip,
  onContinue,
  titleId = "preptest-section-time-up-title",
}: PracticePrepTestSectionTimeUpModalProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(predictedScore != null ? String(predictedScore) : "")

  useEffect(() => {
    if (!open || step !== "predict") return
    setDraft(predictedScore != null ? String(predictedScore) : "")
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open, predictedScore, step])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden bg-black/60 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={MODAL_SHELL_CLASS}>
        <div className="flex w-full max-w-[436px] flex-col items-center">
          <h2
            id={titleId}
            className="w-full text-center text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)]"
          >
            {step === "predict" ? "Time's Up!" : "Done!"}
          </h2>
        </div>

        <div
          className={cn(
            "flex w-full flex-col items-center justify-center gap-4",
            step === "predict" ? "max-w-[300px]" : "max-w-[346px]",
          )}
        >
          <p className="w-full text-center text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
            How do you think you scored?
          </p>

          {step === "predict" ? (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Predict your score"
              value={draft}
              className={SCORE_FIELD_CLASS}
              onChange={(event) => {
                const next = event.target.value.replace(/[^\d]/g, "")
                setDraft(next)
                if (!next.trim()) {
                  onPredictedScoreChange(null)
                  return
                }
                const parsed = Number(next)
                if (Number.isFinite(parsed)) {
                  onPredictedScoreChange(parsed)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  onSkip()
                }
              }}
            />
          ) : (
            <>
              <div className={SCORE_DISPLAY_CLASS}>
                <p className="text-center text-lg font-bold leading-[1.35] text-[var(--color-student-heading)]">
                  {predictedScore ?? "—"}
                </p>
              </div>
              <p className="w-full text-center text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
                {formatIncorrectSummary(summary)}
              </p>
            </>
          )}
        </div>

        {step === "predict" ? (
          <button type="button" className={SKIP_BTN_CLASS} onClick={onSkip}>
            Skip
            <ChevronRight className="size-5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className={CONTINUE_BTN_CLASS}
            disabled={continuing}
            onClick={onContinue}
          >
            {continuing ? "Continuing…" : "Continue"}
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

function buildPrepTestSectionTimeUpSummary(options: {
  incorrectCount: number
}): PracticePrepTestSectionTimeUpSummary {
  return {
    incorrectCount: options.incorrectCount,
    perSectionLabel: `About ${options.incorrectCount} in this section`,
  }
}

export { PracticePrepTestSectionTimeUpModal, buildPrepTestSectionTimeUpSummary }
