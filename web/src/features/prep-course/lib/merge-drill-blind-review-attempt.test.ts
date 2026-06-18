import { describe, expect, it } from "vitest"

import {
  blindReviewFromSessionMetadata,
  loadStashedDrillBlindReview,
  mergeActiveDrillAttemptBlindReview,
  stashDrillBlindReviewResult,
} from "@/features/prep-course/lib/merge-drill-blind-review-attempt"
import type { PrepLessonActiveDrillAttempt } from "@/lib/api/prep-course"

const baseAttempt: PrepLessonActiveDrillAttempt = {
  sessionId: "sess-1",
  completedAt: "2026-01-01T00:05:00Z",
  rawScore: 0,
  questionCount: 1,
  elapsedSeconds: 120,
  answers: [{ questionId: "q-1", selectedAnswer: "A", isCorrect: false }],
  blindReview: null,
}

describe("merge-drill-blind-review-attempt", () => {
  it("parses blind review metadata", () => {
    const parsed = blindReviewFromSessionMetadata({
      drillBlindReviewCompletedAt: "2026-01-01T00:10:00Z",
      drillBlindReviewRawScore: 1,
      drillBlindReviewAnswers: [{ questionId: "q-1", selectedAnswer: "C", isCorrect: true }],
    })
    expect(parsed?.rawScore).toBe(1)
    expect(parsed?.answers[0]?.isCorrect).toBe(true)
  })

  it("merges blind review from getDrillSession when prep-course omits it", async () => {
    sessionStorage.clear()
    const merged = await mergeActiveDrillAttemptBlindReview(baseAttempt, {
      lessonId: "lesson-1",
      getDrillSession: async () => ({
        session: {
          id: "sess-1",
          user_id: "user-1",
          kind: "DRILL",
          prep_test_id: null,
          section_id: null,
          started_at: "2026-01-01T00:00:00Z",
          completed_at: "2026-01-01T00:05:00Z",
          raw_score: 0,
          scaled_score: null,
          percentile: null,
          bookmarked: false,
          excluded: false,
          metadata: {
            drillBlindReviewCompletedAt: "2026-01-01T00:10:00Z",
            drillBlindReviewRawScore: 1,
            drillBlindReviewAnswers: [{ questionId: "q-1", selectedAnswer: "C", isCorrect: true }],
          },
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:10:00Z",
        },
      }),
    })
    expect(merged?.blindReview?.rawScore).toBe(1)
    expect(loadStashedDrillBlindReview({ sessionId: "sess-1", lessonId: "lesson-1" })?.rawScore).toBe(1)
  })

  it("stashes blind review for lesson reload", () => {
    sessionStorage.clear()
    stashDrillBlindReviewResult(
      {
        id: "sess-1",
        user_id: "user-1",
        kind: "DRILL",
        prep_test_id: null,
        section_id: null,
        started_at: "2026-01-01T00:00:00Z",
        completed_at: "2026-01-01T00:05:00Z",
        raw_score: 0,
        scaled_score: null,
        percentile: null,
        bookmarked: false,
        excluded: false,
        metadata: {
          drillBlindReviewCompletedAt: "2026-01-01T00:10:00Z",
          drillBlindReviewRawScore: 1,
          drillBlindReviewAnswers: [{ questionId: "q-1", selectedAnswer: "C", isCorrect: true }],
        },
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:10:00Z",
      },
      "lesson-1",
    )
    expect(loadStashedDrillBlindReview({ sessionId: "sess-1", lessonId: "lesson-1" })?.answers[0]?.selectedAnswer).toBe(
      "C",
    )
  })
})
