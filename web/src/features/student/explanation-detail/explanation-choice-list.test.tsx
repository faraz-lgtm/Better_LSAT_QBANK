import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ExplanationChoiceList } from "./explanation-choice-list"

describe("ExplanationChoiceList", () => {
  it("expands option explanation when chevron row is clicked", async () => {
    const user = userEvent.setup()
    render(
      <ExplanationChoiceList
        choices={[
          { id: "A", index: 1, text: "<p>Choice A</p>", explanationHtml: "<p>Because A is wrong</p>" },
          { id: "B", index: 2, text: "<p>Choice B</p>" },
        ]}
        correctChoiceId="B"
        showCorrect={false}
      />,
    )

    expect(screen.queryByText("Because A is wrong")).not.toBeInTheDocument()
    const row = screen.getByText("Choice A").closest("button")
    expect(row).not.toBeNull()
    await user.click(row!)
    expect(screen.getByText("Because A is wrong")).toBeInTheDocument()
    expect(screen.getByText("Option explanation")).toBeInTheDocument()
  })

  it("shows Figma-style check badge when correct answer is revealed", () => {
    render(
      <ExplanationChoiceList
        choices={[{ id: "A", index: 1, text: "<p>Choice A</p>" }]}
        correctChoiceId="A"
        showCorrect
      />,
    )

    const button = screen.getByRole("button")
    const row = button.parentElement
    expect(row).toHaveClass("border-[#0d47a1]")
    const letterBox = button.querySelector("span.flex.size-7")
    expect(letterBox).toHaveClass("bg-[var(--secondary-100)]")
    expect(letterBox?.querySelector("svg")).toBeInTheDocument()
  })

  it("auto-expands initial choice from deep link", () => {
    render(
      <ExplanationChoiceList
        choices={[
          { id: "A", index: 1, text: "A", explanationHtml: "<p>Expl A</p>" },
        ]}
        correctChoiceId="A"
        showCorrect
        initialExpandedChoiceId="A"
      />,
    )
    expect(screen.getByText("Expl A")).toBeInTheDocument()
  })
})
