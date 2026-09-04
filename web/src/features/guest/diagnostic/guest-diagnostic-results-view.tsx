import { useEffect, useMemo, useState } from 'react'
import { Check, Lock, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { GuestDiagnosticExplanationCard } from '@/features/guest/diagnostic/guest-diagnostic-explanation-card'
import type { GuestDiagnosticResult } from '@/features/guest/diagnostic/guest-diagnostic-result-storage'
import {
  buildDiagnosticResultExplanation,
  getDiagnosticQuestionMeta,
} from '@/features/guest/diagnostic/mini-diagnostic-content'
import { canShowDiagnosticResultDetails, freeDiagnosticExplanationLimit } from '@/features/guest/diagnostic/diagnostic-explanation-access'
import {
  formatDiagnosticDateLabel,
  getDiagnosticIntentTitle,
} from '@/features/guest/diagnostic/guest-diagnostic-result-storage'
import { useGuestPricingModal } from '@/features/guest/pricing/guest-pricing-modal-provider'
import { useDiagnosticSubscription } from '@/features/guest/diagnostic/use-diagnostic-subscription'
import {
  PT_RESULTS_PAGE_BG_CLASS,
} from '@/features/student/analytics/prep-test-results-section-styles'
import { StudentMain } from '@/features/student/components/student-main'
import { createDiagnosticApi, type MiniDiagnosticExplanation } from '@/lib/api/diagnostic'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { GuestDiagnosticIntentId } from '@/features/guest/diagnostic/guest-diagnostic-intent-types'

// ─── Types ────────────────────────────────────────────────────────────────────

type GuestDiagnosticResultsViewProps = {
  result: GuestDiagnosticResult
  reviewInTesterHref?: string
  refreshSubscription?: () => void
}

type QuestionSortMode = 'number' | 'correct' | 'incorrect'

type SortedOutcome = GuestDiagnosticResult['outcomes'][number] & {
  originalIndex: number
}

type PointLeak = {
  questionType: string
  section: string
  total: number
  missed: number
  avgTimeSeconds: number | null
  avgTargetSeconds: number | null
  overSeconds: number | null
  pointsRecoverable: number
}

type DifficultyAccuracy = {
  difficulty: number
  correct: number
  total: number
  accuracy: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LSAT_MIN = 120
const LSAT_MAX = 180
const LSAT_GOAL_SCORE = 165

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Very Hard',
}

const RC_QUESTION_TYPES = new Set([
  'Inference',
  'Main Point',
  'Primary Purpose',
  "Author's Attitude",
  'Function',
  'Organization',
  'Analogy',
  'Structure',
  'Global',
])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scaledScoreToPercent(score: number): number {
  return Math.max(0, Math.min(100, ((score - LSAT_MIN) / (LSAT_MAX - LSAT_MIN)) * 100))
}

function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.round(totalSeconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getQuestionSection(questionType: string): string {
  return RC_QUESTION_TYPES.has(questionType) ? 'Reading Comprehension' : 'Logical Reasoning'
}

function computePointLeaks(
  outcomes: GuestDiagnosticResult['outcomes'],
  intentId: GuestDiagnosticIntentId,
): PointLeak[] {
  const groups: Record<
    string,
    { missed: number; total: number; totalTime: number; totalTarget: number; count: number }
  > = {}

  for (const outcome of outcomes) {
    const meta = getDiagnosticQuestionMeta(outcome.questionId, intentId)
    if (!meta?.questionType) continue
    const type = meta.questionType
    if (!groups[type]) groups[type] = { missed: 0, total: 0, totalTime: 0, totalTarget: 0, count: 0 }
    groups[type].total++
    if (!outcome.isCorrect) groups[type].missed++
    if (outcome.timeSpentSeconds != null && meta.targetTimeSeconds) {
      groups[type].totalTime += outcome.timeSpentSeconds
      groups[type].totalTarget += meta.targetTimeSeconds
      groups[type].count++
    }
  }

  return Object.entries(groups)
    .filter(([, g]) => g.missed > 0)
    .map(([questionType, g]) => {
      const avgTime = g.count > 0 ? g.totalTime / g.count : null
      const avgTarget = g.count > 0 ? g.totalTarget / g.count : null
      const overSeconds = avgTime != null && avgTarget != null ? avgTime - avgTarget : null
      const missRate = g.missed / g.total
      const pointsRecoverable = Math.max(1, Math.round(g.missed + (missRate > 0.6 ? 1 : 0)))
      return {
        questionType,
        section: getQuestionSection(questionType),
        total: g.total,
        missed: g.missed,
        avgTimeSeconds: avgTime,
        avgTargetSeconds: avgTarget,
        overSeconds,
        pointsRecoverable,
      }
    })
    .sort((a, b) => b.pointsRecoverable - a.pointsRecoverable || b.missed - a.missed)
}

function computeAccuracyByDifficulty(
  outcomes: GuestDiagnosticResult['outcomes'],
  intentId: GuestDiagnosticIntentId,
): DifficultyAccuracy[] {
  const groups: Record<number, { correct: number; total: number }> = {}
  for (const outcome of outcomes) {
    const meta = getDiagnosticQuestionMeta(outcome.questionId, intentId)
    const diff = meta?.difficulty ?? 3
    if (!groups[diff]) groups[diff] = { correct: 0, total: 0 }
    groups[diff].total++
    if (outcome.isCorrect) groups[diff].correct++
  }
  return Object.entries(groups)
    .map(([diff, g]) => ({
      difficulty: Number(diff),
      correct: g.correct,
      total: g.total,
      accuracy: g.total > 0 ? g.correct / g.total : 0,
    }))
    .sort((a, b) => a.difficulty - b.difficulty)
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

// ─── Small shared atoms ───────────────────────────────────────────────────────

function OutcomePill({ index, isCorrect }: { index: number; isCorrect: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
        isCorrect
          ? 'border-[#00bc54] bg-[#e8fff1] text-[#00bc54]'
          : 'border-[#df1c41] bg-[#fff0f3] text-[#df1c41]',
      )}
      aria-label={`Q${index + 1}: ${isCorrect ? 'correct' : 'incorrect'}`}
    >
      {isCorrect ? (
        <Check className="size-3.5" strokeWidth={2.5} />
      ) : (
        <X className="size-3.5" strokeWidth={2.5} />
      )}
    </span>
  )
}

function SectionLockedBadge() {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 py-1">
      <Lock className="size-3 text-[var(--greyscale-500)]" />
      <span className="text-xs font-semibold text-[var(--greyscale-500)]">Locked</span>
    </div>
  )
}

