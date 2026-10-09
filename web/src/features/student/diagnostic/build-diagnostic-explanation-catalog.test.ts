import { describe, expect, it } from "vitest"

import {
  buildDiagnosticExplanationListItems,
  buildDiagnosticExplanationTrees,
  locateDiagnosticExplanationQuestion,
} from "@/features/student/diagnostic/build-diagnostic-explanation-catalog"
import { buildDiagnosticExplanationProgressMap } from "@/features/student/diagnostic/diagnostic-explanation-progress"
import { diagnosticExplanationQuestionDetailHref } from "@/features/student/diagnostic/diagnostic-explanations-routes"
import { buildDiagnosticExplanationQuestionDetailView } from "@/features/student/diagnostic/build-diagnostic-explanation-detail"
import type { GuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"

describe("diagnostic explanation catalog", () => {
  it("lists Mini and Section diagnostic sets", () => {
    const items = buildDiagnosticExplanationListItems()
    expect(items.map((item) => item.title)).toEqual(["Mini Diagnostic", "Section Diagnostic"])
    expect(items[0]?.questionCount).toBeGreaterThan(0)
    expect(items[1]?.questionCount).toBeGreaterThan(0)
  })

  it("locates a mini diagnostic question and builds a detail view", () => {
    const trees = buildDiagnosticExplanationTrees()
    const firstId = trees[0]?.sections[0]?.passages[0]?.questions[0]?.id
    expect(firstId).toBeTruthy()
    expect(locateDiagnosticExplanationQuestion(firstId!)).not.toBeNull()

    const view = buildDiagnosticExplanationQuestionDetailView(firstId!)
    expect(view?.questionNumber).toBe(1)
    expect(view?.choices.length).toBeGreaterThan(0)
    expect(view?.analytics.userSelectedLetter).toBeNull()
    expect(view?.hasExplanationTab).toBe(false)
    expect(diagnosticExplanationQuestionDetailHref(firstId!)).toBe(
      `/app/diagnostic/explanations/q/${encodeURIComponent(firstId!)}`,
    )

    const withVideo = buildDiagnosticExplanationQuestionDetailView(
      firstId!,
      undefined,
      [],
      "https://gumlet.tv/watch/6ac7f1fe2b2e8222c6c6e72d/",
    )
    expect(withVideo?.hasExplanationTab).toBe(true)
    expect(withVideo?.videos.some((v) => v.videoUrl?.includes("gumlet"))).toBe(true)

    const videoMap = new Map([[firstId!, "https://gumlet.tv/watch/6ac7f1fe2b2e8222c6c6e72d/"]])
    const treesWithVideo = buildDiagnosticExplanationTrees(undefined, videoMap)
    expect(treesWithVideo[0]?.sections[0]?.passages[0]?.questions[0]?.hasVideo).toBe(true)
    expect(treesWithVideo[0]?.sections[0]?.passages[0]?.questions[1]?.hasVideo).toBe(false)
  })

  it("applies real attempt status and selected letter onto catalog + detail", () => {
    const trees = buildDiagnosticExplanationTrees()
    const firstId = trees[0]?.sections[0]?.passages[0]?.questions[0]?.id
    expect(firstId).toBeTruthy()

    const attempt: GuestDiagnosticResult = {
      id: "a1",
      intentId: "mini",
      completedAt: "2026-01-02T00:00:00.000Z",
      diagnosticNumber: 1,
      scaledScore: 150,
      scaledScoreLow: 148,
      scaledScoreHigh: 152,
      scaledScoreLabel: "148-152",
      percentile: 50,
      percentileLow: 45,
      percentileHigh: 55,
      percentileLabel: "45-55",
      correctCount: 1,
      questionCount: 1,
      outcomes: [
        {
          questionId: firstId!,
          isCorrect: true,
          selectedAnswer: "C",
          timeSpentSeconds: 52,
        },
      ],
    }
    const progress = buildDiagnosticExplanationProgressMap({ attempts: [attempt] })
    const located = locateDiagnosticExplanationQuestion(firstId!, progress)
    expect(located?.question.status).toBe("answered")

    const view = buildDiagnosticExplanationQuestionDetailView(firstId!, progress, [attempt])
    expect(view?.analytics.userSelectedLetter).toBe("C")
    expect(view?.analytics.yourTimeSeconds).toBe(52)
    expect(view?.analytics.history).toHaveLength(1)
    expect(view?.analytics.history[0]).toMatchObject({
      source: "Mini Diagnostic",
      status: "answered",
      timeRange: "0:52",
    })
  })
})
