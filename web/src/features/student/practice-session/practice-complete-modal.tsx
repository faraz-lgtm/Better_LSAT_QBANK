import { useMemo } from "react"

import { cn } from "@/lib/utils"

type PracticeCompleteModalProps = {
  open: boolean
  /** Figma `20645:44601` — e.g. "Reading Comprehension Drill Done!" */
  title?: string
  subtitle: string
  rawScore: number
  questionCount: number
  scaledScore?: number | null
  percentile?: number | null
  scoreHidden: boolean
  onToggleScoreHidden: () => void
  showBlindReview?: boolean
  onBlindReview?: () => void
  onSkipDetails?: () => void
  doneLabel?: string
  onDone: () => void
  titleId?: string
}

/** Figma `20645:44624` — Peek / Hide outline control */
const PEEK_SCORE_BTN_CLASS =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--primary-100)] bg-[var(--primary-25)] px-4 py-2 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[var(--primary)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-0)]"

/** Figma `20645:44626` — primary Blind Review CTA */
const BLIND_REVIEW_BTN_CLASS =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--primary-border)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600)] disabled:opacity-50"

const SKIP_DETAILS_BTN_CLASS =
  "inline-flex h-8 items-center justify-center rounded-[16px] px-4 py-2 text-xs font-semibold leading-[1.5] tracking-[0.24px] text-[var(--primary)] transition-colors hover:underline"

const DONE_BTN_CLASS =
  "inline-flex h-10 w-[320px] max-w-full shrink-0 items-center justify-center rounded-[14px] border border-[var(--primary-100)] bg-[var(--primary-25)] px-4 py-2 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[var(--primary)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-0)]"

/** Figma `20645:44614` — solid primary score circle (accuracy or percentile) */
function PracticeCompleteScoreCircle({
  percent,
  labelKind,
}: {
  percent: number
  labelKind: "percentile" | "accuracy"
}) {
  const pct = Math.max(0, Math.min(100, percent))
  const valueLabel =
    labelKind === "percentile"
      ? pct % 1 === 0
        ? String(Math.round(pct))
        : pct.toFixed(1)
      : `${Math.round(pct)}%`
  const ariaLabel =
    labelKind === "percentile" ? `${valueLabel} percentile` : `${valueLabel} percent`

  return (
    <div
      className="flex size-[120px] shrink-0 items-center justify-center rounded-full bg-[var(--primary-600)]"
      aria-label={ariaLabel}
    >
      <span className="flex flex-col items-center justify-center text-white">
        <span
          className={cn(
            "font-bold leading-none text-white",
            labelKind === "percentile" ? "text-[28px]" : "text-[36px] leading-10",
          )}
        >
          {valueLabel}
        </span>
        {labelKind === "percentile" ? (
          <span className="mt-1 text-[11px] font-semibold leading-none tracking-[0.22px] text-white/80">
            percentile
          </span>
        ) : null}
      </span>
    </div>
  )
}

/** Figma `20645:44618` — hidden-score eye */
function PracticeCompleteHiddenEyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      className={cn("size-12 shrink-0", className)}
      aria-hidden
    >
      <path
        d="M4.12306 24.6957C3.95638 24.2467 3.95638 23.7528 4.12306 23.3037C5.74646 19.3675 8.50209 16.0018 12.0406 13.6335C15.5791 11.2653 19.7411 10.001 23.9991 10.001C28.257 10.001 32.419 11.2653 35.9575 13.6335C39.496 16.0018 42.2517 19.3675 43.8751 23.3037C44.0417 23.7528 44.0417 24.2467 43.8751 24.6957C42.2517 28.632 39.496 31.9977 35.9575 34.3659C32.419 36.7342 28.257 37.9985 23.9991 37.9985C19.7411 37.9985 15.5791 36.7342 12.0406 34.3659C8.50209 31.9977 5.74646 28.632 4.12306 24.6957Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 30C27.3137 30 30 27.3137 30 24C30 20.6863 27.3137 18 24 18C20.6863 18 18 20.6863 18 24C18 27.3137 20.6863 30 24 30Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Figma `20645:44630` — Blind Review tip info */
function PracticeCompleteInfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("size-5 shrink-0", className)}
      aria-hidden
    >
      <path
        d="M9.99935 18.3337C14.6017 18.3337 18.3327 14.6027 18.3327 10.0003C18.3327 5.39795 14.6017 1.66699 9.99935 1.66699C5.39698 1.66699 1.66602 5.39795 1.66602 10.0003C1.66602 14.6027 5.39698 18.3337 9.99935 18.3337Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 13.3333V10"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 6.66699H10.0083"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PracticeCompleteModal({
  open,
  title = "Well Done!",
  subtitle,
  rawScore,
  questionCount,
  scaledScore,
  percentile = null,
  scoreHidden,
  onToggleScoreHidden,
  showBlindReview = false,
  onBlindReview,
  onSkipDetails,
  doneLabel = "Return To Dashboard",
  onDone,
  titleId = "practice-complete-title",
}: PracticeCompleteModalProps) {
  const accuracyPct = questionCount > 0 ? Math.round((rawScore / questionCount) * 100) : 0
  const usePercentile = percentile != null
  const ringPct = usePercentile ? percentile : accuracyPct
  const scoreLabel = useMemo(() => `${rawScore}/${questionCount}`, [rawScore, questionCount])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Figma `20645:44601` */}
      <div className="flex w-full max-w-[672px] flex-col items-center gap-6 rounded-[40px] border border-[var(--greyscale-100)] bg-[var(--primary-25)] px-6 pb-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] dark:bg-[var(--greyscale-0)]">
        <div className="flex w-full flex-col items-center gap-2.5 px-6 py-8 text-center">
          <h2
            id={titleId}
            className="m-0 text-[32px] font-bold leading-[1.25] text-[var(--color-student-heading)]"
          >
            {title}
          </h2>
          <p className="m-0 text-lg font-normal leading-[1.4] tracking-[0.36px] text-[var(--color-student-heading)]">
            {subtitle}
          </p>
        </div>

        {/* Figma `20645:44607` — score card */}
        <div className="relative w-full max-w-[604px] overflow-hidden rounded-[24px] border border-[var(--primary)] bg-[var(--primary-25)] px-8 py-[30px] dark:bg-[var(--greyscale-25)]">
          <div
            className={cn(
              "relative mx-auto flex min-h-[130px] w-full items-center justify-between",
              scoreHidden && "blur-[18px]",
            )}
            aria-hidden={scoreHidden}
          >
            <div className="flex flex-col gap-1 pl-6">
              <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
                Your Score
              </p>
              {scaledScore != null ? (
                <>
                  <p className="text-[48px] font-bold leading-[1.2] text-[var(--color-student-heading)]">
                    {scaledScore}
                  </p>
                  <p className="text-sm font-semibold leading-[1.5] text-[var(--primary)]">{scoreLabel}</p>
                </>
              ) : (
                <p className="text-[48px] font-bold leading-[1.2] text-[var(--color-student-heading)]">
                  {scoreLabel}
                </p>
              )}
            </div>
            <PracticeCompleteScoreCircle
              percent={ringPct}
              labelKind={usePercentile ? "percentile" : "accuracy"}
            />
          </div>

          {scoreHidden ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[24px]">
              <PracticeCompleteHiddenEyeIcon className="text-[var(--greyscale-500)]" />
              <p className="text-base font-semibold tracking-[0.32px] text-[var(--greyscale-500)]">
                Your score is hidden
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex w-full justify-center">
          <button type="button" className={PEEK_SCORE_BTN_CLASS} onClick={onToggleScoreHidden}>
            {scoreHidden ? "Peek at Score" : "Hide Score"}
          </button>
        </div>

        {showBlindReview ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                className={BLIND_REVIEW_BTN_CLASS}
                onClick={onBlindReview}
                disabled={!onBlindReview}
              >
                Blind Review
              </button>
              {onSkipDetails ? (
                <button type="button" className={SKIP_DETAILS_BTN_CLASS} onClick={onSkipDetails}>
                  Skip to view details result
                </button>
              ) : null}
            </div>

            {/* Figma `20645:44628` — Blind Review tip */}
            <div className="flex w-full max-w-[608px] items-start gap-3 rounded-[16px] border border-[var(--explanation-in-process)] bg-[var(--explanation-in-process-bg)] p-4">
              <PracticeCompleteInfoIcon className="mt-0.5 text-[var(--explanation-in-process)]" />
              <p className="text-left text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
                <span className="font-semibold">Blind Review</span> helps you identify reasoning
                errors before seeing your score. It&apos;s the most effective way to improve your
                performance.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {onSkipDetails ? (
              <button type="button" className={SKIP_DETAILS_BTN_CLASS} onClick={onSkipDetails}>
                Skip to view details result
              </button>
            ) : null}
            <button type="button" className={DONE_BTN_CLASS} onClick={onDone}>
              {doneLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export { PracticeCompleteModal }
