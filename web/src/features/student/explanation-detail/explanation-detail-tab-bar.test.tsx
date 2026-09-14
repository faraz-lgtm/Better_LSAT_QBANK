import { MemoryRouter } from "react-router-dom"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import type { ExplanationQuestionNavSection } from "@/features/student/explanation-detail/build-explanation-question-nav"
import { ExplanationDetailTabBar } from "@/features/student/explanation-detail/explanation-detail-tab-bar"

const questionNav: ExplanationQuestionNavSection[] = [
  {
    key: "s1",
    heading: "SECTION 1 · RC",
    passages: [
      {
        key: "p1",
        heading: "PASSAGE 1",
        questions: [
          { id: "q1", number: 1, status: "answered" },
          { id: "q5", number: 5, status: "fresh" },
        ],
      },
      {
        key: "p2",
        heading: "PASSAGE 2",
        questions: [{ id: "q8", number: 8, status: "fresh" }],
      },
    ],
  },
  {
    key: "s2",
    heading: "SECTION 2 · LR",
    passages: [
      {
        key: "lr",
        heading: null,
        questions: [{ id: "q10", number: 1, status: "fresh" }],
      },
    ],
  },
]

describe("ExplanationDetailTabBar question jump menu", () => {
  it("lists the full PrepTest across sections and passages", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ExplanationDetailTabBar
          headingCode="PT 160 S1 P1 Q5"
          subtitleTrail="PrepTest 160"
          questionId="q5"
          questionNumber={5}
          questionNav={questionNav}
          tab="question"
          onTabChange={() => {}}
          prevHref={null}
          nextHref={null}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Jump to question" }))

    const list = screen.getByRole("listbox", { name: "Jump to question" })
    expect(within(list).getByText("SECTION 1 · RC")).toBeInTheDocument()
    expect(within(list).getByText("PASSAGE 1")).toBeInTheDocument()
    expect(within(list).getByText("PASSAGE 2")).toBeInTheDocument()
    expect(within(list).getByText("SECTION 2 · LR")).toBeInTheDocument()
    expect(within(list).getAllByRole("option")).toHaveLength(4)
    expect(within(list).getByRole("option", { name: "Question 5" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(within(list).getByRole("option", { name: "Question 8" })).toBeInTheDocument()
  })
})
