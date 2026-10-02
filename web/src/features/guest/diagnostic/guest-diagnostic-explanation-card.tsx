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
  className?: string
}

const STATS_LABEL_CLASS =
  'm-0 text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)]'

const TIMING_LABEL_CLASS =
  'w-20 shrink-0 text-xs font-normal leading-normal tracking-[0.02em] text-[var(--greyscale-500)]'

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

/** Results-list row only — full stem/choices/explanations live on Review in Tester. */
function GuestDiagnosticExplanationCard({
  number,
  heading = 'Mini Diagnostic',
  explanation,
  isCorrect,
  isUnanswered = false,
  selectedAnswer,
  targetTimeSeconds,
  yourTimeSeconds,
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
        'overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6',
        className,
      )}
      aria-label={`${heading} question ${number}`}
      data-testid="diagnostic-explanation-card"
    >
      <div className="flex min-w-0 flex-col gap-6 xl:flex-row xl:items-start xl:gap-6">
        <div className="flex shrink-0 items-start gap-4 xl:gap-6">
          <div className="flex w-8 shrink-0 flex-col items-center gap-2">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-[8px]',
                diagnosticResultBadgeClass(isUnanswered, isCorrect),
              )}
            >
              <span className="text-base font-semibold leading-normal tracking-[0.02em] text-white">
                {number}
              </span>
            </div>
            <DiagnosticOutcomeIcon
              kind={diagnosticOutcomeKind({ isCorrect, isUnanswered })}
              variant="card"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-2 xl:w-[146px] xl:shrink-0">
            <h3 className="m-0 text-base font-semibold leading-normal tracking-[0.02em] text-[var(--primary-800,#041a44)]">
              {title}
            </h3>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex h-5 items-center rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-2 py-0.5 text-[10px] font-normal leading-normal tracking-[0.02em] text-[var(--color-student-heading)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-6 sm:flex-row sm:items-start sm:justify-end sm:gap-9">
          <div className="flex min-w-0 flex-col gap-3 sm:min-w-[11rem]">
            <p className={STATS_LABEL_CLASS}>Timing</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-nowrap items-center gap-1">
                <span className={TIMING_LABEL_CLASS}>Target time:</span>
                <span className="text-xs font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
                  {targetTime}
                </span>
              </div>
              <div className="flex flex-nowrap items-center gap-1">
                <span className={TIMING_LABEL_CLASS}>Your time:</span>
                <span className="whitespace-nowrap text-sm font-semibold leading-normal tracking-[0.02em] text-[#0d47a1]">
                  {yourTime}
                </span>
                {yourTimeNote ? (
                  <span className="whitespace-nowrap text-xs font-semibold leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
                    {yourTimeNote}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <p className={STATS_LABEL_CLASS}>Difficulty</p>
            <PracticeDifficultyMeter difficulty={difficulty} />
          </div>

          <div className="min-w-0 sm:w-[314px] sm:shrink-0">
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
      </div>
    </article>
  )
}

export { GuestDiagnosticExplanationCard }
