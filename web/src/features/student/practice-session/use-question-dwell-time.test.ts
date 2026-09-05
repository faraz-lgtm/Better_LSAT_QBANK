import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { useQuestionDwellTime } from "@/features/student/practice-session/use-question-dwell-time"

describe("useQuestionDwellTime", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("accrues pause-aware dwell across revisits", () => {
    const { result, rerender } = renderHook(
      (props: { questionId: string | null; active: boolean; paused: boolean }) =>
        useQuestionDwellTime(props),
      { initialProps: { questionId: "q1", active: true, paused: false } },
    )

    act(() => {
      vi.advanceTimersByTime(4500)
    })
    act(() => {
      rerender({ questionId: "q2", active: true, paused: false })
    })
    expect(result.current.getCumulativeSeconds("q1")).toBe(5)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    act(() => {
      rerender({ questionId: "q2", active: true, paused: true })
    })
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    act(() => {
      rerender({ questionId: "q2", active: true, paused: false })
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.getCumulativeSeconds("q2")).toBe(3)

    act(() => {
      rerender({ questionId: "q1", active: true, paused: false })
    })
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(result.current.getCumulativeSeconds("q1")).toBe(6)
  })

  it("does not accrue while inactive", () => {
    const { result, rerender } = renderHook(
      (props: { questionId: string | null; active: boolean; paused: boolean }) =>
        useQuestionDwellTime(props),
      { initialProps: { questionId: "q1", active: false, paused: false } },
    )

    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(result.current.getCumulativeSeconds("q1")).toBe(0)

    act(() => {
      rerender({ questionId: "q1", active: true, paused: false })
    })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.getCumulativeSeconds("q1")).toBe(2)
  })
})
