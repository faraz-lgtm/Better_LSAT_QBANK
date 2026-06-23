import { describe, expect, it } from "vitest"

import {
  computeElapsedTimerProgress,
  computeRemainingTimerProgress,
  isDrillCountdownTiming,
  isSectionCountdownTiming,
  isUnlimitedPracticeTiming,
  PRACTICE_PER_QUESTION_SECONDS,
  PRACTICE_SESSION_35_MIN_SECONDS,
  resolveTimerBudgetSeconds,
} from "@/features/student/practice-session/use-practice-session-timer"

describe("practice session timer progress", () => {
  it("resolves drill timing budgets", () => {
    expect(resolveTimerBudgetSeconds({ timing: "35" })).toBe(PRACTICE_SESSION_35_MIN_SECONDS)
    expect(resolveTimerBudgetSeconds({ timing: "standard" })).toBe(PRACTICE_SESSION_35_MIN_SECONDS)
    expect(resolveTimerBudgetSeconds({ timing: "per-q", questionCount: 5 })).toBe(5 * PRACTICE_PER_QUESTION_SECONDS)
    expect(resolveTimerBudgetSeconds({ timing: "unlimited" })).toBe(0)
    expect(resolveTimerBudgetSeconds({})).toBe(0)
  })

  it("classifies timing modes", () => {
    expect(isUnlimitedPracticeTiming("unlimited")).toBe(true)
    expect(isUnlimitedPracticeTiming(undefined)).toBe(true)
    expect(isUnlimitedPracticeTiming("35")).toBe(false)
    expect(isSectionCountdownTiming("standard")).toBe(true)
    expect(isDrillCountdownTiming("per-q")).toBe(true)
    expect(isDrillCountdownTiming("unlimited")).toBe(false)
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
