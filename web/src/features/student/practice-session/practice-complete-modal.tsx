import { useMemo } from "react"
import { Eye, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  doneLabel = "Done",
  onDone,
  titleId = "practice-complete-title",
}: PracticeCompleteModalProps) {
  const pct =
    questionCount > 0 ? Math.round((rawScore / questionCount) * 100) : 0
  const ringFill = useMemo(
    () => `conic-gradient(from 270deg, #0a357f ${pct}%, #dfe1e7 ${pct}% 100%)`,
    [pct],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex w-full max-w-[672px] flex-col items-center gap-6 rounded-2xl border border-[#dfe1e7] bg-[#f2f7ff] px-6 pb-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <div className="-mx-6 -mt-0 w-[calc(100%+3rem)] rounded-t-2xl bg-[#edf3ff] px-6 py-8 text-center">
          <h2 id={titleId} className="text-[48px] font-bold leading-[1.2] text-[#062357]">
            Well Done!
          </h2>
          <p className="mt-2.5 text-lg leading-[1.4] tracking-[0.36px] text-[#062357]">{subtitle}</p>
        </div>

        <div className="relative w-full max-w-[540px] rounded-3xl border border-[#0d47a1] bg-[#edf3ff] px-8 py-[30px]">
          <div
            className={cn(
              "relative flex min-h-[130px] select-none items-center",
              scoreHidden && "blur-[18px]",
            )}
            aria-hidden={scoreHidden}
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold tracking-[0.28px] text-[#6a7282]">Your Score</p>
              <p className="text-[48px] font-bold leading-[1.2] text-[#062357]">
                {rawScore}/{questionCount}
              </p>
              {scaledScore != null ? (
                <p className="text-sm font-semibold text-[#0d47a1]">Scaled score {scaledScore}</p>
              ) : null}
            </div>
            <div
              className="absolute right-0 top-1/2 flex size-[120px] -translate-y-1/2 items-center justify-center rounded-full p-1"
              style={{ background: ringFill }}
              aria-label={`${pct} percent`}
            >
              <div className="flex size-full items-center justify-center rounded-full bg-[#edf3ff]">
                <span className="text-[33px] font-bold leading-none text-[#666d80]">{pct}%</span>
              </div>
            </div>
          </div>
          {scoreHidden ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Eye className="size-12 text-[#666d80]" strokeWidth={1.5} aria-hidden />
              <p className="text-base font-semibold tracking-[0.32px] text-[#666d80]">
                Your score is hidden
              </p>
            </div>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full max-w-[320px] rounded-xl border-[#6d78b6] bg-[#edf3ff] text-sm font-semibold text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#e4ebff]"
          onClick={onToggleScoreHidden}
        >
          {scoreHidden ? "Peek at Score" : "Hide Score"}
        </Button>

        {showBlindReview ? (
          <div className="flex w-full max-w-[320px] flex-col items-center gap-2">
            <Button
              type="button"
              className="h-12 w-full rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] text-base font-semibold text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#0b3d82] disabled:opacity-60"
              onClick={onBlindReview}
              disabled={!onBlindReview}
            >
              Blind Review
            </Button>
            {onSkipDetails ? (
              <button
                type="button"
                className="text-xs font-semibold tracking-[0.24px] text-[#0d47a1] hover:underline"
                onClick={onSkipDetails}
              >
                Skip to view details result
              </button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-2xl border-[#dfe1e7] font-semibold text-[#0d47a1] hover:bg-[#edf3ff]"
              onClick={onDone}
            >
              {doneLabel}
            </Button>
          </div>
        ) : (
          <div className="flex w-full max-w-[320px] flex-col items-center gap-2">
            {onSkipDetails ? (
              <button
                type="button"
                className="text-xs font-semibold tracking-[0.24px] text-[#0d47a1] hover:underline"
                onClick={onSkipDetails}
              >
                Skip to view details result
              </button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-2xl border-[#dfe1e7] font-semibold text-[#0d47a1] hover:bg-[#edf3ff]"
              onClick={onDone}
            >
              {doneLabel}
            </Button>
          </div>
        )}

        {showBlindReview ? (
          <div className="flex w-full max-w-[608px] gap-3 rounded-2xl border border-[#ffbd4c] bg-[#fff6e0] p-4">
            <Info className="size-5 shrink-0 text-[#062357]" strokeWidth={2} aria-hidden />
            <p className="text-left text-sm leading-[1.5] tracking-[0.28px] text-[#062357]">
              <span className="font-semibold">Blind Review</span> helps you identify reasoning errors
              before seeing your score. It&apos;s the most effective way to improve your performance.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { PracticeCompleteModal }
