import { useState } from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { parseFlaggedQuestionIds, toggleFlaggedId } from "@/features/student/practice-session/practice-question-flags"
import { PracticeQuestionFlagButton } from "@/features/student/practice-session/practice-question-flag-button"

describe("practice-question-flags", () => {
  it("parseFlaggedQuestionIds reads string array from metadata", () => {
    expect(parseFlaggedQuestionIds({ flaggedQuestionIds: ["q-1", "q-2"] })).toEqual(["q-1", "q-2"])
    expect(parseFlaggedQuestionIds({})).toEqual([])
    expect(parseFlaggedQuestionIds(undefined)).toEqual([])
  })

  it("toggleFlaggedId adds and removes ids", () => {
    expect(toggleFlaggedId([], "q-1")).toEqual(["q-1"])
    expect(toggleFlaggedId(["q-1"], "q-1")).toEqual([])
    expect(toggleFlaggedId(["q-1"], "q-2")).toEqual(["q-1", "q-2"])
  })
})

describe("PracticeQuestionFlagButton", () => {
  it("toggles aria-pressed on click", async () => {
    const user = userEvent.setup()

    function Wrapper() {
      const [flagged, setFlagged] = useState(false)
      return (
        <PracticeQuestionFlagButton flagged={flagged} onToggle={() => setFlagged((f) => !f)} />
      )
    }

    render(<Wrapper />)
    const btn = screen.getByRole("button", { name: "Flag question for review" })
    expect(btn).toHaveAttribute("aria-pressed", "false")

    await user.click(btn)
    expect(screen.getByRole("button", { name: "Remove flag" })).toHaveAttribute("aria-pressed", "true")
  })
})
