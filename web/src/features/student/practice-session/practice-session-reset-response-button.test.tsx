import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PracticeSessionResetResponseButton } from "@/features/student/practice-session/practice-session-reset-response-button"

describe("PracticeSessionResetResponseButton", () => {
  it("uses the Figma 20268:105681 gray 34px pill", () => {
    render(<PracticeSessionResetResponseButton onClick={() => undefined} />)

    expect(screen.getByRole("button", { name: "Reset Response" })).toHaveClass(
      "h-[34px]",
      "rounded-[6px]",
      "bg-[#f6f8fa]",
      "practice-session-reset-response",
    )
  })

  it("uses the official bordered gray pill in the Figma 20243:23534 reset tray", () => {
    render(<PracticeSessionResetResponseButton variant="official" onClick={() => undefined} />)

    const button = screen.getByRole("button", { name: "Reset Response" })
    expect(button).toHaveClass("h-[34px]", "border-[#d4d7e2]", "bg-[#eaecf3]", "text-[#2c3143]", "rounded-[6px]")
    expect(button.parentElement).toHaveClass("h-[46px]", "justify-end", "pt-3")
  })

  it("stays visible but inactive when there is nothing to reset", () => {
    render(<PracticeSessionResetResponseButton disabled onClick={() => undefined} />)
    expect(screen.getByRole("button", { name: "Reset Response" })).toBeDisabled()
  })
})
