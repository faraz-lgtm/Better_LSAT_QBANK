import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PracticeBlindReviewSessionHeader } from "@/features/student/practice-session/practice-blind-review-session-header"

describe("PracticeBlindReviewSessionHeader", () => {
  it("keeps Highlight and Remove out of the Blind Review top bar", () => {
    render(
      <PracticeBlindReviewSessionHeader
        prepTestLabel="PrepTest 101"
        sectionOptions={[]}
        activeSectionSessionId={null}
        onSelectSection={() => undefined}
        questionRef="Q1"
        actualScoreLabel="Actual: BR"
        notesOpen={false}
        notesEnabled
        onToggleNotes={() => undefined}
        onExitSection={() => undefined}
      />,
    )

    expect(screen.getByText("Blind Review")).toBeInTheDocument()
    expect(screen.queryByText("Tools:")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Highlight" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Highlighter orange" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Eraser" })).not.toBeInTheDocument()
    expect(screen.queryByRole("toolbar", { name: "Highlight tools" })).not.toBeInTheDocument()
  })
})
