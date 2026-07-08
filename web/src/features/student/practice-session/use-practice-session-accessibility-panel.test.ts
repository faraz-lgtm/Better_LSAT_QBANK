import { describe, expect, it, vi } from "vitest"

import { act, renderHook } from "@testing-library/react"

import { DEFAULT_ACCESSIBILITY_SETTINGS } from "@/features/student/practice-session/practice-session-accessibility"
import { usePracticeSessionAccessibilityPanel } from "@/features/student/practice-session/use-practice-session-accessibility-panel"

describe("usePracticeSessionAccessibilityPanel", () => {
  it("previews live and restores on cancel", () => {
    const applySettings = vi.fn()
    const { result } = renderHook(() =>
      usePracticeSessionAccessibilityPanel(DEFAULT_ACCESSIBILITY_SETTINGS, applySettings),
    )

    act(() => {
      result.current.openPanel()
    })

    const preview = {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      colorScheme: "white-on-black" as const,
    }

    act(() => {
      result.current.previewSettings(preview)
    })

    expect(applySettings).toHaveBeenCalledWith(preview)

    act(() => {
      result.current.cancelPanel()
    })

    expect(applySettings).toHaveBeenLastCalledWith(DEFAULT_ACCESSIBILITY_SETTINGS)
  })
})
