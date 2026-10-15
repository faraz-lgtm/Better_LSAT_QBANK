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
      <p className="text-left text-[14px] font-semibold leading-[1.35] max-md:flex max-md:min-w-0 max-md:flex-col max-md:gap-0.5 md:whitespace-nowrap md:text-center md:text-[16px]">
        <span className="text-[var(--color-student-heading)]">Score: {scoreText}</span>
        <span className="hidden text-[var(--color-student-heading)] md:inline">{"\u00a0"}</span>
        <span className="text-[var(--greyscale-400)]">
          <span className="hidden md:inline">- </span>
          Untimed Review: {brText}
        </span>
      </p>
    )
  }

  return (
    <p className="text-left text-[14px] leading-[1.45] tracking-[0.28px] max-md:flex max-md:min-w-0 max-md:flex-col max-md:gap-0.5 md:whitespace-nowrap md:text-center md:text-[16px] md:leading-[1.5] md:tracking-[0.32px]">
      <span className="min-w-0">
        <span className="font-medium text-[var(--color-student-heading)]">Score:</span>
        <span className="font-semibold text-[var(--color-student-heading)]">{` ${scoreText}`}</span>
      </span>
      <span className="hidden text-[var(--greyscale-400)] md:inline">{` - `}</span>
      <span className="min-w-0 text-[var(--greyscale-400)]">
        <span className="font-medium">Untimed Review:</span>
        <span>{` ${brText}`}</span>
      </span>
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
        <span className="text-2xl font-bold leading-[1.3] text-[var(--greyscale-400)]">{` · ${br} Untimed`}</span>
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
      {br} Untimed
    </span>
  )
}
