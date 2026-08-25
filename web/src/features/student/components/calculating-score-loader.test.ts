import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { useCalculatingScoreReveal } from "@/features/student/components/calculating-score-loader"

describe("useCalculatingScoreReveal", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("waits for both data readiness and the minimum buffer", () => {
    const { result, rerender } = renderHook(
      ({ ready }) =>
        useCalculatingScoreReveal({
          dataReady: ready,
          resetKey: "session-1",
          minMs: 1000,
        }),
      { initialProps: { ready: false } },
    )

    expect(result.current).toBe(false)

    rerender({ ready: true })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(999)
    })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  it("resets the buffer when the reset key changes", () => {
    const { result, rerender } = renderHook(
      ({ key, ready }) =>
        useCalculatingScoreReveal({
          dataReady: ready,
          resetKey: key,
          minMs: 500,
        }),
      { initialProps: { key: "a", ready: true } },
    )

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe(true)

    rerender({ key: "b", ready: true })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe(true)
  })
})
