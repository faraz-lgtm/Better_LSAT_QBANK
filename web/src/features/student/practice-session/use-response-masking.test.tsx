import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"

import {
  ResponseMaskingProvider,
  useResponseMasking,
} from "@/features/student/practice-session/use-response-masking"

function wrapper({ children }: { children: ReactNode }) {
  return <ResponseMaskingProvider>{children}</ResponseMaskingProvider>
}

describe("useResponseMasking", () => {
  it("engages masking mode, then toggles individual choices", () => {
    const { result } = renderHook(() => useResponseMasking("q1"), { wrapper })

    act(() => {
      result.current.toggleResponseMasking()
    })
    expect(result.current.responseMasking).toBe(true)

    act(() => {
      result.current.toggleChoiceMask(2)
    })
    expect(result.current.maskedChoices[2]).toBe(true)
    expect(result.current.hasMaskedChoices).toBe(true)
  })

  it("keeps masking mode on across questions and isolates masks per question", () => {
    const { result, rerender } = renderHook(({ id }: { id: string }) => useResponseMasking(id), {
      wrapper,
      initialProps: { id: "q1" },
    })

    act(() => {
      result.current.toggleResponseMasking()
      result.current.toggleChoiceMask(1)
    })

    rerender({ id: "q2" })
    expect(result.current.responseMasking).toBe(true)
    expect(result.current.hasMaskedChoices).toBe(false)

    rerender({ id: "q1" })
    expect(result.current.maskedChoices[1]).toBe(true)
  })

  it("Reset Response clears masks for the current question only and leaves the tool on", () => {
    const { result, rerender } = renderHook(({ id }: { id: string }) => useResponseMasking(id), {
      wrapper,
      initialProps: { id: "q1" },
    })

    act(() => {
      result.current.toggleResponseMasking()
      result.current.toggleChoiceMask(0)
    })
    rerender({ id: "q2" })
    act(() => {
      result.current.toggleChoiceMask(3)
    })
    rerender({ id: "q1" })
    act(() => {
      result.current.resetMaskedChoices()
    })

    expect(result.current.responseMasking).toBe(true)
    expect(result.current.hasMaskedChoices).toBe(false)

    rerender({ id: "q2" })
    expect(result.current.maskedChoices[3]).toBe(true)
  })
})
