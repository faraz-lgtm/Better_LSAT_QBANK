import { useMemo } from "react"

import { cn } from "@/lib/utils"

type PracticeCompleteModalProps = {
  open: boolean
  subtitle: string
  rawScore: number
  questionCount: number
  scaledScore?: number | null
  scoreHidden: boolean
  onToggleScoreHidden: () => void
  showBlindReview?: boolean
  onBlindReview?: () => void
  onSkipDetails?: () => void
  doneLabel?: string
  onDone: () => void
  titleId?: string
}

/** Figma `18617:26597` */
const PEEK_SCORE_BTN_CLASS =
  "inline-flex h-[40px] w-[320px] max-w-full shrink-0 items-center justify-center rounded-[12px] border border-[#6d78b6] bg-[#edf3ff] px-4 py-2 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#e5edff]"

const BLIND_REVIEW_BTN_CLASS =
  "inline-flex h-[48px] w-[320px] max-w-full shrink-0 items-center justify-center rounded-[16px] border border-[#0b4e6e] bg-[#0d47a1] px-4 py-2 text-base font-semibold leading-[1.5] tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#0a3d8a] disabled:opacity-50"

const SKIP_DETAILS_BTN_CLASS =
  "inline-flex h-8 items-center justify-center rounded-[16px] px-4 py-2 text-xs font-semibold leading-[1.5] tracking-[0.24px] text-[#0d47a1] transition-colors hover:underline"

const DONE_BTN_CLASS =
  "inline-flex h-[48px] w-[320px] max-w-full shrink-0 items-center justify-center rounded-[16px] border border-[#6d78b6] bg-[#edf3ff] px-4 py-2 text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#e5edff]"

/** Figma `18617:26705` — visible score ring */
function PracticeCompleteScoreRing({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, percent))
  const size = 120
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (pct / 100) * circumference

  return (
    <div className="relative size-[120px] shrink-0" aria-label={`${pct} percent`}>
      <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#dfe1e7"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0d47a1"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[33px] font-bold leading-[1.5] text-[#666d80]">
        {pct}%
      </span>
    </div>
  )
}

function PracticeCompleteHiddenEyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-12 shrink-0", className)}
      aria-hidden
    >
      <path
        d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.0004 10.3431 9.0004 12C9.0004 13.6569 10.3435 15 12.0004 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PracticeCompleteModal({
  open,
  subtitle,
  rawScore,
  questionCount,
  scaledScore,
  scoreHidden,
  onToggleScoreHidden,
  showBlindReview = false,
  onBlindReview,
  onSkipDetails,
  doneLabel = "Return To Dashboard",
  onDone,
  titleId = "practice-complete-title",
}: PracticeCompleteModalProps) {
  const pct = questionCount > 0 ? Math.round((rawScore / questionCount) * 100) : 0
  const scoreLabel = useMemo(() => `${rawScore}/${questionCount}`, [rawScore, questionCount])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex w-full max-w-[672px] flex-col items-center gap-[24px] rounded-[16px] border border-[#dfe1e7] bg-[#f2f7ff] px-6 pb-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <div className="-mx-6 w-[calc(100%+3rem)] rounded-t-[16px] bg-[#edf3ff] px-6 py-8 text-center">
          <h2 id={titleId} className="text-[48px] font-bold leading-[1.2] text-[#062357]">
            Well Done!
          </h2>
          <p className="mt-2.5 text-lg leading-[1.4] tracking-[0.36px] text-[#062357]">{subtitle}</p>
        </div>

        <div className="relative w-full max-w-[604px] rounded-[24px] border border-[#0d47a1] bg-[#edf3ff] px-8 py-[30px]">
          <div
            className={cn(
              "relative mx-auto flex min-h-[130px] w-full max-w-[540px] items-center justify-between",
              scoreHidden && "blur-[18px]",
            )}
            aria-hidden={scoreHidden}
          >
            <div className="flex flex-col gap-1 pl-6">
              <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#6a7282]">Your Score</p>
              <p className="text-[48px] font-bold leading-[1.2] text-[#062357]">{scoreLabel}</p>
              {scaledScore != null ? (
                <p className="text-sm font-semibold leading-[1.5] text-[#0d47a1]">Scaled score {scaledScore}</p>
              ) : null}
            </div>
            <PracticeCompleteScoreRing percent={pct} />
          </div>

          {scoreHidden ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[24px]">
              <PracticeCompleteHiddenEyeIcon className="text-[#666d80]" />
              <p className="text-base font-semibold tracking-[0.32px] text-[#666d80]">
                Your score is hidden
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex w-full max-w-[436px] justify-center">
          <button
            type="button"
            className={PEEK_SCORE_BTN_CLASS}
            onClick={onToggleScoreHidden}
          >
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

            <div className="flex w-full max-w-[608px] gap-3 rounded-[16px] border border-[#ffbd4c] bg-[#fff6e0] p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="mt-0.5 size-5 shrink-0 text-[#062357]"
              aria-hidden
            >
              <path
                d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z"
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
                d="M10 6.66667H10.0083"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-left text-sm leading-normal tracking-[0.28px] text-[#062357]">
              <span className="font-semibold">Blind Review</span> helps you identify reasoning errors
              before seeing your score. It&apos;s the most effective way to improve your performance.
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
