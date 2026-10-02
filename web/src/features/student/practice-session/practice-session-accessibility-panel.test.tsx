import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DEFAULT_ACCESSIBILITY_SETTINGS } from "@/features/student/practice-session/practice-session-accessibility"
import { PracticeSessionAccessibilityPanel } from "@/features/student/practice-session/practice-session-accessibility-panel"

describe("PracticeSessionAccessibilityPanel", () => {
  it("previews Huge font size on the exam after selecting it", async () => {
    const user = userEvent.setup()
    const onPreview = vi.fn()

    render(
      <PracticeSessionAccessibilityPanel
        open
        settings={DEFAULT_ACCESSIBILITY_SETTINGS}
        timerDisplaySeconds={56}
        onClose={() => undefined}
        onCancel={() => undefined}
        onPreview={onPreview}
        onSave={() => undefined}
      />,
    )

    await user.click(screen.getByRole("tab", { name: "Font size" }))
    onPreview.mockClear()

    await user.click(screen.getByRole("button", { name: /Huge \(175%\)/ }))

    expect(onPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        fontScale: 1.75,
      }),
    )
  })
})
