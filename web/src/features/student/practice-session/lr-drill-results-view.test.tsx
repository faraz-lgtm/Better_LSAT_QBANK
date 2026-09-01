import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi, type Mock } from "vitest"

import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import type { PracticeQuestionResultMeta } from "@/features/student/practice-session/build-practice-results-section-groups"
import { LrDrillResultsView } from "@/features/student/practice-session/lr-drill-results-view"

function question(id: string): DrillQuestion {
  return {
    id,
    questionNumber: 1,
    stimulusText: null,
    stemText: null,
    choices: [
      { id: "a", index: 0, text: "A" },
      { id: "b", index: 1, text: "B" },
    ],
    passage: null,
    correctChoiceId: "a",
  }
}

function detail(id: string, questionNumber: number): ExplanationDetailPayload {
  return {
    questionId: id,
    prepTestId: "pt",
    prepTestTitle: "PT 129",
    prepTestNumber: "129",
    sectionId: "s1",
    sectionType: "LR",
    sectionNumber: 1,
    questionNumber,
    topicName: "LR",
    tags: ["MB"],
    explanationHtml: null,
    videoUrl: null,
    stimulusText: null,
    stemText: null,
    choices: [
      { id: "a", index: 0, text: "A", explanationHtml: null },
      { id: "b", index: 1, text: "B", explanationHtml: null },
    ],
    correctChoiceId: "a",
    passage: { id: "p1", displayNumber: 1, title: "Passage 1", body: "" },
    answerPopularity: [],
    difficulty: 3,
  }
}

function meta(id: string, questionNumber: number, isCorrect: boolean): PracticeQuestionResultMeta {
  return {
    question: question(id),
    number: questionNumber,
    detail: detail(id, questionNumber),
    isCorrect,
    isUnanswered: false,
    selectedAnswer: isCorrect ? "a" : "b",
    yourTimeSeconds: 6,
  }
}

const questions = [meta("q1", 1, true), meta("q2", 2, false)]

function renderDrillResults(
  onToggleBookmark: Mock<(questionId: string) => void> = vi.fn(),
  variant: "drill" | "section" = "drill",
) {
  function Harness() {
    const [bookmarkedIds, setBookmarkedIds] = useState(new Set<string>())
    return (
      <MemoryRouter>
        <LrDrillResultsView
          variant={variant}
          questionCount={2}
          rawScore={1}
          scaledScore={null}
          elapsedSeconds={12}
          timing="unlimited"
          take={1}
          excluded={false}
          questions={questions}
          showBlindReview={false}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={(id) => {
            onToggleBookmark(id)
            setBookmarkedIds((current) => {
              const next = new Set(current)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }}
          onReviewInTester={() => {}}
          onExcludedChange={() => {}}
        />
      </MemoryRouter>
    )
  }

  render(<Harness />)
  return { onToggleBookmark }
}

async function bookmarkFirstAndFilterToBookmarkedOnly(
  user: ReturnType<typeof userEvent.setup>,
  onToggleBookmark: Mock<(questionId: string) => void>,
) {
  expect(screen.getByText(/PT 129\s+\.\s+S1\s+\.\s+Q1/)).toBeInTheDocument()
  expect(screen.getByText(/PT 129\s+\.\s+S1\s+\.\s+Q2/)).toBeInTheDocument()
  expect(screen.getByText("Bookmarked only")).toBeInTheDocument()

  await user.click(screen.getAllByRole("button", { name: "Bookmark question" })[0]!)
  expect(onToggleBookmark).toHaveBeenCalledWith("q1")
  expect(screen.getByRole("button", { name: "Remove bookmark" })).toBeInTheDocument()

  await user.click(screen.getByRole("switch", { name: "Show bookmarked only" }))
  expect(screen.getByText(/PT 129\s+\.\s+S1\s+\.\s+Q1/)).toBeInTheDocument()
  expect(screen.queryByText(/PT 129\s+\.\s+S1\s+\.\s+Q2/)).not.toBeInTheDocument()
}

describe("LrDrillResultsView bookmarks", () => {
  it("bookmarks a question and filters the list with Bookmarked only", async () => {
    const user = userEvent.setup()
    const { onToggleBookmark } = renderDrillResults()
    expect(screen.getByText("Total Questions: 02")).toBeInTheDocument()
    await bookmarkFirstAndFilterToBookmarkedOnly(user, onToggleBookmark)
  })

  it("bookmarks and filters on section results the same way", async () => {
    const user = userEvent.setup()
    const { onToggleBookmark } = renderDrillResults(vi.fn(), "section")
    expect(screen.getByText("1/2")).toBeInTheDocument()
    expect(screen.getByText("Bookmarked only")).toBeInTheDocument()
    await bookmarkFirstAndFilterToBookmarkedOnly(user, onToggleBookmark)
  })

  it("does not force a horizontal scrollbar on question result rows", () => {
    renderDrillResults()
    const title = screen.getByText(/PT 129\s+\.\s+S1\s+\.\s+Q1/)
    const row = title.closest("article")
    expect(row).toBeTruthy()
    expect(row?.className).not.toMatch(/overflow-x-auto/)
    expect(row?.innerHTML).not.toMatch(/min-w-\[1104px\]/)
    expect(row?.innerHTML).not.toMatch(/w-\[562px\]/)
    expect(row?.innerHTML).not.toMatch(/w-\[542px\]/)
  })
})
