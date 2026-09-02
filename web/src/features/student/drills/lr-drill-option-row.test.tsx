import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LrDrillOptionRow } from "./lr-drill-option-row"

describe("LrDrillOptionRow", () => {
  it("selects an answer while a passage selection leftover exists", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    const passage = document.createElement("div")
    passage.textContent = "passage text to highlight"
    document.body.appendChild(passage)
    const range = document.createRange()
    range.selectNodeContents(passage)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    expect(window.getSelection()?.isCollapsed).toBe(false)

    render(
      <LrDrillOptionRow
        index={0}
        html="<p>Choice A</p>"
        selected={false}
        onSelect={onSelect}
        variant="active-drill"
        showSideAction={false}
      />,
    )

    await user.click(screen.getByRole("button"))
    expect(onSelect).toHaveBeenCalledTimes(1)

    document.body.removeChild(passage)
  })

  it("uses blue selected styles for clean answer view, not orange BR", () => {
    const { container } = render(
      <LrDrillOptionRow
        index={0}
        html="<p>Choice A</p>"
        selected
        onSelect={() => undefined}
        variant="blind-review"
        answerView="clean"
        explanationAction
      />,
    )
    expect(container.firstChild).toHaveClass("border-[#0d47a1]")
    expect(container.firstChild).not.toHaveClass("border-[#ff6f00]")
  })

  it("uses orange selected styles for Blind Review answer view", () => {
    const { container } = render(
      <LrDrillOptionRow
        index={0}
        html="<p>Choice A</p>"
        selected
        onSelect={() => undefined}
        variant="blind-review"
        answerView="blind_review"
      />,
    )
    expect(container.firstChild).toHaveClass("border-[#ff6f00]")
  })

  it("sizes Blind Review choice rows to wrapped text instead of a clipped fixed height", () => {
    const longChoice =
      "a doctor prescribing a medication to a patient without first determining whether the patient is allergic to it"
    const { container } = render(
      <LrDrillOptionRow
        index={0}
        html={`<p>${longChoice}</p>`}
        selected={false}
        onSelect={() => undefined}
        variant="blind-review"
      />,
    )

    expect(container.firstChild).toHaveClass("h-auto")
    expect(container.firstChild).not.toHaveClass("overflow-hidden")
    expect(screen.getByRole("button", { name: new RegExp(longChoice, "i") })).toHaveClass("items-start", "py-3")
    expect(screen.getByText("A")).toHaveClass("self-start")
    expect(screen.getByText(longChoice).closest(".practice-session-content")).toHaveClass("text-pretty")
  })

  it("selects an answer on a simple click", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <LrDrillOptionRow
        index={1}
        html="<p>Choice B</p>"
        selected={false}
        onSelect={onSelect}
        variant="active-drill"
        showSideAction={false}
      />,
    )

    await user.click(screen.getByRole("button"))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("uses Figma 20268:102788 14px cards and 46px rounded-square letters", () => {
    const { container } = render(
      <LrDrillOptionRow
        index={1}
        html="<p>Choice B</p>"
        selected
        onSelect={() => undefined}
        variant="active-drill"
        showSideAction={false}
      />,
    )

    expect(container.firstChild).toHaveClass("rounded-[14px]")
    expect(container.firstChild).not.toHaveClass("rounded-[16px]")
    const letter = screen.getByText("B")
    expect(letter).toHaveClass("size-[46px]", "rounded-[12px]")
    expect(letter).not.toHaveClass("rounded-full")
  })

  it("marks unselected LSAT cards so white-on-black can restyle them", () => {
    const { container } = render(
      <LrDrillOptionRow
        index={0}
        html="<p>Choice A</p>"
        selected={false}
        onSelect={() => undefined}
        variant="active-drill"
        showSideAction={false}
      />,
    )

    expect(container.firstChild).toHaveClass("practice-session-choice--unselected")
    expect(container.firstChild).not.toHaveClass("practice-session-choice--selected")
    expect(screen.getByText("Choice A").closest(".practice-session-content")).toHaveClass("text-[color:inherit]")
  })

  it("fades letter and copy when masked in the LSAT exam layout, without a hatch overlay", () => {
    const { container } = render(
      <LrDrillOptionRow
        index={1}
        html="<p>Choice B</p>"
        selected
        masked
        onSelect={() => undefined}
        variant="active-drill"
        showSideAction={false}
      />,
    )

    expect(container.firstChild).toHaveClass("practice-session-choice-masked", "rounded-[14px]")
    expect(container.firstChild).not.toHaveClass("practice-session-choice--selected")
    expect(screen.getByRole("button", { name: "Answer choice B, masked" })).toBeInTheDocument()
    expect(screen.getByText("B")).toHaveClass("practice-session-choice-masked-ink")
    expect(screen.getByText("Choice B").closest(".practice-session-choice-masked-ink")).toBeTruthy()
  })

  it("fades official LawHub letter cell and copy the same way", () => {
    render(
      <LrDrillOptionRow
        index={1}
        html="<p>Choice B</p>"
        selected={false}
        masked
        onSelect={() => undefined}
        variant="official"
        showSideAction={false}
      />,
    )

    expect(screen.getByRole("button", { name: "Answer choice B, masked" })).toHaveClass(
      "practice-session-choice-masked",
    )
    expect(screen.getByText("B")).toHaveClass("practice-session-choice-masked-ink")
    expect(screen.getByText("Choice B").closest(".practice-session-choice-masked-ink")).toBeTruthy()
  })

  it("masks the choice instead of selecting while response masking is on", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onToggleMasked = vi.fn()

    render(
      <LrDrillOptionRow
        index={0}
        html="<p>Choice A</p>"
        selected={false}
        maskingMode
        onSelect={onSelect}
        onToggleMasked={onToggleMasked}
        variant="active-drill"
        showSideAction={false}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Answer choice A, click to mask" }))
    expect(onToggleMasked).toHaveBeenCalledTimes(1)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("unmasks then selects when masking mode is off", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onToggleMasked = vi.fn()

    render(
      <LrDrillOptionRow
        index={0}
        html="<p>Choice A</p>"
        selected={false}
        masked
        onSelect={onSelect}
        onToggleMasked={onToggleMasked}
        variant="official"
        showSideAction={false}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Answer choice A, masked" }))
    expect(onToggleMasked).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("uses Figma 20243:23534 yellow selected chrome with a left bar only", () => {
    const { container } = render(
      <LrDrillOptionRow
        index={2}
        html="<p>Choice C</p>"
        selected
        onSelect={() => undefined}
        variant="official"
        showSideAction={false}
      />,
    )

    expect(container.firstElementChild).toHaveClass("bg-[#fdfac4]", "relative")
    expect(container.firstChild).toHaveClass("bg-[#fdfac4]", "relative")
    expect(container.firstElementChild?.firstElementChild).toHaveClass("w-[3px]", "absolute", "left-0", "bg-[#12162a]")
    const letter = screen.getByText("C")
    expect(letter).toHaveClass("w-[60px]", "min-h-[60px]", "bg-[#fdfac4]", "text-[#2c3143]", "text-[28px]")
    expect(letter).not.toHaveClass("bg-white")
    expect(letter.nextElementSibling).toHaveClass("py-2", "pl-1.5", "pr-3", "min-h-[60px]")
  })

  it("uses a white 60px letter cell on the gray unselected official row", () => {
    const { container } = render(
      <LrDrillOptionRow
        index={0}
        html="<p>Choice A</p>"
        selected={false}
        onSelect={() => undefined}
        variant="official"
        showSideAction={false}
      />,
    )

    expect(container.firstChild).toHaveClass("bg-[#f2f3f8]")
    expect(screen.getByText("A")).toHaveClass("w-[60px]", "bg-white", "border-[#f2f3f8]", "text-[#50577b]")
  })
})
