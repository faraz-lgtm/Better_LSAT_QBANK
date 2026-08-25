import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, FolderOpen, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { GuestDiagnosticExplanationCard } from '@/features/guest/diagnostic/guest-diagnostic-explanation-card'
import type { GuestDiagnosticResult } from '@/features/guest/diagnostic/guest-diagnostic-result-storage'
import {
  buildDiagnosticResultExplanation,
  getMiniDiagnosticQuestionMeta,
} from '@/features/guest/diagnostic/mini-diagnostic-content'
import { canShowDiagnosticResultDetails } from '@/features/guest/diagnostic/diagnostic-explanation-access'
import {
  formatDiagnosticDateLabel,
  getDiagnosticIntentTitle,
} from '@/features/guest/diagnostic/guest-diagnostic-result-storage'
import {
  GuestDiagnosticResultsActions,
  GuestFreePlanUpgradeBanner,
} from '@/features/guest/diagnostic/guest-upgrade-cta'
import { useDiagnosticSubscription } from '@/features/guest/diagnostic/use-diagnostic-subscription'
import {
  PT_RESULTS_PAGE_BG_CLASS,
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
} from '@/features/student/analytics/prep-test-results-section-styles'
import { StudentMain } from '@/features/student/components/student-main'
import { createDiagnosticApi, type MiniDiagnosticExplanation } from '@/lib/api/diagnostic'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type GuestDiagnosticResultsViewProps = {
  result: GuestDiagnosticResult
  startDiagnosticHref?: string
  reviewInTesterHref?: string
  refreshSubscription?: () => void
}

type QuestionSortMode = 'number' | 'correct' | 'incorrect'

type SortedOutcome = GuestDiagnosticResult['outcomes'][number] & {
  originalIndex: number
}

function sortOutcomes(
  outcomes: GuestDiagnosticResult['outcomes'],
  mode: QuestionSortMode,
): SortedOutcome[] {
  const withIndex: SortedOutcome[] = outcomes.map((outcome, originalIndex) => ({
    ...outcome,
    originalIndex,
  }))

  if (mode === 'number') return withIndex

  return [...withIndex].sort((a, b) => {
    if (a.isCorrect !== b.isCorrect) {
      if (mode === 'correct') return a.isCorrect ? -1 : 1
      return a.isCorrect ? 1 : -1
    }
    return a.originalIndex - b.originalIndex
  })
}

function OutcomePill({
  index,
  isCorrect,
  size = 'md',
}: {
  index: number
  isCorrect: boolean
  size?: 'md' | 'lg'
}) {
  const sizeClass = size === 'lg' ? 'size-12' : 'size-9'
  const iconSize = size === 'lg' ? 'size-5' : 'size-4'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border text-sm font-semibold',
        sizeClass,
        isCorrect
          ? 'border-[#00bc54] bg-[#e8fff1] text-[#00bc54]'
          : 'border-[#df1c41] bg-[#fff0f3] text-[#df1c41]',
      )}
      aria-label={`Question ${index + 1}: ${isCorrect ? 'correct' : 'incorrect'}`}
    >
      {isCorrect ? (
        <Check className={iconSize} strokeWidth={2.5} />
      ) : (
        <X className={iconSize} strokeWidth={2.5} />
      )}
    </span>
  )
}

function GuestDiagnosticResultsActionButtons({ href }: { href: string }) {
  return (
    <Link
      to={href}
      className="inline-flex h-10 items-center gap-2 rounded-[16px] bg-[#df1c41] px-4 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#df1c41]/90"
    >
      <FolderOpen className="size-4 shrink-0" aria-hidden />
      Review in Tester
    </Link>
  )
}

