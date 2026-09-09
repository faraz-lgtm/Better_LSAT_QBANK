import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PracticeSessionImmersiveFrame } from "@/features/student/practice-session/practice-session-immersive-frame"
import { EXAM_CARD_FULL_WIDTH_CLASS, OFFICIAL_CARD_CLASS } from "@/features/student/practice-session/practice-session-official-styles"

describe("PracticeSessionImmersiveFrame", () => {
  it("keeps a padded full-width frame capped at the Figma 1920px desktop canvas", () => {
    render(
      <PracticeSessionImmersiveFrame>
        <p>Exam chrome</p>
      </PracticeSessionImmersiveFrame>,
    )

    const exam = screen.getByText("Exam chrome")
    const inner = exam.parentElement
    const frame = inner?.parentElement
    expect(frame).toHaveAttribute("data-practice-session-immersive-frame")
    expect(frame).toHaveClass("p-4")
    expect(inner).toHaveClass("max-w-[1920px]")
  })

  it("can fill the viewport when fullBleed is requested", () => {
    render(
      <PracticeSessionImmersiveFrame fullBleed>
        <p>Exam chrome</p>
      </PracticeSessionImmersiveFrame>,
    )

    const exam = screen.getByText("Exam chrome")
    const inner = exam.parentElement
    const frame = inner?.parentElement
    expect(frame).toHaveClass("p-0", "bg-[var(--background)]")
    expect(inner).toHaveClass("max-w-none")
  })

  it("keeps official exam chrome full-width up to the Figma 1920px canvas", () => {
    render(
      <PracticeSessionImmersiveFrame fullWidth>
        <p>Exam chrome</p>
      </PracticeSessionImmersiveFrame>,
    )

    const exam = screen.getByText("Exam chrome")
    const inner = exam.parentElement
    const frame = inner?.parentElement
    expect(frame).toHaveClass("p-0", "bg-[var(--background)]")
    expect(inner).toHaveClass("max-w-[1920px]")
    expect(inner).not.toHaveClass("max-w-none")
  })
})

describe("official full-page card", () => {
  it("uses the Figma 20255:49920 10px rounded card, not edge-to-edge chrome", () => {
    expect(OFFICIAL_CARD_CLASS).toContain("rounded-[10px]")
    expect(OFFICIAL_CARD_CLASS).toContain("border-[var(--greyscale-100)]")
    expect(OFFICIAL_CARD_CLASS).not.toContain("rounded-none")
    expect(OFFICIAL_CARD_CLASS).not.toContain("border-0")
  })

  it("caps normal view at the Figma 1440px canvas", () => {
    expect(OFFICIAL_CARD_CLASS).toContain("w-full")
    expect(OFFICIAL_CARD_CLASS).toContain("mx-auto")
    expect(OFFICIAL_CARD_CLASS).toContain("max-w-[1440px]")
  })

  it("raises the cap to the Figma 1920px canvas in full-width view", () => {
    expect(EXAM_CARD_FULL_WIDTH_CLASS).toContain("practice-session-card--full-width")
    expect(EXAM_CARD_FULL_WIDTH_CLASS).toContain("max-w-[1920px]")
  })
})
