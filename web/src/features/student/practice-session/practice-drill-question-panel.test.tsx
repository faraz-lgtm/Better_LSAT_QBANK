import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { DrillQuestion } from "@/features/student/drills/drill-types"
import { PracticeDrillQuestionPanel } from "@/features/student/practice-session/practice-drill-question-panel"

function question(id: string, stem: string): DrillQuestion {
  return {
    id,
    questionNumber: 1,
    stimulusText: null,
    stemText: stem,
    choices: [
      { id: "A", index: 1, text: "<p>Choice A</p>" },
      { id: "B", index: 2, text: "<p>Choice B</p>" },
    ],
    passage: null,
  }
}

const sharedProps = {
  findQuery: "",
  revealed: false,
  isCorrect: null,
  submitting: false,
  allowReselect: true,
  getRegionHtml: (_key: string, base: string) => base,
  onSelect: () => undefined,
  flagged: false,
  onToggleFlag: () => undefined,
  variant: "official" as const,
}

describe("PracticeDrillQuestionPanel", () => {
  it("auto-selects the stored option when navigating to a new question", () => {
    const first = question("q1", "First stem")
    const { rerender } = render(
      <PracticeDrillQuestionPanel
        {...sharedProps}
        question={first}
        questionNumber={1}
        selectedIndex={0}
      />,
    )

    expect(screen.getByText("A").closest('[role="button"]')).toHaveAttribute("aria-pressed", "true")

    rerender(
      <PracticeDrillQuestionPanel
        {...sharedProps}
        question={question("q2", "Second stem")}
        questionNumber={2}
        selectedIndex={1}
      />,
    )

    expect(screen.getByText("A").closest('[role="button"]')).toHaveAttribute("aria-pressed", "false")
    const selected = screen.getByText("B").closest('[role="button"]')
    expect(selected).toHaveAttribute("aria-pressed", "true")
    expect(selected).toHaveFocus()
  })

  it("does not keep a selected option on an unanswered question", () => {
    const { rerender } = render(
      <PracticeDrillQuestionPanel
        {...sharedProps}
        question={question("q1", "First stem")}
        questionNumber={1}
        selectedIndex={0}
      />,
    )

    rerender(
      <PracticeDrillQuestionPanel
        {...sharedProps}
        question={question("q2", "Second stem")}
        questionNumber={2}
        selectedIndex={null}
      />,
    )

    expect(screen.getByText("A").closest('[role="button"]')).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByText("B").closest('[role="button"]')).toHaveAttribute("aria-pressed", "false")
  })
})