/** Horizontal bar showing score position on 120–180 scale */
function ScoreRangeBar({
  scoreLow,
  scoreHigh,
  goalScore,
  showGoal = false,
}: {
  scoreLow: number
  scoreHigh: number
  goalScore?: number
  showGoal?: boolean
}) {
  const leftPct = scaledScoreToPercent(scoreLow)
  const rightPct = scaledScoreToPercent(scoreHigh)
  const widthPct = Math.max(2, rightPct - leftPct)
  const goalPct = goalScore != null ? scaledScoreToPercent(goalScore) : null

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--greyscale-100)]">
        <div
          className="absolute top-0 h-full rounded-full bg-[var(--primary)]"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        {showGoal && goalPct != null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-[#df1c41]"
            style={{ left: `${goalPct}%` }}
          />
        )}
      </div>
      <div className="flex justify-between">
        {[120, 135, 150, 165, 180].map((label) => (
          <span key={label} className="text-[11px] leading-none text-[var(--greyscale-400)]">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Section 1: Page Header ───────────────────────────────────────────────────

function DiagnosticPageHeader({
  result,
  onSubscribe,
}: {
  result: GuestDiagnosticResult
  onSubscribe: () => void
}) {
  const dateLabel = formatDiagnosticDateLabel(result.completedAt)
  const intentTitle = getDiagnosticIntentTitle(result.intentId)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold leading-[1.3] text-[var(--color-student-heading)]">
          Here&apos;s your baseline
        </h1>
        <p className="text-sm font-medium leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
          {intentTitle} · {result.questionCount} questions
          {dateLabel ? ` · completed ${dateLabel}` : ''}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 py-2 sm:flex">
          <span className="size-2 shrink-0 rounded-full bg-[var(--primary)]" />
          <span className="text-xs font-semibold leading-normal text-[var(--color-student-heading)]">
            Take your first full exam to track progress
          </span>
        </div>
        <button
          type="button"
          onClick={onSubscribe}
          className="hidden h-10 shrink-0 items-center rounded-[12px] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-600)] sm:flex"
        >
          Subscribe
        </button>
      </div>
    </div>
  )
}

// ─── Section 2: Score Cards ───────────────────────────────────────────────────

function EstimatedScoreCard({ result }: { result: GuestDiagnosticResult }) {
  const gapPoints = LSAT_GOAL_SCORE - result.scaledScore

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
      <p className="text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
        Estimated scaled score
      </p>

      <div className="flex flex-col gap-1">
        <p className="text-[52px] font-extrabold leading-none text-[var(--color-student-heading)]">
          {result.scaledScore}
        </p>
        <p className="text-base font-medium leading-normal text-[var(--greyscale-500)]">
          Likely range{' '}
          <span className="font-semibold text-[var(--color-student-heading)]">
            {result.scaledScoreLow}–{result.scaledScoreHigh}
          </span>
          {' · '}
          <span className="font-semibold text-[var(--color-student-heading)]">
            {Math.round(result.percentile)}th percentile
          </span>
        </p>
      </div>

      <ScoreRangeBar
        scoreLow={result.scaledScoreLow}
        scoreHigh={result.scaledScoreHigh}
        goalScore={LSAT_GOAL_SCORE}
        showGoal
      />

      <div className="flex flex-wrap gap-5">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-[var(--primary)]" />
          <span className="text-xs leading-normal text-[var(--greyscale-500)]">Your estimated range</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-0.5 bg-[#df1c41]" />
          <span className="text-xs leading-normal text-[var(--greyscale-500)]">
            Your goal score ({LSAT_GOAL_SCORE})
          </span>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--greyscale-400)]">
        Estimated from {result.questionCount} questions. Your first full-length PrepTest will give
        a more accurate score.
      </p>

      {gapPoints > 0 && (
        <div className="mt-auto rounded-[10px] bg-[var(--primary-0)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--color-student-heading)]">
            {gapPoints} points from your goal
          </p>
          <p className="mt-0.5 text-xs text-[var(--greyscale-500)]">
            Score {LSAT_GOAL_SCORE} to reach the top law schools
          </p>
        </div>
      )}
    </div>
  )
}

