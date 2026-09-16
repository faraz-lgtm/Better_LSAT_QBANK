import type { PrepTestPoolAttempt } from "@/features/student/preptests/preptest-types"

import { getAttemptDisplayScores } from "@/features/student/preptests/preptest-pool-display"

function scoreOrDash(value: number | null): string {
  return value == null ? "---" : String(value)
}

/** Figma `20933:22745` — compact “Score: N - Blind Review: N|---” line. */
export function PrepTestScoreText({
  test,
  br,
  variant,
}: {
  test: number | null
  br: number | null
  variant: "header" | "history"
}) {
  const scoreText = scoreOrDash(test)
  const brText = scoreOrDash(br)

  if (variant === "history") {
    return (
      <p className="whitespace-nowrap text-center text-[16px] font-semibold leading-[1.35]">
        <span className="text-[#082c6b]">Score: {scoreText}</span>
        <span className="text-[#082c6b]">{"\u00a0"}</span>
        <span className="text-[var(--greyscale-400)]">- Blind Review: {brText}</span>
      </p>
    )
  }

  return (
    <p className="whitespace-nowrap text-center text-[16px] leading-[1.5] tracking-[0.32px]">
      <span className="font-medium text-[#082c6b]">Score:</span>
      <span className="font-semibold text-[#082c6b]">{` ${scoreText} `}</span>
      <span className="text-[var(--greyscale-400)]">- </span>
      <span className="font-medium text-[var(--greyscale-400)]">Blind Review:</span>
      <span className="text-[var(--greyscale-400)]">{` ${brText}`}</span>
    </p>
  )
}

/** Figma dark PrepTest list — score chrome uses primary blue (not green). */
export function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="inline-flex h-[90px] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] border border-[var(--primary)] bg-[var(--primary-0)] px-6">
      <span className="text-sm font-semibold leading-normal tracking-[0.28px] text-[var(--primary)]">Score</span>
      <span className="text-[36px] font-bold leading-10 tabular-nums text-[var(--primary)]">{score}</span>
    </div>
  )
}

const attemptScoreBoxClass =
  "inline-flex h-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6"

export function AttemptScoreBox({ attempt }: { attempt: PrepTestPoolAttempt }) {
  const { test, br } = getAttemptDisplayScores(attempt)

  if (test == null && br == null) {
    return <span className={`${attemptScoreBoxClass} text-2xl font-bold text-[var(--color-student-heading)]`}>—</span>
  }

  if (test != null && br != null) {
    return (
      <span className={attemptScoreBoxClass}>
        <span className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">{test}</span>
        <span className="text-2xl font-bold leading-[1.3] text-[var(--greyscale-400)]">{` · ${br} BR`}</span>
      </span>
    )
  }

  if (test != null) {
    return (
      <span className={`${attemptScoreBoxClass} text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]`}>
        {test}
      </span>
    )
  }

  return (
    <span className={`${attemptScoreBoxClass} text-2xl font-bold leading-[1.3] text-[var(--greyscale-400)]`}>
      {br} BR
    </span>
  )
}
