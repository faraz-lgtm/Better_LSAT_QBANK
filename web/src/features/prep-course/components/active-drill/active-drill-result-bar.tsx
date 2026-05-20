import { Button } from "@/components/ui/button"
import type { PrepLessonActiveDrillAttempt } from "@/lib/api/prep-course"

type ActiveDrillResultBarProps = {
  attempt: PrepLessonActiveDrillAttempt
  onReview?: () => void
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function ActiveDrillResultBar({ attempt, onReview }: ActiveDrillResultBarProps) {
  const pct =
    attempt.questionCount > 0 ? Math.round((attempt.rawScore / attempt.questionCount) * 100) : 0

  return (
    <div className="rounded-xl bg-[#0d47a1] px-4 py-4 text-white md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Drill Result</p>
          <p className="mt-1 text-2xl font-bold">
            {attempt.rawScore}/{attempt.questionCount}{" "}
            <span className="text-base font-semibold text-white/90">({pct}%)</span>
          </p>
          <p className="mt-1 text-sm text-white/80">Time: {formatElapsed(attempt.elapsedSeconds)}</p>
        </div>
        {onReview ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onReview}
            className="h-10 rounded-2xl border-0 bg-white px-5 text-sm font-semibold text-[#0d47a1] hover:bg-white/90"
          >
            Review
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export { ActiveDrillResultBar }
