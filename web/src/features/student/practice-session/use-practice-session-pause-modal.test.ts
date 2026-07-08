import { describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { usePracticeSessionPauseModal } from "@/features/student/practice-session/use-practice-session-pause-modal"

describe("usePracticeSessionPauseModal", () => {
  it("pauses and opens, then resumes", () => {
    const pauseTimer = vi.fn()
    const resumeTimer = vi.fn()
    const { result } = renderHook(() => usePracticeSessionPauseModal(pauseTimer, resumeTimer))

    act(() => {
      result.current.requestPause()
    })

    expect(pauseTimer).toHaveBeenCalledTimes(1)
    expect(result.current.open).toBe(true)

    act(() => {
      result.current.resume()
    })

    expect(resumeTimer).toHaveBeenCalledTimes(1)
    expect(result.current.open).toBe(false)
  })
})
