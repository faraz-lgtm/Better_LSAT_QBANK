import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { useResponseMasking } from "@/features/student/practice-session/use-response-masking"

describe("useResponseMasking", () => {
  it("toggles masking mode and individual choices", () => {
    const { result } = renderHook(() => useResponseMasking())

    act(() => {
      result.current.toggleResponseMasking()
    })
    expect(result.current.responseMasking).toBe(true)

    act(() => {
      result.current.toggleChoiceMask(2)
    })
    expect(result.current.maskedChoices[2]).toBe(true)
    expect(result.current.hasMaskedChoices).toBe(true)

    act(() => {
      result.current.resetMaskedChoices()
    })
    expect(result.current.hasMaskedChoices).toBe(false)
  })
})
