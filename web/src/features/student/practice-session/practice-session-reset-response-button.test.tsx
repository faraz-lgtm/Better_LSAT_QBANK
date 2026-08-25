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
    )
  })
})
