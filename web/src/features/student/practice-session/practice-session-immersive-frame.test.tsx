import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PracticeSessionImmersiveFrame } from "@/features/student/practice-session/practice-session-immersive-frame"
import { OFFICIAL_CARD_CLASS } from "@/features/student/practice-session/practice-session-official-styles"

describe("PracticeSessionImmersiveFrame", () => {
  it("keeps the padded 1440 card frame for LSAT default and official normal view", () => {
    render(
      <PracticeSessionImmersiveFrame>
        <p>Exam chrome</p>
      </PracticeSessionImmersiveFrame>,
    )

    const exam = screen.getByText("Exam chrome")
    const inner = exam.parentElement
    const frame = inner?.parentElement
    expect(frame).toHaveClass("p-4")
    expect(inner).toHaveClass("max-w-[1440px]")
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
    expect(frame).toHaveClass("p-0", "bg-white")
    expect(inner).toHaveClass("max-w-none")
  })
})

describe("official full-page card", () => {
  it("uses the Figma 20255:49920 10px rounded 1440 card, not edge-to-edge chrome", () => {
    expect(OFFICIAL_CARD_CLASS).toContain("rounded-[10px]")
    expect(OFFICIAL_CARD_CLASS).toContain("border-[#d4d7e2]")
    expect(OFFICIAL_CARD_CLASS).not.toContain("rounded-none")
    expect(OFFICIAL_CARD_CLASS).not.toContain("border-0")
  })
})
