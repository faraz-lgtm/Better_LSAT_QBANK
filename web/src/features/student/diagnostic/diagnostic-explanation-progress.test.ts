import { describe, expect, it } from "vitest"

import type { GuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import {
  buildDiagnosticExplanationHistoryRows,
  buildDiagnosticExplanationProgressMap,
  getDiagnosticExplanationQuestionProgress,
} from "@/features/student/diagnostic/diagnostic-explanation-progress"

function attempt(
  overrides: Partial<GuestDiagnosticResult> & Pick<GuestDiagnosticResult, "intentId" | "outcomes">,
): GuestDiagnosticResult {
  return {
    id: overrides.id ?? "attempt-1",
    intentId: overrides.intentId,
    completedAt: overrides.completedAt ?? "2026-01-02T00:00:00.000Z",
    diagnosticNumber: 1,
    scaledScore: 150,
    scaledScoreLow: 148,
    scaledScoreHigh: 152,
    scaledScoreLabel: "148-152",
    percentile: 50,
    percentileLow: 45,
    percentileHigh: 55,
    percentileLabel: "45-55",
    correctCount: overrides.correctCount ?? 1,
    questionCount: overrides.questionCount ?? overrides.outcomes.length,
    outcomes: overrides.outcomes,
  }
}

describe("buildDiagnosticExplanationProgressMap", () => {
  it("marks answered when the latest completed attempt has a selection", () => {
    const progress = buildDiagnosticExplanationProgressMap({
      attempts: [
        attempt({
          intentId: "mini",
          outcomes: [
            { questionId: "mini-diag-q1", isCorrect: true, selectedAnswer: "C" },
            { questionId: "mini-diag-q2", isCorrect: false, selectedAnswer: null },
          ],
        }),
      ],
    })

    expect(getDiagnosticExplanationQuestionProgress(progress, "mini-diag-q1")).toEqual({
      status: "answered",
      userSelectedLetter: "C",
      yourTimeSeconds: null,
    })
    expect(getDiagnosticExplanationQuestionProgress(progress, "mini-diag-q2")).toEqual({
      status: "seen",
      userSelectedLetter: null,
      yourTimeSeconds: null,
    })
    expect(getDiagnosticExplanationQuestionProgress(progress, "mini-diag-q3")).toEqual({
      status: "fresh",
      userSelectedLetter: null,
      yourTimeSeconds: null,
    })
  })

  it("carries yourTimeSeconds from the latest completed attempt", () => {
    const progress = buildDiagnosticExplanationProgressMap({
      attempts: [
        attempt({
          intentId: "mini",
          outcomes: [
            {
              questionId: "mini-diag-q1",
              isCorrect: true,
              selectedAnswer: "C",
              timeSpentSeconds: 47.6,
            },
          ],
        }),
      ],
    })

    expect(getDiagnosticExplanationQuestionProgress(progress, "mini-diag-q1")).toEqual({
      status: "answered",
      userSelectedLetter: "C",
      yourTimeSeconds: 48,
    })
  })

  it("prefers the most recent completed attempt for the same question", () => {
    const progress = buildDiagnosticExplanationProgressMap({
      attempts: [
        attempt({
          id: "older",
          intentId: "mini",
          completedAt: "2026-01-01T00:00:00.000Z",
          outcomes: [{ questionId: "mini-diag-q1", isCorrect: false, selectedAnswer: "A" }],
        }),
        attempt({
          id: "newer",
          intentId: "mini",
          completedAt: "2026-01-03T00:00:00.000Z",
          outcomes: [{ questionId: "mini-diag-q1", isCorrect: true, selectedAnswer: "B" }],
        }),
      ],
    })

    expect(getDiagnosticExplanationQuestionProgress(progress, "mini-diag-q1")).toEqual({
      status: "answered",
      userSelectedLetter: "B",
      yourTimeSeconds: null,
    })
  })

  it("marks in_process from session answers when there is no completed selection", () => {
    const progress = buildDiagnosticExplanationProgressMap({
      attempts: [],
      inProgressByIntent: {
        mini: {
          "mini-diag-q1": { selectedAnswer: "D", isCorrect: false },
        },
      },
    })

    expect(getDiagnosticExplanationQuestionProgress(progress, "mini-diag-q1")).toEqual({
      status: "in_process",
      userSelectedLetter: "D",
      yourTimeSeconds: null,
    })
  })

  it("keeps answered over in_process when a completed selection exists", () => {
    const progress = buildDiagnosticExplanationProgressMap({
      attempts: [
        attempt({
          intentId: "mini",
          outcomes: [{ questionId: "mini-diag-q1", isCorrect: true, selectedAnswer: "C" }],
        }),
      ],
      inProgressByIntent: {
        mini: {
          "mini-diag-q1": { selectedAnswer: "A", isCorrect: false },
        },
      },
    })

    expect(getDiagnosticExplanationQuestionProgress(progress, "mini-diag-q1")).toEqual({
      status: "answered",
      userSelectedLetter: "C",
      yourTimeSeconds: null,
    })
  })

  it("builds Insights history rows from completed attempts (newest first)", () => {
    const rows = buildDiagnosticExplanationHistoryRows("mini-diag-q1", [
      attempt({
        id: "older",
        intentId: "mini",
        completedAt: "2026-01-01T00:00:00.000Z",
        outcomes: [
          {
            questionId: "mini-diag-q1",
            isCorrect: false,
            selectedAnswer: "A",
            timeSpentSeconds: 40,
          },
        ],
      }),
      attempt({
        id: "newer",
        intentId: "mini",
        completedAt: "2026-02-15T00:00:00.000Z",
        outcomes: [
          {
            questionId: "mini-diag-q1",
            isCorrect: true,
            selectedAnswer: "C",
            timeSpentSeconds: 55,
          },
        ],
      }),
      attempt({
        id: "other-q",
        intentId: "quick",
        completedAt: "2026-03-01T00:00:00.000Z",
        outcomes: [{ questionId: "section-diag-q1", isCorrect: true, selectedAnswer: "B" }],
      }),
    ])

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      source: "Mini Diagnostic",
      status: "answered",
      timeRange: "0:55",
      dateLabel: "Feb 15",
    })
    expect(rows[1]).toMatchObject({
      source: "Mini Diagnostic",
      status: "answered",
      timeRange: "0:40",
      dateLabel: "Jan 1",
    })
  })
})
