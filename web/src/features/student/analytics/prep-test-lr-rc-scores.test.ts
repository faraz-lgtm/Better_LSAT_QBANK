import { describe, expect, it } from "vitest"

import type { PracticeSessionSummary } from "@/lib/api/analytics"
import {
  LAWHUB_SCORED_SECTION_QUESTION_MAX,
  resolvePrepTestLrRcScores,
} from "@/features/student/analytics/prep-test-lr-rc-scores"

function session(
  partial: Partial<PracticeSessionSummary> &
    Pick<PracticeSessionSummary, "id" | "kind">,
): PracticeSessionSummary {
  return {
    startedAt: "2026-01-01T00:00:00Z",
    completedAt: "2026-01-01T01:00:00Z",
    rawScore: null,
    scaledScore: null,
    percentile: null,
    bookmarked: false,
    excluded: false,
    metadata: {},
    prepTestTitle: null,
    sectionTitle: null,
    sectionType: null,
    ...partial,
  }
}

const prepTest = session({
  id: "pt-sess",
  kind: "PREPTEST",
  prepTestId: "pt-1",
  startedAt: "2026-01-01T00:00:00Z",
  completedAt: "2026-01-01T02:00:00Z",
  rawScore: 38,
})

describe("resolvePrepTestLrRcScores", () => {
  it("never uses the old two-LR combined max of 51", () => {
    const scores = resolvePrepTestLrRcScores(prepTest, [])
    expect(scores.lrMax).not.toBe(51)
    expect(scores.lrMax).toBeLessThanOrEqual(LAWHUB_SCORED_SECTION_QUESTION_MAX.LR)
    expect(scores.lrCorrect - scores.lrMax).not.toBe(-51)
  })

  it("does not stuff the PrepTest raw score into RC when section data is missing", () => {
    const scores = resolvePrepTestLrRcScores(prepTest, [])
    expect(scores.rcCorrect).toBe(0)
    expect(scores.rcMax).toBe(0)
    expect(scores.lrCorrect).toBe(0)
    expect(scores.lrMax).toBe(0)
  })

  it("reads scored LR/RC from linked completed section sessions", () => {
    const scores = resolvePrepTestLrRcScores(prepTest, [
      session({
        id: "lr-1",
        kind: "SECTION",
        prepTestId: "pt-1",
        sectionType: "LR",
        rawScore: 20,
        metadata: { questionIds: Array.from({ length: 25 }, (_, i) => `lr-${i}`) },
        startedAt: "2026-01-01T00:10:00Z",
        completedAt: "2026-01-01T00:45:00Z",
      }),
      session({
        id: "rc-1",
        kind: "SECTION",
        prepTestId: "pt-1",
        sectionType: "RC",
        rawScore: 18,
        metadata: { questionCount: 27 },
        startedAt: "2026-01-01T00:50:00Z",
        completedAt: "2026-01-01T01:25:00Z",
      }),
    ])
    expect(scores).toEqual({ lrCorrect: 20, lrMax: 25, rcCorrect: 18, rcMax: 27 })
    expect(scores.lrCorrect - scores.lrMax).toBe(-5)
  })

  it("excludes experimental LR so misses cannot combine to ~51", () => {
    const scores = resolvePrepTestLrRcScores(prepTest, [
      session({
        id: "lr-scored",
        kind: "SECTION",
        prepTestId: "pt-1",
        sectionType: "LR",
        rawScore: 22,
        metadata: { questionCount: 25 },
        startedAt: "2026-01-01T00:10:00Z",
        completedAt: "2026-01-01T00:45:00Z",
      }),
      session({
        id: "lr-exp",
        kind: "SECTION",
        prepTestId: "pt-1",
        sectionType: "LR",
        sectionTitle: "Section 4 (EXP)",
        rawScore: 0,
        metadata: { questionCount: 26, isExperimental: true },
        startedAt: "2026-01-01T00:50:00Z",
        completedAt: "2026-01-01T01:25:00Z",
      }),
    ])
    expect(scores.lrCorrect).toBe(22)
    expect(scores.lrMax).toBe(25)
    expect(scores.lrCorrect - scores.lrMax).toBe(-3)
  })

  it("keeps a single LawHub LR section when two unlabeled LR sessions exist", () => {
    const scores = resolvePrepTestLrRcScores(prepTest, [
      session({
        id: "lr-a",
        kind: "SECTION",
        prepTestId: "pt-1",
        sectionType: "LR",
        rawScore: 19,
        metadata: { questionCount: 25 },
        startedAt: "2026-01-01T00:10:00Z",
        completedAt: "2026-01-01T00:45:00Z",
      }),
      session({
        id: "lr-b",
        kind: "SECTION",
        prepTestId: "pt-1",
        sectionType: "LR",
        rawScore: 0,
        metadata: { questionCount: 26 },
        startedAt: "2026-01-01T00:50:00Z",
        completedAt: "2026-01-01T01:25:00Z",
      }),
    ])
    expect(scores.lrMax).toBeLessThanOrEqual(LAWHUB_SCORED_SECTION_QUESTION_MAX.LR)
    expect(scores.lrCorrect - scores.lrMax).toBeGreaterThanOrEqual(-LAWHUB_SCORED_SECTION_QUESTION_MAX.LR)
    expect(scores.lrCorrect).toBe(19)
    expect(scores.lrMax).toBe(25)
  })

  it("normalizes persisted two-LR 51 totals down to one LawHub section", () => {
    const scores = resolvePrepTestLrRcScores(
      session({
        ...prepTest,
        metadata: { lrCorrect: 0, lrMax: 51, rcCorrect: 11, rcMax: 27 },
      }),
      [],
    )
    expect(scores.lrMax).toBe(26)
    expect(scores.lrCorrect).toBe(0)
    expect(scores.lrCorrect - scores.lrMax).toBe(-26)
    expect(scores.rcCorrect).toBe(11)
    expect(scores.rcMax).toBe(27)
  })

  it("prefers linked section sessions over stale 0/51 metadata", () => {
    const scores = resolvePrepTestLrRcScores(
      session({
        ...prepTest,
        metadata: { lrCorrect: 0, lrMax: 51, rcCorrect: 80, rcMax: 27 },
      }),
      [
        session({
          id: "lr-1",
          kind: "SECTION",
          prepTestId: "pt-1",
          sectionType: "LR",
          rawScore: 21,
          metadata: { questionCount: 26 },
          startedAt: "2026-01-01T00:10:00Z",
          completedAt: "2026-01-01T00:45:00Z",
        }),
      ],
    )
    expect(scores.lrCorrect).toBe(21)
    expect(scores.lrMax).toBe(26)
  })

  it("ignores section sessions from a different PrepTest", () => {
    const scores = resolvePrepTestLrRcScores(prepTest, [
      session({
        id: "other",
        kind: "SECTION",
        prepTestId: "pt-other",
        sectionType: "LR",
        rawScore: 24,
        metadata: { questionCount: 25 },
      }),
    ])
    expect(scores.lrMax).toBe(0)
  })
})
