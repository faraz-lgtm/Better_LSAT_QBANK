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
    expect(screen.queryByText("Option explanation")).not.toBeInTheDocument()
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
    expect(row).toHaveClass("border-[3px]", "border-solid", "border-[var(--explanation-answered)]", "bg-[var(--explanation-answered-bg)]")
    expect(row).not.toHaveClass("border-[var(--primary)]")
    const letterBox = button.querySelector("span.flex.size-8")
    expect(letterBox).toHaveClass("bg-[var(--explanation-answered)]", "text-white", "border-[var(--explanation-answered)]")
    const check = letterBox?.querySelector("svg")
    expect(check).toBeInTheDocument()
    expect(check).toHaveClass("size-6", "text-white")
    expect(check).toHaveAttribute("stroke-width", "3")
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

  it("does not repeat a struck-through restatement of the answer choice in the explanation", async () => {
    const user = userEvent.setup()
    const choiceText = "Some of the great creative geniuses in history were first-born children."
    render(
      <ExplanationChoiceList
        choices={[
          {
            id: "A",
            index: 1,
            text: `<p>${choiceText}</p>`,
            explanationHtml:
              `<blockquote>A) ${choiceText}</blockquote> ` +
              "<p>This choice is problematic because birth order is not established.</p>",
          },
        ]}
        correctChoiceId="B"
        showCorrect={false}
      />,
    )

    await user.click(screen.getByText(choiceText).closest("button")!)
    expect(
      screen.getByText("This choice is problematic because birth order is not established."),
    ).toBeInTheDocument()
    expect(screen.getAllByText(choiceText)).toHaveLength(1)
    expect(screen.queryByText(`A) ${choiceText}`)).not.toBeInTheDocument()
  })
})
