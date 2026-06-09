import { describe, expect, it } from "vitest"

import {
  computeElapsedTimerProgress,
  computeRemainingTimerProgress,
  PRACTICE_PER_QUESTION_SECONDS,
  PRACTICE_SESSION_35_MIN_SECONDS,
  resolveTimerBudgetSeconds,
} from "@/features/student/practice-session/use-practice-session-timer"

describe("practice session timer progress", () => {
  it("resolves drill timing budgets", () => {
    expect(resolveTimerBudgetSeconds({ timing: "35" })).toBe(PRACTICE_SESSION_35_MIN_SECONDS)
    expect(resolveTimerBudgetSeconds({ timing: "per-q", questionCount: 5 })).toBe(5 * PRACTICE_PER_QUESTION_SECONDS)
    expect(resolveTimerBudgetSeconds({ timing: "unlimited" })).toBe(PRACTICE_SESSION_35_MIN_SECONDS)
  })

  it("computes elapsed progress from time", () => {
    expect(computeElapsedTimerProgress(0, 100)).toBe(0)
    expect(computeElapsedTimerProgress(50, 100)).toBe(0.5)
    expect(computeElapsedTimerProgress(150, 100)).toBe(1)
  })

  it("computes remaining progress from countdown", () => {
    expect(computeRemainingTimerProgress(2100, PRACTICE_SESSION_35_MIN_SECONDS)).toBe(1)
    expect(computeRemainingTimerProgress(1050, PRACTICE_SESSION_35_MIN_SECONDS)).toBe(0.5)
    expect(computeRemainingTimerProgress(0, PRACTICE_SESSION_35_MIN_SECONDS)).toBe(0)
  })
})
