import { Link } from 'react-router-dom'

import type { MiniDiagnosticExplanation } from '@/lib/api/diagnostic'
import { buildDiagnosticAnswerPopularity } from '@/features/guest/diagnostic/diagnostic-answer-popularity'
import {
  DiagnosticOutcomeIcon,
  diagnosticOutcomeKind,
} from '@/features/guest/diagnostic/diagnostic-outcome-icon'
import {
  PracticeAnswerPopularityBars,
  PracticeDifficultyMeter,
  difficultyLabelFromLevel,
  formatPaddedTargetTime,
  targetTimeSecondsForDifficulty,
} from '@/features/student/practice-session/practice-results-ui'
import { cn } from '@/lib/utils'

type GuestDiagnosticExplanationCardProps = {
  number: number
  heading?: string
  explanation: MiniDiagnosticExplanation
  isCorrect: boolean
  isUnanswered?: boolean
  selectedAnswer?: string | null
  targetTimeSeconds?: number | null
  yourTimeSeconds?: number | null
  /** Opens Diagnostic Explanation detail for this question. */
  diagnosticExplanationHref?: string
  /** Opens Review Tester at this question. */
  reviewTesterHref?: string
  className?: string
}

/** Figma 21396:22478 — 120×32 primary */
const EXPLANATION_BUTTON_CLASS =
  'inline-flex h-8 w-[120px] shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] bg-[var(--primary-500,#0d47a1)] px-4 py-2 text-xs font-semibold leading-normal tracking-[0.02em] text-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600,#0a3a82)] disabled:pointer-events-none disabled:opacity-60'

/** Figma 21396:22479 — 120×32 outline */
const REVIEW_TESTER_BUTTON_CLASS =
  'inline-flex h-8 w-[120px] shrink-0 items-center justify-center whitespace-nowrap rounded-[12px] border border-[var(--greyscale-100,#dfe1e7)] bg-[var(--greyscale-0,white)] px-4 py-2 text-xs font-semibold leading-normal tracking-[0.02em] text-[var(--primary-500,#0d47a1)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:border-[var(--primary-500,#0d47a1)] hover:bg-[var(--primary-500,#0d47a1)] hover:text-white disabled:pointer-events-none disabled:opacity-60'

const STATS_LABEL_CLASS =
  'm-0 text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)] max-md:text-[11px]'

const TIMING_LABEL_CLASS =
  'w-20 shrink-0 text-xs font-normal leading-normal tracking-[0.02em] text-[var(--greyscale-500)] max-md:w-auto max-md:text-[10px]'

function diagnosticResultBadgeClass(isUnanswered: boolean, isCorrect: boolean) {
  if (isUnanswered) return 'bg-[#ff6683]'
  if (isCorrect) return 'bg-[#40c4aa]'
  return 'bg-[#df1c41]'
}

function formatPaddedYourTimeAgainstTarget(
  targetSec: number,
  yourTimeSeconds: number | null | undefined,
): { yourTime: string; yourTimeNote: string } {
  if (yourTimeSeconds == null || yourTimeSeconds < 0) {
    return { yourTime: '—', yourTimeNote: '' }
  }
  const yourTime = formatPaddedTargetTime(yourTimeSeconds)
  const deltaSec = targetSec - yourTimeSeconds
  if (deltaSec > 0) return { yourTime, yourTimeNote: `(${formatPaddedTargetTime(deltaSec)} under)` }
  if (deltaSec < 0) return { yourTime, yourTimeNote: `(${formatPaddedTargetTime(-deltaSec)} over)` }
  return { yourTime, yourTimeNote: '' }
}

function buildDiagnosticResultTags(explanation: MiniDiagnosticExplanation): string[] {
  const tags: string[] = ['LR']
  if (explanation.questionType?.trim()) tags.push(explanation.questionType.trim())
  return tags
}

/**
 * Figma 21396:22406 — desktop: single horizontal row.
 * Mobile: stacked compact layout (no 920px min-width scroll / overlap).
 */
