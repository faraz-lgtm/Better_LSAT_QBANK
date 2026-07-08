import { Check, ChevronRight, X } from "lucide-react"
import { Link } from "react-router-dom"

import { buildGuestDiagnosticPremiumQuestionDetail } from "@/features/guest/diagnostic/guest-diagnostic-premium-question-mock"
import type { GuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import {
  formatDiagnosticDateLabel,
  getDiagnosticIntentTitle,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import {
  GuestDiagnosticResultsActions,
  GuestFreePlanUpgradeBanner,
} from "@/features/guest/diagnostic/guest-upgrade-cta"
import { useGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import {
  PT_RESULTS_PAGE_BG_CLASS,
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
import { StudentMain } from "@/features/student/components/student-main"
import { PracticeQuestionResultCard } from "@/features/student/practice-session/practice-question-result-card"
import { cn } from "@/lib/utils"

type GuestDiagnosticResultsVariant = "free" | "premium"

type GuestDiagnosticResultsViewProps = {
  result: GuestDiagnosticResult
  variant?: GuestDiagnosticResultsVariant
  startDiagnosticHref?: string
  usePreviewModal?: boolean
}

function OutcomePill({
  index,
  isCorrect,
  size = "md",
}: {
  index: number
  isCorrect: boolean
  size?: "md" | "lg"
}) {
  const sizeClass = size === "lg" ? "size-12" : "size-9"
  const iconSize = size === "lg" ? "size-5" : "size-4"

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border text-sm font-semibold",
        sizeClass,
        isCorrect
          ? "border-[#00bc54] bg-[#e8fff1] text-[#00bc54]"
          : "border-[#df1c41] bg-[#fff0f3] text-[#df1c41]",
      )}
      aria-label={`Question ${index + 1}: ${isCorrect ? "correct" : "incorrect"}`}
    >
      {isCorrect ? (
        <Check className={iconSize} strokeWidth={2.5} />
      ) : (
        <X className={iconSize} strokeWidth={2.5} />
      )}
    </span>
  )
}

function GuestDiagnosticFreeScoreCards({
  result,
  startDiagnosticHref,
}: {
  result: GuestDiagnosticResult
  startDiagnosticHref: string
}) {
  const incorrect = Math.max(0, result.questionCount - result.correctCount)
  const deltaLabel = incorrect > 0 ? `-${incorrect}` : `+${result.correctCount}`
  const dateLabel = formatDiagnosticDateLabel(result.completedAt)

  return (
    <section className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
      <div className="flex w-full flex-col justify-between gap-4 rounded-[16px] bg-[#0d47a1] p-6 lg:w-[290px] lg:shrink-0">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#edf3ff]">YOUR SCORE</p>
          <p className="text-[48px] font-extrabold leading-[1.2] text-white">{result.scaledScore}</p>
          <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
            {result.correctCount}/{result.questionCount} CORRECT ({deltaLabel})
          </p>
          <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
            PERCENTILE: {result.percentile % 1 === 0 ? result.percentile : result.percentile.toFixed(1)}
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.48px] text-[#edf3ff]/90">
          Diagnostic #{result.diagnosticNumber}
          {dateLabel ? ` ${dateLabel}` : ""}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5 rounded-[16px] border border-[#dfe1e7] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-[1.3] text-[#062357]">
              {getDiagnosticIntentTitle(result.intentId)}
            </p>
            <p className="mt-1 text-base font-semibold tracking-[0.32px] text-[#062357]">
              Raw Score{" "}
              <span className="font-bold text-[#0d47a1]">
                {result.correctCount}/{result.questionCount} Correct
              </span>
            </p>
          </div>
          <Link
            to={startDiagnosticHref}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-[12px] bg-[#0d47a1] px-5 text-sm font-semibold tracking-[0.28px] text-white hover:bg-[#0b3d8a]"
          >
            Start Diagnostic
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {result.outcomes.map((outcome, index) => (
            <OutcomePill key={outcome.questionId} index={index} isCorrect={outcome.isCorrect} />
          ))}
        </div>
      </div>
    </section>
  )
}

/** Figma `19657:47945` — premium diagnostic summary row */
function GuestDiagnosticPremiumScoreCards({
  result,
  startDiagnosticHref,
}: {
  result: GuestDiagnosticResult
  startDiagnosticHref: string
}) {
  const incorrect = Math.max(0, result.questionCount - result.correctCount)
  const deltaLabel = incorrect > 0 ? `-${incorrect}` : `+${result.correctCount}`

  return (
    <section className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
      <div className="flex w-full flex-col gap-4 rounded-[16px] bg-[#0d47a1] p-6 lg:w-[290px] lg:shrink-0">
        <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#edf3ff]">YOUR SCORE</p>
        <p className="text-[48px] font-extrabold leading-[1.2] text-white">{result.scaledScore}</p>
        <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
          {result.correctCount}/{result.questionCount} CORRECT ({deltaLabel})
        </p>
        <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
          PERCENTILE: {result.percentile % 1 === 0 ? result.percentile : result.percentile.toFixed(1)}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col rounded-[16px] border border-[#dfe1e7] bg-white p-6">
        <p className="text-center text-2xl font-bold leading-[1.3] text-[#062357]">
          {getDiagnosticIntentTitle(result.intentId)}
        </p>

        <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="shrink-0">
            <p className="text-sm font-medium tracking-[0.28px] text-[#666d80]">Your Score</p>
            <p className="mt-1 text-[32px] font-extrabold leading-none text-[#0d47a1] sm:text-[40px]">
              {result.correctCount}/{result.questionCount} Correct
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap justify-center gap-3">
            {result.outcomes.map((outcome, index) => (
              <OutcomePill key={outcome.questionId} index={index} isCorrect={outcome.isCorrect} size="lg" />
            ))}
          </div>

          <Link
            to={startDiagnosticHref}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-1 self-center rounded-[12px] bg-[#0d47a1] px-6 text-sm font-semibold tracking-[0.28px] text-white hover:bg-[#0b3d8a] xl:self-auto"
          >
            Start Diagnostic
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

function GuestDiagnosticLockedQuestionRow({
  number,
  isCorrect,
}: {
  number: number
  isCorrect: boolean
}) {
  return (
    <div className="relative overflow-hidden border-t border-[#dfe1e7] first:border-t-0">
      <div className="flex gap-4 p-6">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-[14px] text-lg font-bold text-white",
            isCorrect ? "bg-[#00bc54]" : "bg-[#df1c41]",
          )}
        >
          {number}
        </div>
        <div className="min-w-0 flex-1 select-none blur-[6px]">
          <p className="text-lg font-semibold text-[#062357]">PT 129 · S1 · Q{10 + number}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">LR</span>
            <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">Medium</span>
            <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">Flaw</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-12 rounded-lg bg-[#f6f8fa]" />
            <div className="h-12 rounded-lg bg-[#f6f8fa]" />
            <div className="h-12 rounded-lg bg-[#f6f8fa]" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-white/20" aria-hidden />
    </div>
  )
}

function GuestDiagnosticResultsView({
  result,
  variant = "free",
  startDiagnosticHref = "/diagnostic/start",
  usePreviewModal = false,
}: GuestDiagnosticResultsViewProps) {
  const premiumAccount = useGuestPremiumAccount()
  const isPremium = variant === "premium" || premiumAccount != null

  return (
    <StudentMain className={PT_RESULTS_PAGE_BG_CLASS} contentClassName={cn(PT_RESULTS_PAGE_GAP_CLASS, "pb-8")}>
      {!isPremium ? <GuestFreePlanUpgradeBanner usePreviewModal={usePreviewModal} /> : null}

      {isPremium ? (
        <GuestDiagnosticPremiumScoreCards result={result} startDiagnosticHref={startDiagnosticHref} />
      ) : (
        <GuestDiagnosticFreeScoreCards result={result} startDiagnosticHref={startDiagnosticHref} />
      )}

      <section className={cn(PT_RESULTS_SURFACE_CARD_CLASS, "overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-[#dfe1e7] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-2xl font-bold leading-[1.3] text-[#062357]">
            Total Questions: {result.questionCount}
          </p>
          <label className="flex items-center gap-2 text-sm text-[#666d80]">
            <span>Sort by</span>
            <select
              className="h-10 rounded-[10px] border border-[#dfe1e7] bg-white px-3 text-sm font-medium text-[#062357]"
              defaultValue="number"
              aria-label="Sort questions by"
            >
              <option value="number">Question number</option>
              <option value="correct">Correct first</option>
              <option value="incorrect">Incorrect first</option>
            </select>
          </label>
        </div>

        {isPremium
          ? result.outcomes.map((outcome, index) => {
              const detail = buildGuestDiagnosticPremiumQuestionDetail(index + 1)
              return (
                <PracticeQuestionResultCard
                  key={outcome.questionId}
                  number={index + 1}
                  detail={detail}
                  isCorrect={outcome.isCorrect}
                  selectedAnswer={outcome.isCorrect ? "c" : "b"}
                  yourTimeSeconds={4 + index}
                  variant="in-section"
                />
              )
            })
          : result.outcomes.map((outcome, index) => (
              <GuestDiagnosticLockedQuestionRow
                key={outcome.questionId}
                number={index + 1}
                isCorrect={outcome.isCorrect}
              />
            ))}
      </section>

      {!isPremium ? (
        <GuestDiagnosticResultsActions usePreviewModal={usePreviewModal} />
      ) : null}
    </StudentMain>
  )
}

export { GuestDiagnosticResultsView, type GuestDiagnosticResultsVariant }
