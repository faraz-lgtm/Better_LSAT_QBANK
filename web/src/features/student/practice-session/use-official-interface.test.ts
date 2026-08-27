import { renderHook, act } from "@testing-library/react"
import { describe, expect, it, beforeEach } from "vitest"

import {
  OFFICIAL_INTERFACE_STORAGE_KEY,
  useExamFullscreen,
  useOfficialInterfacePreference,
} from "@/features/student/practice-session/use-official-interface"

describe("useOfficialInterfacePreference", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("defaults to off", () => {
    const { result } = renderHook(() => useOfficialInterfacePreference())
    expect(result.current.officialInterface).toBe(false)
  })

  it("persists the official interface preference", () => {
    const { result } = renderHook(() => useOfficialInterfacePreference())

    act(() => {
      result.current.setOfficialInterface(true)
    })

    expect(result.current.officialInterface).toBe(true)
    expect(window.localStorage.getItem(OFFICIAL_INTERFACE_STORAGE_KEY)).toBe("1")
  })
})

describe("useExamFullscreen", () => {
  it("reports fullscreen from the document", () => {
    const { result } = renderHook(() => useExamFullscreen())
    expect(result.current.isFullscreen).toBe(false)
  })
})
