import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi, type Mock } from "vitest"

import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import type {
  PracticePassageQuestionGroup,
  PracticeQuestionResultMeta,
} from "@/features/student/practice-session/build-practice-results-section-groups"
import { RcDrillResultsView } from "@/features/student/practice-session/rc-drill-results-view"

function question(id: string): DrillQuestion {
  return {
    id,
    questionNumber: 1,
    stimulusText: null,
    stemText: null,
    choices: [{ id: "a", index: 0, text: "A" }],
    passage: { id: "p1", displayNumber: 1, title: "Passage 1", body: "" },
    correctChoiceId: "a",
  }
}

function detail(id: string, questionNumber: number): ExplanationDetailPayload {
  return {
    questionId: id,
    prepTestId: "pt",
    prepTestTitle: "PT 128",
    prepTestNumber: "128",
    sectionId: "s4",
    sectionType: "RC",
    sectionNumber: 4,
    questionNumber,
    topicName: "RC",
    explanationHtml: null,
    videoUrl: null,
    stimulusText: null,
    stemText: null,
    choices: [{ id: "a", index: 0, text: "A", explanationHtml: null }],
    correctChoiceId: "a",
    passage: { id: "p1", displayNumber: 1, title: "Passage 1", body: "" },
    answerPopularity: [],
    difficulty: 3,
  }
}

function meta(id: string, questionNumber: number): PracticeQuestionResultMeta {
  return {
    question: question(id),
    number: questionNumber,
    detail: detail(id, questionNumber),
    isCorrect: true,
    isUnanswered: false,
    selectedAnswer: "a",
    yourTimeSeconds: 6,
  }
}

function passageGroup(
  id: string,
  label: string,
  title: string,
  questions: PracticeQuestionResultMeta[],
): PracticePassageQuestionGroup {
  return {
    passage: {
      id,
      passageLabel: label,
      title,
      tags: [],
      difficulty: "Medium",
      targetTime: "01:30",
      yourTime: "00:06",
      yourTimeNote: "",
    },
    questions,
  }
}

const passages = [
  passageGroup("p1", "P1", "Passage 1", [meta("q1", 1)]),
  passageGroup("p2", "P2", "Passage 2", [meta("q2", 2)]),
]

describe("RcDrillResultsView bookmarks", () => {
  function renderView(
    onToggleBookmark: Mock<(questionId: string) => void>,
    variant: "drill" | "section" = "drill",
  ) {
    function Harness() {
      const [bookmarkedIds, setBookmarkedIds] = useState(new Set<string>())
      return (
        <MemoryRouter>
          <RcDrillResultsView
            variant={variant}
            questionCount={2}
            rawScore={2}
            scaledScore={null}
            elapsedSeconds={12}
            timing="unlimited"
            take={1}
            excluded={false}
            passages={passages}
            questions={[meta("q1", 1), meta("q2", 2)]}
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
  }

  async function bookmarkFirstAndFilterPassages(
    user: ReturnType<typeof userEvent.setup>,
    onToggleBookmark: Mock<(questionId: string) => void>,
  ) {
    expect(screen.getByText("Passage 1")).toBeInTheDocument()
    expect(screen.getByText("Passage 2")).toBeInTheDocument()
    expect(screen.getByText("Bookmarked only")).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Bookmark question" })[0]!)
    expect(onToggleBookmark).toHaveBeenCalledWith("q1")

    await user.click(screen.getByRole("switch", { name: "Show bookmarked only" }))
    expect(screen.getByText("Passage 1")).toBeInTheDocument()
    expect(screen.queryByText("Passage 2")).not.toBeInTheDocument()
  }

  it("bookmarks a question and filters passages with Bookmarked only", async () => {
    const user = userEvent.setup()
    const onToggleBookmark = vi.fn()
    renderView(onToggleBookmark)
    await bookmarkFirstAndFilterPassages(user, onToggleBookmark)
  })

  it("bookmarks and filters on RC section results the same way", async () => {
    const user = userEvent.setup()
    const onToggleBookmark = vi.fn()
    renderView(onToggleBookmark, "section")
    expect(screen.getByText("2/2")).toBeInTheDocument()
    await bookmarkFirstAndFilterPassages(user, onToggleBookmark)
  })
})