function GapToGoalCard({
  result,
  onSubscribe,
}: {
  result: GuestDiagnosticResult
  onSubscribe: () => void
}) {
  const gapPoints = Math.max(0, LSAT_GOAL_SCORE - result.scaledScore)
  const projectedLow = Math.min(180, result.scaledScoreLow + 9)
  const projectedHigh = Math.min(180, result.scaledScoreHigh + 11)

  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
      <p className="text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
        Gap to your goal
      </p>

      <div className="flex flex-col gap-1">
        <p className="text-[52px] font-extrabold leading-none text-[var(--color-student-heading)]">
          {gapPoints} {gapPoints === 1 ? 'point' : 'points'}
        </p>
        <p className="text-sm font-medium leading-normal text-[var(--greyscale-500)]">
          Students who started in your range and studied consistently reached{' '}
          <span className="font-semibold text-[var(--color-student-heading)]">
            {projectedLow}–{projectedHigh}
          </span>{' '}
          in 14 weeks.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--greyscale-500)]">Today</span>
            <span className="text-xs font-bold text-[var(--color-student-heading)]">
              {result.scaledScoreLow}–{result.scaledScoreHigh}
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--greyscale-100)]">
            <div
              className="absolute top-0 h-full rounded-full bg-[#9ab4e0]"
              style={{
                left: `${scaledScoreToPercent(result.scaledScoreLow)}%`,
                width: `${Math.max(2, scaledScoreToPercent(result.scaledScoreHigh) - scaledScoreToPercent(result.scaledScoreLow))}%`,
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--greyscale-500)]">
              Projected, 14 weeks of structured prep
            </span>
            <span className="text-xs font-bold text-[var(--color-student-heading)]">
              {projectedLow}–{projectedHigh}
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--greyscale-100)]">
            <div
              className="absolute top-0 h-full rounded-full bg-[var(--primary)]"
              style={{
                left: `${scaledScoreToPercent(projectedLow)}%`,
                width: `${Math.max(2, scaledScoreToPercent(projectedHigh) - scaledScoreToPercent(projectedLow))}%`,
              }}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] text-[var(--greyscale-400)]">120</span>
          <span className="text-[11px] text-[var(--greyscale-400)]">180</span>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--greyscale-400)]">
        Projection from past betterLSAT students with similar starting diagnostics. Individual
        results vary.
      </p>

      {/* Lock gradient + CTA */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end rounded-[16px] bg-gradient-to-t from-[var(--greyscale-0)]/95 via-[var(--greyscale-0)]/60 to-transparent pb-8">
        <div className="pointer-events-auto flex flex-col items-center gap-3 px-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-full border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">
            <Lock className="size-4 text-[var(--greyscale-500)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-student-heading)]">Unlock your full projection</p>
          <button
            type="button"
            onClick={onSubscribe}
            className="h-9 rounded-[10px] bg-[var(--primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-600)]"
          >
            Unlock my full report
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Section 3: Three Stats Row ───────────────────────────────────────────────

function DiagnosticStatsRow({
  result,
  onSubscribe,
}: {
  result: GuestDiagnosticResult
  onSubscribe: () => void
}) {
  const accuracyPct = Math.round((result.correctCount / Math.max(1, result.questionCount)) * 100)

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] sm:grid-cols-3">
      <div className="flex flex-col gap-2 border-b border-[var(--greyscale-100)] p-6 sm:border-b-0 sm:border-r">
        <p className="text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
          Correct answers
        </p>
        <p className="text-[28px] font-bold leading-[1.2] text-[var(--color-student-heading)]">
          {result.correctCount}/{result.questionCount}
        </p>
        <p className="text-sm font-medium leading-normal text-[var(--greyscale-500)]">{accuracyPct}% accuracy</p>
      </div>

      <div className="flex flex-col gap-2 border-b border-[var(--greyscale-100)] p-6 sm:border-b-0 sm:border-r">
        <p className="text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
          Percentile
        </p>
        <p className="text-[28px] font-bold leading-[1.2] text-[var(--color-student-heading)]">
          {result.percentileLabel}
        </p>
        <p className="text-sm font-medium leading-normal text-[var(--greyscale-500)]">
          Range: {result.scaledScoreLow}–{result.scaledScoreHigh}
        </p>
      </div>

      <div className="relative overflow-hidden p-6">
        <p className="text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
          Projected Score Band
        </p>
        <p className="mt-2 select-none text-[28px] font-bold leading-[1.2] text-[var(--color-student-heading)] blur-sm">
          —
        </p>
        <p className="mt-1 select-none text-sm font-medium leading-normal text-[var(--greyscale-500)] blur-sm">
          After 14 weeks of prep
        </p>
        <div className="absolute inset-0 flex items-center justify-center rounded-br-[16px] bg-[var(--greyscale-0)]/80">
          <button
            type="button"
            onClick={onSubscribe}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            <Lock className="size-3.5" />
            Unlock full analysis
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Free analytics limit gate (standalone; no locked question rows) ─────────

function FreeAnalyticsLimitGate({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-[18px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-10 text-center shadow-[0px_1px_2px_rgba(13,13,18,0.06)]">
      <Lock className="size-9 text-[var(--primary)]" strokeWidth={2} aria-hidden />
      <div className="flex max-w-[36rem] flex-col items-center gap-4">
        <h3 className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">
          You&apos;ve reached your free analytics limit!
        </h3>
        <p className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
          Subscribe today for unlimited practice results, detailed analytics, and full access to
          everything BetterLSAT has to offer.
        </p>
        <button
          type="button"
          onClick={onSubscribe}
          className="inline-flex h-12 items-center justify-center rounded-[16px] border border-[var(--primary-border)] bg-[var(--primary)] px-4 text-base font-semibold tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600)]"
        >
          Full Access
        </button>
      </div>
    </div>
  )
}

// ─── Section 5: Point Leak Map ────────────────────────────────────────────────

function PointLeakRow({
  rank,
  leak,
  onDrill,
}: {
  rank: number
  leak: PointLeak
  onDrill: () => void
}) {
  const missLabel =
    `Missed ${leak.missed} of ${leak.total}` +
    (leak.overSeconds != null && leak.overSeconds > 10
      ? ` · averaged ${formatSeconds(leak.avgTimeSeconds!)}, ${formatSeconds(leak.overSeconds)} over budget`
      : '')

  return (
    <div className="flex items-center gap-3 border-t border-[var(--greyscale-100)] px-6 py-4 first:border-t-0">
      <div className="flex w-7 shrink-0 justify-start">
        <span className="text-sm font-bold text-[var(--greyscale-400)]">{rank}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--color-student-heading)]">
          {leak.questionType}
          <span className="ml-1.5 font-normal text-[var(--greyscale-500)]">· {leak.section}</span>
        </p>
        <p className="mt-0.5 text-xs font-medium text-[var(--greyscale-500)]">{missLabel}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[var(--greyscale-100)]">
            <div
              className="h-full rounded-full bg-[var(--primary)]"
              style={{ width: `${(leak.missed / leak.total) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--greyscale-400)]">
            {Math.round((leak.missed / leak.total) * 100)}% miss rate
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="text-lg font-bold leading-none text-[#df1c41]">
            +{leak.pointsRecoverable}
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--greyscale-400)]">
            {leak.pointsRecoverable === 1 ? 'point' : 'points'}
          </p>
        </div>
        <button
          type="button"
          onClick={onDrill}
          className="h-8 rounded-[8px] bg-[var(--primary)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--primary-600)]"
        >
          Drill
        </button>
      </div>
    </div>
  )
}

function PointLeakMapSection({
  leaks,
  onSubscribe,
}: {
  leaks: PointLeak[]
  onSubscribe: () => void
}) {
  const visibleLeaks = leaks.slice(0, 2)
  const lockedLeaks = leaks.slice(2)
  const lockedPoints = lockedLeaks.reduce((sum, l) => sum + l.pointsRecoverable, 0)
  const totalRecoverable = leaks.reduce((sum, l) => sum + l.pointsRecoverable, 0)

  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[var(--greyscale-100)] px-6 py-5">
        <div>
          <h3 className="text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]">Your point leak map</h3>
          <p className="mt-0.5 text-sm font-medium text-[var(--greyscale-500)]">
            All {leaks.length} leaks, ranked by points you can realistically get back. Total
            recoverable:{' '}
            <span className="font-semibold text-[var(--color-student-heading)]">~{totalRecoverable} points</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onSubscribe}
          className="shrink-0 rounded-[8px] border border-[var(--greyscale-100)] px-3 py-1.5 text-sm font-semibold text-[var(--color-student-heading)] transition-colors hover:bg-[var(--greyscale-25)]"
        >
          Drill all {leaks.length}
        </button>
      </div>

      {/* Visible rows (with Drill button) */}
      {visibleLeaks.length === 0 ? (
        <div className="px-6 py-8 text-sm text-[var(--greyscale-500)]">No point leaks found — great work!</div>
      ) : (
        <div>
          {visibleLeaks.map((leak, i) => (
            <PointLeakRow key={leak.questionType} rank={i + 1} leak={leak} onDrill={onSubscribe} />
          ))}
        </div>
      )}

      {/* Locked rows with upgrade card overlay */}
      {lockedLeaks.length > 0 && (
        <div className="relative">
          {lockedLeaks.map((leak, i) => (
            <div
              key={leak.questionType}
              className="border-t border-[var(--greyscale-100)]"
              style={{ filter: 'blur(3px)', userSelect: 'none' }}
              aria-hidden
            >
              <PointLeakRow rank={visibleLeaks.length + i + 1} leak={leak} onDrill={() => {}} />
            </div>
          ))}
          {/* Upgrade card */}
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--greyscale-0)]/85">
            <div className="mx-6 w-full max-w-sm rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 text-center shadow-sm">
              <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--greyscale-400)]">
                <span className="inline-block size-3 rounded-full bg-[#f59e0b]" />
                {lockedLeaks.length} more leak{lockedLeaks.length !== 1 ? 's' : ''} worth ~
                {lockedPoints} points
              </p>
              <h4 className="mt-3 text-lg font-bold text-[var(--color-student-heading)]">See every leak, ranked</h4>
              <p className="mt-2 text-sm leading-relaxed text-[var(--greyscale-500)]">
                Plus the drill set that targets each one, so you&apos;re closing the right gaps in
                the right order.
              </p>
              <button
                type="button"
                onClick={onSubscribe}
                className="mt-5 h-10 rounded-[10px] bg-[var(--primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-600)]"
              >
                Unlock my full report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section 6: Accuracy by Difficulty ───────────────────────────────────────

function AccuracyByDifficultySection({
  accuracyData,
  onSubscribe,
}: {
  accuracyData: DifficultyAccuracy[]
  onSubscribe: () => void
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">
      <div className="flex items-start justify-between border-b border-[var(--greyscale-100)] px-6 py-5">
        <div>
          <h3 className="text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]">Accuracy by difficulty</h3>
          <p className="mt-0.5 text-sm font-medium text-[var(--greyscale-500)]">
            Whether you&apos;re losing points to carelessness or to harder questions
          </p>
        </div>
        <SectionLockedBadge />
      </div>

      {/* Blurred rows + overlay */}
      <div className="relative">
        {accuracyData.slice(0, 3).map((row, i) => (
          <div
            key={row.difficulty}
            className={cn('flex items-center gap-4 px-6 py-4', i > 0 && 'border-t border-[var(--greyscale-100)]')}
            style={{ filter: `blur(${i === 0 ? 3 : 5}px)`, userSelect: 'none' }}
          >
            <div className="w-24 shrink-0">
              <p className="text-sm font-semibold text-[var(--color-student-heading)]">
                {DIFFICULTY_LABELS[row.difficulty] ?? `Level ${row.difficulty}`}
              </p>
              <p className="text-xs text-[var(--greyscale-400)]">{row.total} questions</p>
            </div>
            <div className="flex-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--greyscale-100)]">
                <div
                  className={cn('h-full rounded-full', row.accuracy >= 0.7 ? 'bg-[#00bc54]' : row.accuracy >= 0.4 ? 'bg-[#f59e0b]' : 'bg-[#df1c41]')}
                  style={{ width: `${row.accuracy * 100}%` }}
                />
              </div>
            </div>
            <span className="w-12 shrink-0 text-right text-sm font-bold text-[var(--color-student-heading)]">
              {Math.round(row.accuracy * 100)}%
            </span>
          </div>
        ))}

        {/* Placeholder rows if not enough data */}
        {accuracyData.length === 0 &&
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn('flex items-center gap-4 px-6 py-4', i > 1 && 'border-t border-[var(--greyscale-100)]')}
              style={{ filter: `blur(${i === 1 ? 3 : 5}px)`, userSelect: 'none' }}
            >
              <div className="h-4 w-24 rounded-full bg-[var(--greyscale-100)]" />
              <div className="h-2 flex-1 rounded-full bg-[var(--greyscale-100)]" />
              <div className="h-4 w-10 rounded-full bg-[var(--greyscale-100)]" />
            </div>
          ))}

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--greyscale-0)]/80">
          <div className="text-center">
            <h4 className="text-base font-bold text-[var(--color-student-heading)]">Where the easy points went</h4>
            <p className="mt-1 text-sm text-[var(--greyscale-500)]">
              See which difficulty bands are costing you the most
            </p>
            <button
              type="button"
              onClick={onSubscribe}
              className="mt-4 flex items-center gap-2 rounded-[10px] border border-[var(--primary)] bg-[var(--greyscale-0)] px-4 py-2 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-25)] mx-auto"
            >
              <Lock className="size-3.5" />
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section 7: Timing Breakdown ─────────────────────────────────────────────

function TimingBreakdownSection({
  outcomes,
  intentId,
  onSubscribe,
}: {
  outcomes: GuestDiagnosticResult['outcomes']
  intentId: GuestDiagnosticIntentId
  onSubscribe: () => void
}) {
  const rows = useMemo(() => {
    const groups: Record<
      number,
      { totalTime: number; totalTarget: number; count: number }
    > = {}
    for (const outcome of outcomes) {
      const meta = getDiagnosticQuestionMeta(outcome.questionId, intentId)
      if (!meta?.targetTimeSeconds || outcome.timeSpentSeconds == null) continue
      const diff = meta.difficulty ?? 3
      if (!groups[diff]) groups[diff] = { totalTime: 0, totalTarget: 0, count: 0 }
      groups[diff].totalTime += outcome.timeSpentSeconds
      groups[diff].totalTarget += meta.targetTimeSeconds
      groups[diff].count++
    }
    return Object.entries(groups)
      .filter(([, g]) => g.count > 0)
      .map(([diff, g]) => ({
        difficulty: Number(diff),
        avgTime: g.totalTime / g.count,
        avgTarget: g.totalTarget / g.count,
        overSeconds: g.totalTime / g.count - g.totalTarget / g.count,
      }))
      .sort((a, b) => a.difficulty - b.difficulty)
  }, [outcomes, intentId])

  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">
      <div className="flex items-start justify-between border-b border-[var(--greyscale-100)] px-6 py-5">
        <div>
          <h3 className="text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]">Timing breakdown</h3>
          <p className="mt-0.5 text-sm font-medium text-[var(--greyscale-500)]">
            Average seconds per question across the test, in budget vs. over
          </p>
        </div>
        <SectionLockedBadge />
      </div>

      <div className="relative">
        {(rows.length > 0 ? rows : [1, 2, 3].map((d) => ({ difficulty: d, avgTime: 90, avgTarget: 90, overSeconds: 0 }))).map((row, i) => (
          <div
            key={row.difficulty}
            className={cn('flex items-center gap-4 px-6 py-4', i > 0 && 'border-t border-[var(--greyscale-100)]')}
            style={{ filter: `blur(${i === 0 ? 3 : 5}px)`, userSelect: 'none' }}
          >
            <div className="w-24 shrink-0">
              <p className="text-sm font-semibold text-[var(--color-student-heading)]">
                {DIFFICULTY_LABELS[row.difficulty] ?? `Level ${row.difficulty}`}
              </p>
              <p className="text-xs text-[var(--greyscale-400)]">avg {formatSeconds(row.avgTime)}</p>
            </div>
            <div className="flex-1">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--greyscale-100)]">
                <div
                  className="absolute top-0 h-full rounded-full bg-[var(--primary)]"
                  style={{ width: `${Math.min(100, (row.avgTarget / 180) * 100)}%` }}
                />
                {row.overSeconds > 0 && (
                  <div
                    className="absolute top-0 h-full rounded-full bg-[#df1c41]"
                    style={{
                      left: `${Math.min(100, (row.avgTarget / 180) * 100)}%`,
                      width: `${Math.min(30, (row.overSeconds / 180) * 100)}%`,
                    }}
                  />
                )}
              </div>
            </div>
            <span
              className={cn(
                'w-16 shrink-0 text-right text-sm font-bold',
                row.overSeconds > 10 ? 'text-[#df1c41]' : 'text-[#00bc54]',
              )}
            >
              {row.overSeconds > 0 ? `+${formatSeconds(row.overSeconds)}` : 'On pace'}
            </span>
          </div>
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--greyscale-0)]/80">
          <div className="text-center">
            <h4 className="text-base font-bold text-[var(--color-student-heading)]">Where your clock broke</h4>
            <p className="mt-1 text-sm text-[var(--greyscale-500)]">
              Plus the drill set that targets each one
            </p>
            <button
              type="button"
              onClick={onSubscribe}
              className="mt-4 flex items-center gap-2 rounded-[10px] border border-[var(--primary)] bg-[var(--greyscale-0)] px-4 py-2 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-25)] mx-auto"
            >
              <Lock className="size-3.5" />
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section 8: Your Plan ─────────────────────────────────────────────────────

function YourPlanSection({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">
      <div className="flex items-start justify-between border-b border-[var(--greyscale-100)] px-6 py-5">
        <div>
          <h3 className="text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]">Your plan to test day</h3>
          <p className="mt-0.5 text-sm font-medium text-[var(--greyscale-500)]">
            14 weeks · 8–10 hrs/week · 4 sessions per week. Reviewed weekly.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 py-1">
          <Lock className="size-3 text-[var(--greyscale-500)]" />
          <span className="text-xs font-semibold text-[var(--greyscale-500)]">Week 1 of 14 shown</span>
        </div>
      </div>

      <div className="relative">
        {/* Placeholder week rows */}
        {[1, 2, 3].map((week) => (
          <div
            key={week}
            className={cn('flex gap-4 px-6 py-4', week > 1 && 'border-t border-[var(--greyscale-100)]')}
            style={{ filter: `blur(${week === 1 ? 3 : 5}px)`, userSelect: 'none' }}
          >
            <div className="w-16 shrink-0 pt-1">
              <p className="text-xs font-semibold text-[var(--greyscale-400)]">Week {week}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-4 w-72 rounded-full bg-[var(--greyscale-100)]" />
              <div className="mt-2 h-3 w-48 rounded-full bg-[var(--greyscale-25)]" />
            </div>
            <div className="shrink-0">
              <div className="h-4 w-16 rounded-full bg-[var(--greyscale-100)]" />
            </div>
          </div>
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--greyscale-0)]/85">
          <div className="text-center">
            <h4 className="text-base font-bold text-[var(--color-student-heading)]">Your week-by-week plan</h4>
            <p className="mt-1 text-sm text-[var(--greyscale-500)]">
              Built from your diagnostic, targeting your exact leaks in order
            </p>
            <button
              type="button"
              onClick={onSubscribe}
              className="mt-4 flex items-center gap-2 rounded-[10px] border border-[var(--primary)] bg-[var(--greyscale-0)] px-4 py-2 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-25)] mx-auto"
            >
              <Lock className="size-3.5" />
              Unlock my plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section 9: Upgrade CTA ───────────────────────────────────────────────────

const UPGRADE_FEATURES: [string, string][] = [
  ['All 7 point leaks, ranked by points recoverable', 'Written explanations for all questions'],
  ['Timing & pacing breakdown per section', 'Accuracy by difficulty — where the easy points went'],
  ['Your week-by-week plan to your test date', 'School fit + scholarship range at your scores'],
  ['6,000+ explanations & official LSAC question bank', 'Targeted drills auto-built from this diagnostic'],
]

function DiagnosticUpgradeCTA({
  result,
  onSubscribe,
}: {
  result: GuestDiagnosticResult
  onSubscribe: () => void
}) {
  const gapPoints = Math.max(0, LSAT_GOAL_SCORE - result.scaledScore)

  return (
    <div
      className="flex flex-col gap-4 rounded-[18px] p-6"
      style={{
        background: 'linear-gradient(171.015deg, rgb(18,48,95) 8.486%, rgb(26,63,143) 56.642%, rgb(33,84,173) 91.514%)',
      }}
    >
      {/* Eyebrow */}
      <p className="text-xs font-bold tracking-[0.24px] text-[#9dbaea]">
        Your baseline is done — this is the part that moves the score
      </p>

      {/* Heading */}
      <h2 className="text-2xl font-bold leading-[1.3] text-white">
        You&apos;re {gapPoints} point{gapPoints !== 1 ? 's' : ''} from {LSAT_GOAL_SCORE}. Here&apos;s
        everything we already know about how to get them.
      </h2>

      {/* Body */}
      <p className="text-base font-semibold leading-relaxed text-[#c9d9f5]">
        Your diagnostic produced a full teaching plan. You&apos;re seeing about a third of it.
        Unlocking opens the rest of the report and the platform it points to.
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
        {UPGRADE_FEATURES.flatMap(([left, right]) => [
          <UpgradeFeatureItem key={left} text={left} />,
          <UpgradeFeatureItem key={right} text={right} />,
        ])}
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 pt-2">
        <button
          type="button"
          onClick={onSubscribe}
          className="h-10 rounded-[10px] bg-white px-5 text-sm font-semibold text-[var(--primary)] transition-opacity hover:opacity-90"
        >
          See plans from $59/mo
        </button>
        <p className="text-sm font-semibold text-[#c9d9f5]">
          Cancel anytime · your report stays saved either way
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/[0.16] pt-4">
        <p className="text-xs leading-relaxed text-[#a9c0e8]">
          Plans include the betterLSAT platform. Official LSAC practice tests require{' '}
          LawHub Advantage{' '}
          <strong className="font-bold">($99/yr, paid to LSAC)</strong>{' '}
          — add it at checkout, or skip it if you already have PrepPlus.
        </p>
      </div>
    </div>
  )
}

function UpgradeFeatureItem({ text }: { text: string }) {
  return (
    <div className="relative flex items-start py-[5px] pl-[26px]">
      {/* Green checkmark — rotated L shape exactly as in Figma */}
      <div className="absolute left-[1px] top-[7px] flex size-[15px] items-center justify-center">
        <div className="-rotate-45">
          <div className="h-2 w-3 border-b-2 border-l-2 border-[#7fd9a6]" />
        </div>
      </div>
      <span className="text-sm leading-[1.5] tracking-[0.28px] text-[#eaf1ff]">{text}</span>
    </div>
  )
}

// ─── Section 10: Review your test — compact wrong-answer list ────────────────

function WrongQuestionsReviewSection({
  result,
  explanationsById,
  showPaidContent,
  reviewInTesterHref,
  onSubscribe,
}: {
  result: GuestDiagnosticResult
  explanationsById: Map<string, MiniDiagnosticExplanation>
  showPaidContent: boolean
  reviewInTesterHref: string
  onSubscribe: () => void
}) {
  const wrongOutcomes = result.outcomes
    .map((o, i) => ({ ...o, originalIndex: i }))
    .filter((o) => !o.isCorrect)

  const unlockedWrongCount = wrongOutcomes.filter((o) =>
    canShowDiagnosticResultDetails({
      intentId: result.intentId,
      questionNumber: o.originalIndex + 1,
      hasActiveCore: showPaidContent,
    }),
  ).length
  const totalLocked = result.outcomes.filter(
    (_, i) =>
      !canShowDiagnosticResultDetails({
        intentId: result.intentId,
        questionNumber: i + 1,
        hasActiveCore: showPaidContent,
      }),
  ).length
  const wrongLocked = wrongOutcomes.length - unlockedWrongCount

  if (wrongOutcomes.length === 0) return null

  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[var(--greyscale-100)] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]">
            Review your test with explanations on
          </h3>
          <p className="mt-0.5 text-sm font-medium text-[var(--greyscale-500)]">
            {showPaidContent
              ? `All ${result.questionCount} questions unlocked, plus written explanations across the full official LSAC question bank.`
              : `${unlockedWrongCount} of ${wrongOutcomes.length} missed questions unlocked, plus written explanations.`}
          </p>
        </div>
        <div
          className={cn(
            'flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-semibold',
            totalLocked === 0
              ? 'bg-[#e8fff1] text-[#00bc54]'
              : 'bg-[var(--primary-0)] text-[var(--primary)]',
          )}
        >
          {totalLocked === 0 ? (
            <Check className="size-3" strokeWidth={3} />
          ) : (
            <Lock className="size-3" />
          )}
          {showPaidContent
            ? `${result.questionCount} of ${result.questionCount} unlocked`
            : `${result.questionCount - totalLocked} of ${result.questionCount} unlocked`}
        </div>
      </div>

      {/* Reopen in tester panel */}
      <div className="flex items-start gap-4 border-b border-[var(--greyscale-100)] px-6 py-4 sm:items-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)]">
          <svg
            className="size-5 text-[var(--greyscale-500)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-student-heading)]">
            Reopen your test in the review interface
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--greyscale-500)]">
            Each question exactly as you took it, your answer and the correct one marked, and an
            Explanations toggle in the toolbar. Leave it off to reattempt cold first — that&apos;s
            blind review, and it&apos;s the highest yield hour in your week.
          </p>
        </div>
        <Link
          to={reviewInTesterHref}
          className="hidden h-9 shrink-0 items-center rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-600)] sm:flex"
        >
          Review my test
        </Link>
      </div>

      {/* "Jump straight to a question" label */}
      <div className="border-b border-[var(--greyscale-100)] px-6 py-3">
        <p className="text-sm font-semibold text-[var(--color-student-heading)]">Jump straight to a question</p>
      </div>

      {/* Compact wrong-answer rows */}
      {wrongOutcomes.map((outcome) => {
        const questionNumber = outcome.originalIndex + 1
        const unlocked = canShowDiagnosticResultDetails({
          intentId: result.intentId,
          questionNumber,
          hasActiveCore: showPaidContent,
        })
        const explanation =
          explanationsById.get(outcome.questionId) ??
          buildDiagnosticResultExplanation(outcome.questionId, result.intentId)
        const meta = getDiagnosticQuestionMeta(outcome.questionId, result.intentId)
        const qType = explanation?.questionType ?? meta?.questionType ?? null
        const pickedLabel = outcome.selectedAnswer?.toUpperCase() ?? '—'
        const correctLabel = explanation?.correctAnswer?.toUpperCase() ?? '?'
        const timeSpent = outcome.timeSpentSeconds
        const timeLabel =
          timeSpent != null
            ? `${Math.floor(timeSpent / 60)}:${String(Math.round(timeSpent % 60)).padStart(2, '0')} spent`
            : null
        const isCareless =
          timeSpent != null && timeSpent < 30 && !outcome.isCorrect
        const subline = [
          `You picked ${pickedLabel}`,
          `correct answer ${correctLabel}`,
          timeLabel,
          isCareless ? 'careless' : null,
        ]
          .filter(Boolean)
          .join(' · ')

        return (
          <CompactReviewRow
            key={outcome.questionId}
            questionNumber={questionNumber}
            qType={qType}
            subline={subline}
            isUnlocked={unlocked && explanation != null}
            intentId={result.intentId}
            explanation={unlocked ? explanation : null}
            outcome={outcome}
            onSubscribe={onSubscribe}
          />
        )
      })}

      {/* Footer banner: locked explanations */}
      {totalLocked > 0 && (
        <div className="flex items-start gap-3 border-t border-[var(--greyscale-100)] bg-[var(--primary-0)] px-6 py-4">
          <Lock className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
          <p className="text-sm text-[var(--greyscale-500)]">
            <span className="font-semibold text-[var(--color-student-heading)]">
              {totalLocked} explanations still locked
            </span>
            {wrongLocked > 0
              ? ` — including ${wrongLocked} of the questions you got wrong`
              : ''}
            . A plan opens all {result.questionCount}, plus 6,000+ explanations across the
            official question bank.{' '}
            <button
              type="button"
              onClick={onSubscribe}
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              See plans →
            </button>
          </p>
        </div>
      )}
    </div>
  )
}

/** Single row used inside WrongQuestionsReviewSection */
function CompactReviewRow({
  questionNumber,
  qType,
  subline,
  isUnlocked,
  intentId,
  explanation,
  outcome,
  onSubscribe,
}: {
  questionNumber: number
  qType: string | null
  subline: string
  isUnlocked: boolean
  intentId: GuestDiagnosticIntentId
  explanation: MiniDiagnosticExplanation | null
  outcome: GuestDiagnosticResult['outcomes'][number]
  onSubscribe: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = getDiagnosticQuestionMeta(outcome.questionId, intentId)

  return (
    <div className="border-t border-[var(--greyscale-100)] first:border-t-0">
      <div className="flex items-center gap-3 px-6 py-3.5">
        {/* Wrong indicator */}
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#fff0f3]">
          <X className="size-3 text-[#df1c41]" strokeWidth={3} />
        </div>

        {/* Question label */}
        <div className="w-10 shrink-0">
          <span className="text-sm font-semibold text-[var(--greyscale-500)]">Q{questionNumber}</span>
        </div>

        {/* Type + answer info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-student-heading)]">{qType ?? 'Question'}</p>
          <p className="mt-0.5 text-xs text-[var(--greyscale-400)]">{subline}</p>
        </div>

        {/* Action */}
        {isUnlocked ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            {expanded ? 'Hide ↑' : 'Open with explanation →'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubscribe}
            className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--greyscale-400)] hover:text-[var(--primary)]"
          >
            <Lock className="size-3" />
            Locked
          </button>
        )}
      </div>

      {/* Inline expansion */}
      {expanded && explanation && (
        <div className="border-t border-[var(--greyscale-100)]">
          <GuestDiagnosticExplanationCard
            number={questionNumber}
            heading={getDiagnosticIntentTitle(intentId)}
            explanation={explanation}
            isCorrect={false}
            selectedAnswer={outcome.selectedAnswer}
            targetTimeSeconds={meta?.targetTimeSeconds}
            yourTimeSeconds={outcome.timeSpentSeconds}
          />
        </div>
      )}
    </div>
  )
}

// ─── Section 11: Not ready to decide? ────────────────────────────────────────

function NotReadySection({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-base font-bold text-[var(--color-student-heading)]">Not ready to decide?</p>
        <p className="mt-0.5 text-sm font-medium text-[var(--greyscale-500)]">
          We&apos;ll email this report to you, and send your leak map when you&apos;re ready to
          start prepping.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onSubscribe}
          className="h-10 rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 text-sm font-semibold text-[var(--color-student-heading)] transition-colors hover:bg-[var(--greyscale-25)]"
        >
          Email me my report
        </button>
        <button
          type="button"
          onClick={onSubscribe}
          className="h-10 rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 text-sm font-semibold text-[var(--color-student-heading)] transition-colors hover:bg-[var(--greyscale-25)]"
        >
          Retake diagnostic
        </button>
      </div>
    </div>
  )
}

// ─── Section 12: Bottom report bar (free only) ───────────────────────────────

function BottomReportBar({
  result,
  onSubscribe,
}: {
  result: GuestDiagnosticResult
  onSubscribe: () => void
}) {
  const gapPoints = Math.max(0, LSAT_GOAL_SCORE - result.scaledScore)

  return (
    <div className="rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--primary-0)] px-6 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-[var(--greyscale-500)]">
          You&apos;re seeing about a third of your report.{' '}
          <span className="font-semibold text-[var(--color-student-heading)]">
            {gapPoints} point{gapPoints !== 1 ? 's' : ''} still to close
          </span>{' '}
          — unlock the full leak map, your week-by-week plan, and every explanation.
        </p>
        <button
          type="button"
          onClick={onSubscribe}
          className="h-10 shrink-0 rounded-[10px] bg-[var(--primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-600)]"
        >
          Unlock full report · from $59/mo
        </button>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

function GuestDiagnosticResultsView({
  result,
  reviewInTesterHref = '/diagnostic/review',
  refreshSubscription,
}: GuestDiagnosticResultsViewProps) {
  const { hasActiveCore, loading: subscriptionLoading, refresh } = useDiagnosticSubscription()
  const { openPricingModal } = useGuestPricingModal()
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
    for (const explanation of explanations) map.set(explanation.sourceItemId, explanation)
    return map
  }, [explanations])

  const sortedOutcomes = useMemo(
    () => sortOutcomes(result.outcomes, sortMode),
    [result.outcomes, sortMode],
  )

  const pointLeaks = useMemo(
    () => computePointLeaks(result.outcomes, result.intentId),
    [result.outcomes, result.intentId],
  )

  const accuracyByDifficulty = useMemo(
    () => computeAccuracyByDifficulty(result.outcomes, result.intentId),
    [result.outcomes, result.intentId],
  )

  const showPaidContent = hasActiveCore && !subscriptionLoading
  const heading = getDiagnosticIntentTitle(result.intentId)

  return (
    <StudentMain
      className={PT_RESULTS_PAGE_BG_CLASS}
      contentClassName="flex flex-col gap-6 pb-10"
    >
      {/* 1. Page header */}
      <DiagnosticPageHeader result={result} onSubscribe={openPricingModal} />

      {/* 2. Two score cards */}
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch">
        <EstimatedScoreCard result={result} />
        <GapToGoalCard result={result} onSubscribe={openPricingModal} />
      </div>

      {/* 3. Three stats row */}
      <DiagnosticStatsRow result={result} onSubscribe={openPricingModal} />

      {/* 4 + 5. Mini diagnostic section + Question list (single card, as in Figma) */}
      <section className="overflow-hidden rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">

        {/* ── Score header ── */}
        <div className="border-b border-[var(--greyscale-100)] px-6 py-5">
          <p className="text-center text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]">{heading}</p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4px] text-[var(--greyscale-500)]">
                Your Score
              </p>
              <p className="mt-1 text-3xl font-bold leading-none text-[var(--color-student-heading)]">
                {result.correctCount}/{result.questionCount}{' '}
                <span className="text-xl font-semibold text-[var(--greyscale-500)]">Correct</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.outcomes.map((outcome, index) => (
                <OutcomePill key={outcome.questionId} index={index} isCorrect={outcome.isCorrect} />
              ))}
            </div>
            <Link
              to={reviewInTesterHref}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#df1c41] px-4 text-sm font-semibold text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#df1c41]/90"
            >
              Review in Tester
            </Link>
          </div>
        </div>

        {/* ── Sort bar ── */}
        <div className="flex flex-col gap-3 border-b border-[var(--greyscale-100)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">
            Total Questions: {result.questionCount}
          </p>
          <label className="flex items-center gap-2 text-sm text-[var(--greyscale-500)]">
            <span className="shrink-0">Sort by</span>
            <select
              className="h-10 min-w-[10rem] rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 text-sm font-medium text-[var(--color-student-heading)]"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as QuestionSortMode)}
              aria-label="Sort questions by"
            >
              <option value="number">Question number</option>
              <option value="correct">Correct first</option>
              <option value="incorrect">Incorrect first</option>
            </select>
          </label>
        </div>

        {/* ── Loading / error states ── */}
        {showPaidContent && explanationsLoading ? (
          <p className="px-6 py-8 text-sm text-[var(--greyscale-500)]">Loading explanations…</p>
        ) : null}
        {showPaidContent && explanationsError ? (
          <p className="px-6 py-8 text-sm text-[#df1c41]">{explanationsError}</p>
        ) : null}

        {/* ── Question rows (free: only first N unlocked; no locked teaser rows) ── */}
        {sortedOutcomes.map((outcome) => {
          const questionNumber = outcome.originalIndex + 1
          const unlocked = canShowDiagnosticResultDetails({
            intentId: result.intentId,
            questionNumber,
            hasActiveCore: showPaidContent,
          })
          if (!unlocked) return null

          const explanation =
            explanationsById.get(outcome.questionId) ??
            buildDiagnosticResultExplanation(outcome.questionId, result.intentId)
          if (!explanation) return null

          const meta = getDiagnosticQuestionMeta(outcome.questionId, result.intentId)
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

      {/* Free analytics limit gate — after first 5 questions, no locked Q rows */}
      {!showPaidContent &&
      result.questionCount > freeDiagnosticExplanationLimit(result.intentId) ? (
        <FreeAnalyticsLimitGate onSubscribe={openPricingModal} />
      ) : null}

      {/* 6. Point Leak Map */}
      {pointLeaks.length > 0 ? (
        <PointLeakMapSection leaks={pointLeaks} onSubscribe={openPricingModal} />
      ) : null}

      {/* 7. Big Upgrade CTA — shown before locked sections, free only */}
      {!showPaidContent && (
        <DiagnosticUpgradeCTA result={result} onSubscribe={openPricingModal} />
      )}

      {/* 8. Accuracy by Difficulty (locked for free) */}
      {!showPaidContent && (
        <AccuracyByDifficultySection
          accuracyData={accuracyByDifficulty}
          onSubscribe={openPricingModal}
        />
      )}

      {/* 9. Timing Breakdown (locked for free) */}
      {!showPaidContent && (
        <TimingBreakdownSection
          outcomes={result.outcomes}
          intentId={result.intentId}
          onSubscribe={openPricingModal}
        />
      )}

      {/* 10. Your Plan (locked for free) */}
      {!showPaidContent && <YourPlanSection onSubscribe={openPricingModal} />}

      {/* 11. Review your test — compact wrong-answer jump list */}
      <WrongQuestionsReviewSection
        result={result}
        explanationsById={explanationsById}
        showPaidContent={showPaidContent}
        reviewInTesterHref={reviewInTesterHref}
        onSubscribe={openPricingModal}
      />

      {/* 12. Not ready to decide? */}
      <NotReadySection onSubscribe={openPricingModal} />

      {/* 13. Bottom sticky bar (free only) */}
      {!showPaidContent && (
        <BottomReportBar result={result} onSubscribe={openPricingModal} />
      )}
    </StudentMain>
  )
}

export { GuestDiagnosticResultsView }
