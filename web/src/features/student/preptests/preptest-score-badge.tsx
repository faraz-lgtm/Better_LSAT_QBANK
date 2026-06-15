import type { PrepTestPoolAttempt } from "@/features/student/preptests/preptest-types"

import { attemptScoreLabel } from "@/features/student/preptests/preptest-pool-display"

export function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="inline-flex min-w-[72px] shrink-0 flex-col items-center justify-center rounded-xl border border-[#287f6e] bg-[#e8f5f1] px-4 py-1">
      <span className="text-xs font-semibold leading-tight text-[#287f6e]">Score</span>
      <span className="text-2xl font-bold leading-tight tabular-nums text-[#287f6e]">{score}</span>
    </div>
  )
}

export function AttemptScoreBox({ attempt }: { attempt: PrepTestPoolAttempt }) {
  return (
    <span className="inline-flex min-w-[64px] items-center justify-center rounded-lg border border-[#287f6e] bg-[#e8f5f1] px-3 py-1.5 text-sm font-bold tabular-nums text-[#287f6e]">
      {attemptScoreLabel(attempt)}
    </span>
  )
}
