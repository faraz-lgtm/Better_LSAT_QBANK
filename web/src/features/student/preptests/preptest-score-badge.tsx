import type { PrepTestPoolAttempt } from "@/features/student/preptests/preptest-types"

import { getAttemptDisplayScores } from "@/features/student/preptests/preptest-pool-display"

export function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="inline-flex h-[90px] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] border border-[#287f6e] bg-[#effefa] px-6">
      <span className="text-sm font-semibold leading-normal tracking-[0.28px] text-[#287f6e]">Score</span>
      <span className="text-[36px] font-bold leading-10 tabular-nums text-[#287f6e]">{score}</span>
    </div>
  )
}

const attemptScoreBoxClass =
  "inline-flex h-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[#dfe1e7] bg-white px-6"

export function AttemptScoreBox({ attempt }: { attempt: PrepTestPoolAttempt }) {
  const { test, br } = getAttemptDisplayScores(attempt)

  if (test == null && br == null) {
    return <span className={`${attemptScoreBoxClass} text-2xl font-bold text-[#062357]`}>—</span>
  }

  if (test != null && br != null) {
    return (
      <span className={attemptScoreBoxClass}>
        <span className="text-2xl font-bold leading-[1.3] text-[#062357]">{test}</span>
        <span className="text-2xl font-bold leading-[1.3] text-[#818898]">{` · ${br} BR`}</span>
      </span>
    )
  }

  if (test != null) {
    return <span className={`${attemptScoreBoxClass} text-2xl font-bold leading-[1.3] text-[#062357]`}>{test}</span>
  }

  return (
    <span className={`${attemptScoreBoxClass} text-2xl font-bold leading-[1.3] text-[#818898]`}>
      {br} BR
    </span>
  )
}