function GuestDiagnosticFreeScoreCards({
  result,
  startDiagnosticHref,
  reviewInTesterHref,
}: {
  result: GuestDiagnosticResult
  startDiagnosticHref: string
  reviewInTesterHref: string
}) {
  const incorrect = Math.max(0, result.questionCount - result.correctCount)
  const deltaLabel = incorrect > 0 ? `-${incorrect}` : `+${result.correctCount}`
  const dateLabel = formatDiagnosticDateLabel(result.completedAt)

  return (
    <section className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
      <div className="flex w-full flex-col justify-between gap-4 rounded-[16px] bg-[#0d47a1] p-6 lg:w-[290px] lg:shrink-0">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#edf3ff]">YOUR SCORE</p>
          <p className="text-[48px] font-extrabold leading-[1.2] text-white">{result.scaledScoreLabel}</p>
          <p className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#edf3ff]/90">
            Projected LSAT score range
          </p>
          <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
            {result.correctCount}/{result.questionCount} CORRECT ({deltaLabel})
          </p>
          <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
            PERCENTILE: {result.percentileLabel}
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
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <GuestDiagnosticResultsActionButtons href={reviewInTesterHref} />
            <Link
              to={startDiagnosticHref}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-[12px] bg-[#0d47a1] px-5 text-sm font-semibold tracking-[0.28px] text-white hover:bg-[#0b3d8a]"
            >
              Start Diagnostic
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
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

function GuestDiagnosticPaidScoreCards({
  result,
  startDiagnosticHref,
  reviewInTesterHref,
}: {
  result: GuestDiagnosticResult
  startDiagnosticHref: string
  reviewInTesterHref: string
}) {
  const incorrect = Math.max(0, result.questionCount - result.correctCount)
  const deltaLabel = incorrect > 0 ? `-${incorrect}` : `+${result.correctCount}`

  return (
    <section className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
      <div className="flex w-full flex-col gap-4 rounded-[16px] bg-[#0d47a1] p-6 lg:w-[290px] lg:shrink-0">
        <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#edf3ff]">YOUR SCORE</p>
        <p className="text-[48px] font-extrabold leading-[1.2] text-white">{result.scaledScoreLabel}</p>
        <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
          {result.correctCount}/{result.questionCount} CORRECT ({deltaLabel})
        </p>
        <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
          PERCENTILE: {result.percentileLabel}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col rounded-[16px] border border-[#dfe1e7] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-2xl font-bold leading-[1.3] text-[#062357]">
            {getDiagnosticIntentTitle(result.intentId)}
          </p>
          <GuestDiagnosticResultsActionButtons href={reviewInTesterHref} />
        </div>

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
  heading = "Mini Diagnostic",
  questionId,
  isCorrect,
}: {
  number: number
  heading?: string
  questionId: string
  isCorrect: boolean
}) {
  const meta = getMiniDiagnosticQuestionMeta(questionId)

  return (
    <div className="relative overflow-hidden border-t border-[#dfe1e7] first:border-t-0">
      <div className="flex gap-4 p-6">
        <div
          className={cn(
            'flex size-14 shrink-0 items-center justify-center rounded-[14px] text-lg font-bold text-white',
            isCorrect ? 'bg-[#00bc54]' : 'bg-[#df1c41]',
          )}
        >
          {number}
        </div>
        <div className="min-w-0 flex-1 select-none blur-[6px]">
          <p className="text-lg font-semibold text-[#062357]">
            {heading} · Q{number}
            {meta?.questionType ? ` · ${meta.questionType}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">LR</span>
            {meta?.questionType ? (
              <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">
                {meta.questionType}
              </span>
            ) : null}
            {meta?.difficulty ? (
              <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">
                Level {meta.difficulty}
              </span>
            ) : null}
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
  startDiagnosticHref = '/diagnostic/start',
  reviewInTesterHref = '/diagnostic/review',
  refreshSubscription,
}: GuestDiagnosticResultsViewProps) {
  const { hasActiveCore, loading: subscriptionLoading, refresh } = useDiagnosticSubscription()
  const [explanations, setExplanations] = useState<MiniDiagnosticExplanation[]>([])
  const [explanationsLoading, setExplanationsLoading] = useState(false)
  const [explanationsError, setExplanationsError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<QuestionSortMode>('number')

  useEffect(() => {
    refreshSubscription?.()
  }, [refreshSubscription])

  useEffect(() => {
    if (!hasActiveCore) {
      setExplanations([])
      setExplanationsError(null)
      return
    }

    let alive = true
    setExplanationsLoading(true)
    setExplanationsError(null)

    const diagnosticApi = createDiagnosticApi(getSupabaseBrowserClient())
    void diagnosticApi
      .getMiniDiagnosticExplanations()
      .then((payload) => {
        if (!alive) return
        if (payload.explanationsLocked) {
          setExplanations([])
          refresh()
          return
        }
        setExplanations(payload.explanations)
      })
      .catch((err) => {
        if (!alive) return
        setExplanations([])
        setExplanationsError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (alive) setExplanationsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [hasActiveCore, refresh])

  const explanationsById = useMemo(() => {
    const map = new Map<string, MiniDiagnosticExplanation>()
    for (const explanation of explanations) {
      map.set(explanation.sourceItemId, explanation)
    }
    return map
  }, [explanations])

  const sortedOutcomes = useMemo(
    () => sortOutcomes(result.outcomes, sortMode),
    [result.outcomes, sortMode],
  )

  const showPaidContent = hasActiveCore && !subscriptionLoading
  const heading = getDiagnosticIntentTitle(result.intentId)

  return (
    <StudentMain className={PT_RESULTS_PAGE_BG_CLASS} contentClassName={cn(PT_RESULTS_PAGE_GAP_CLASS, 'pb-8')}>
      {!showPaidContent ? <GuestFreePlanUpgradeBanner /> : null}

      {showPaidContent ? (
        <GuestDiagnosticPaidScoreCards
          result={result}
          startDiagnosticHref={startDiagnosticHref}
          reviewInTesterHref={reviewInTesterHref}
        />
      ) : (
        <GuestDiagnosticFreeScoreCards
          result={result}
          startDiagnosticHref={startDiagnosticHref}
          reviewInTesterHref={reviewInTesterHref}
        />
      )}

      <section className={cn(PT_RESULTS_SURFACE_CARD_CLASS, 'overflow-hidden')}>
        <div className="flex flex-col gap-3 border-b border-[#dfe1e7] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-2xl font-bold leading-[1.3] text-[#062357]">
            Total Questions: {result.questionCount}
          </p>
          <label className="flex items-center gap-2 text-sm text-[#666d80]">
            <span>Sort by</span>
            <select
              className="h-10 rounded-[10px] border border-[#dfe1e7] bg-white px-3 text-sm font-medium text-[#062357]"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as QuestionSortMode)}
              aria-label="Sort questions by"
            >
              <option value="number">Question number</option>
              <option value="correct">Correct first</option>
              <option value="incorrect">Incorrect first</option>
            </select>
          </label>
        </div>

        {showPaidContent && explanationsLoading ? (
          <p className="px-6 py-8 text-sm text-[#666d80]">Loading explanations…</p>
        ) : null}

        {showPaidContent && explanationsError ? (
          <p className="px-6 py-8 text-sm text-[#df1c41]">{explanationsError}</p>
        ) : null}

        {result.outcomes.map((outcome, index) => {
          const questionNumber = index + 1
          const unlocked = canShowDiagnosticResultDetails({
            intentId: result.intentId,
            questionNumber,
            hasActiveCore: showPaidContent,
          })
          if (!unlocked) {
            return (
              <GuestDiagnosticLockedQuestionRow
                key={outcome.questionId}
                number={questionNumber}
                heading={heading}
                questionId={outcome.questionId}
                isCorrect={outcome.isCorrect}
              />
            )
          }
          const explanation =
            explanationsById.get(outcome.questionId) ?? buildDiagnosticResultExplanation(outcome.questionId)
          if (!explanation) {
            return (
              <GuestDiagnosticLockedQuestionRow
                key={outcome.questionId}
                number={questionNumber}
                heading={heading}
                questionId={outcome.questionId}
                isCorrect={outcome.isCorrect}
              />
            )
          }
          const meta = getMiniDiagnosticQuestionMeta(outcome.questionId)
          return (
            <GuestDiagnosticExplanationCard
              key={outcome.questionId}
              number={questionNumber}
              heading={heading}
              explanation={explanation}
              isCorrect={outcome.isCorrect}
              selectedAnswer={outcome.selectedAnswer}
              targetTimeSeconds={meta?.targetTimeSeconds}
              yourTimeSeconds={outcome.timeSpentSeconds}
            />
          )
        })}
      </section>

      {!showPaidContent ? <GuestDiagnosticResultsActions /> : null}
    </StudentMain>
  )
}

export { GuestDiagnosticResultsView }
