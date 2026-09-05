import type { MiniDiagnosticExplanation } from '@/lib/api/diagnostic'
import {
  PracticeQuestionResultStatsRow,
  difficultyLabelFromLevel,
  formatMmSs,
} from '@/features/student/practice-session/practice-results-ui'
import { cn } from '@/lib/utils'

type GuestDiagnosticExplanationCardProps = {
  number: number
  heading?: string
  explanation: MiniDiagnosticExplanation
  isCorrect: boolean
  selectedAnswer?: string | null
  targetTimeSeconds?: number | null
  yourTimeSeconds?: number | null
}

/** Results-list row only — full stem/choices/explanations live on Review in Tester. */
function GuestDiagnosticExplanationCard({
  number,
  heading = "Mini Diagnostic",
  explanation,
  isCorrect,
  selectedAnswer,
  targetTimeSeconds,
  yourTimeSeconds,
}: GuestDiagnosticExplanationCardProps) {
  const normalizedSelected = selectedAnswer?.trim().toUpperCase() ?? null
  const correctLetter = explanation.correctAnswer?.trim().toUpperCase() ?? 'A'
  const difficulty = difficultyLabelFromLevel(explanation.difficulty ?? 3)
  const targetSec = targetTimeSeconds ?? (difficulty === 'Hardest' || difficulty === 'Hard' ? 105 : difficulty === 'Medium' ? 90 : 75)
  const targetTime = formatMmSs(targetSec)
  const yourTime =
    yourTimeSeconds != null && yourTimeSeconds >= 0 ? formatMmSs(yourTimeSeconds) : '—'
  const deltaSec = targetSec - (yourTimeSeconds ?? 0)
  const yourTimeNote =
    yourTimeSeconds != null && deltaSec > 0
      ? `(${formatMmSs(deltaSec)} under)`
      : yourTimeSeconds != null && deltaSec < 0
        ? `(${formatMmSs(-deltaSec)} over)`
        : ''
  const popularityRows: { letter: string; count: number; pct: number }[] = []

  return (
    <article className="border-t border-[#dfe1e7] bg-white p-6">
      <div className="flex items-start gap-6">
        <div
          className={cn(
            'flex size-14 shrink-0 items-center justify-center rounded-[14px] text-2xl font-bold text-white',
            isCorrect ? 'bg-[#00bc54]' : 'bg-[#df1c41]',
          )}
        >
          {number}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-lg font-semibold text-[#062357]">
              {heading} · Q{number}
              {explanation.questionType ? ` · ${explanation.questionType}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">LR</span>
              {explanation.questionType ? (
                <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">
                  {explanation.questionType}
                </span>
              ) : null}
              {explanation.difficulty ? (
                <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">
                  Level {explanation.difficulty}
                </span>
              ) : null}
            </div>
          </div>

          <PracticeQuestionResultStatsRow
            targetTime={targetTime}
            yourTime={yourTime}
            yourTimeNote={yourTimeNote}
            difficulty={difficulty}
            popularityRows={popularityRows}
            correctLetter={correctLetter}
            selectedLetter={normalizedSelected}
            isUnanswered={!normalizedSelected}
          />
        </div>
      </div>
    </article>
  )
}

export { GuestDiagnosticExplanationCard }