function GuestDiagnosticExplanationCard({
  number,
  heading = 'Mini',
  explanation,
  isCorrect,
  isUnanswered = false,
  selectedAnswer,
  targetTimeSeconds,
  yourTimeSeconds,
  diagnosticExplanationHref,
  reviewTesterHref,
  className,
}: GuestDiagnosticExplanationCardProps) {
  const normalizedSelected = selectedAnswer?.trim().toUpperCase() ?? null
  const correctLetter = explanation.correctAnswer?.trim().toUpperCase() ?? 'A'
  const difficulty = difficultyLabelFromLevel(explanation.difficulty ?? 3)
  const targetSec = targetTimeSeconds ?? targetTimeSecondsForDifficulty(difficulty)
  const targetTime = formatPaddedTargetTime(targetSec)
  const { yourTime, yourTimeNote } = formatPaddedYourTimeAgainstTarget(targetSec, yourTimeSeconds)
  const popularityRows = buildDiagnosticAnswerPopularity(
    explanation.sourceItemId,
    correctLetter,
    explanation.choices.map((choice) => choice.letter),
  )
  const tags = buildDiagnosticResultTags(explanation)
  const title = `Q${number}`

  return (
    <article
      className={cn(
        'rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 max-md:p-4',
        className,
      )}
      aria-label={`${heading} question ${number}`}
      data-testid="diagnostic-explanation-card"
    >
      <div className="flex w-full min-w-0 items-start gap-4 max-md:flex-col max-md:gap-3 md:overflow-x-auto">
        <div className="flex min-w-0 items-start gap-3 max-md:w-full md:contents">
          {/* Icon stack — Figma 21396:22408 */}
          <div className="flex w-8 shrink-0 flex-col items-start gap-2">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-[8px]',
                diagnosticResultBadgeClass(isUnanswered, isCorrect),
              )}
            >
              <span className="w-6 text-center text-base font-semibold leading-normal tracking-[0.02em] text-white">
                {number}
              </span>
            </div>
            <DiagnosticOutcomeIcon
              kind={diagnosticOutcomeKind({ isCorrect, isUnanswered })}
              variant="card"
              className="mx-0"
            />
          </div>

          {/* Title + tags */}
          <div className="flex min-w-0 flex-col gap-2 max-md:flex-1 md:w-[128px] md:shrink-0">
            <h3 className="m-0 whitespace-nowrap text-base font-semibold leading-normal tracking-[0.02em] text-[var(--primary-800,#041a44)]">
              {title}
            </h3>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-md:gap-1.5 md:gap-2.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex h-5 max-w-full items-center truncate rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-2 py-0.5 text-[10px] font-normal leading-normal tracking-[0.02em] text-[var(--greyscale-900,#0d0d12)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Stats + actions — stack on mobile; horizontal Figma row on desktop */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 max-md:w-full md:min-w-[760px] md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="grid min-w-0 grid-cols-2 gap-3 max-md:w-full md:flex md:shrink-0 md:items-start md:justify-center md:gap-9">
            <div className="flex min-w-0 flex-col gap-2 max-md:gap-1.5 md:shrink-0 md:gap-3">
              <p className={STATS_LABEL_CLASS}>Timing</p>
              <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
                <span className={TIMING_LABEL_CLASS}>
                  <span className="max-md:hidden">Target time:</span>
                  <span className="hidden max-md:inline">Target:</span>
                </span>
                <span className="text-xs font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)] max-md:text-[11px]">
                  {targetTime}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
                <span className={TIMING_LABEL_CLASS}>
                  <span className="max-md:hidden">Your time:</span>
                  <span className="hidden max-md:inline">Yours:</span>
                </span>
                <span className="whitespace-nowrap text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--primary-500,#0d47a1)] max-md:text-[11px]">
                  {yourTime}
                </span>
                {yourTimeNote ? (
                  <span className="whitespace-nowrap text-xs font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)] max-md:text-[10px]">
                    {yourTimeNote}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 max-md:gap-1.5 md:shrink-0 md:gap-6">
              <p className={STATS_LABEL_CLASS}>Difficulty</p>
              <PracticeDifficultyMeter difficulty={difficulty} />
            </div>

            <div className="col-span-2 min-w-0 w-full md:col-auto md:w-[186px] md:shrink-0">
              <PracticeAnswerPopularityBars
                rows={popularityRows}
                correctLetter={correctLetter}
                selectedLetter={normalizedSelected}
                isUnanswered={isUnanswered || !normalizedSelected}
                showLabel
                showPercentages={false}
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-row flex-wrap gap-2 max-md:w-full md:flex-col md:justify-center md:gap-4 md:self-center">
            {diagnosticExplanationHref ? (
              <Link to={diagnosticExplanationHref} className={EXPLANATION_BUTTON_CLASS}>
                Explanation
              </Link>
            ) : (
              <button type="button" className={EXPLANATION_BUTTON_CLASS} disabled>
                Explanation
              </button>
            )}
            {reviewTesterHref ? (
              <Link to={reviewTesterHref} className={REVIEW_TESTER_BUTTON_CLASS}>
                Review Tester
              </Link>
            ) : (
              <button type="button" className={REVIEW_TESTER_BUTTON_CLASS} disabled>
                Review Tester
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export { GuestDiagnosticExplanationCard }
