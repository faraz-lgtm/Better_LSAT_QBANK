import type { PrepTestPoolAttempt } from "@/features/student/preptests/preptest-types"

import { getAttemptDisplayScores } from "@/features/student/preptests/preptest-pool-display"

export function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="inline-flex min-w-[72px] shrink-0 flex-col items-center justify-center rounded-xl border border-[#287f6e] bg-[#e8f5f1] px-4 py-1">
      <span className="text-xs font-semibold leading-tight text-[#287f6e]">Score</span>
      <span className="text-2xl font-bold leading-tight tabular-nums text-[#287f6e]">{score}</span>
    </div>
  )
}

const attemptScoreBoxClass =
  "inline-flex min-h-[36px] min-w-[64px] shrink-0 items-center justify-center rounded-lg border border-[#dfe1e7] bg-white px-3 py-1.5 text-sm tabular-nums shadow-[0px_1px_1px_rgba(13,13,18,0.04)]"

export function AttemptScoreBox({ attempt }: { attempt: PrepTestPoolAttempt }) {
  const { test, br } = getAttemptDisplayScores(attempt)

  if (test == null && br == null) {
    return <span className={attemptScoreBoxClass}>—</span>
  }

  if (test != null && br != null) {
    return (
      <span className={attemptScoreBoxClass}>
        <span className="font-bold text-[#062357]">{test}</span>
        <span className="mx-1.5 font-medium text-[#a4acb9]">·</span>
        <span className="font-semibold text-[#666d80]">
          {br} BR
        </span>
      </span>
    )
  }

  if (test != null) {
    return <span className={`${attemptScoreBoxClass} font-bold text-[#062357]`}>{test}</span>
  }

  return (
    <span className={`${attemptScoreBoxClass} font-semibold text-[#666d80]`}>
      {br} BR
    </span>
  )
}
