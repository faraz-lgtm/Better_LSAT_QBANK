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

  it("defaults to official on", () => {
    const { result } = renderHook(() => useOfficialInterfacePreference())
    expect(result.current.officialInterface).toBe(true)
  })

  it("honors an explicit BetterLSAT (official off) preference", () => {
    window.localStorage.setItem(OFFICIAL_INTERFACE_STORAGE_KEY, "0")
    const { result } = renderHook(() => useOfficialInterfacePreference())
    expect(result.current.officialInterface).toBe(false)
  })

  it("persists the official interface preference", () => {
    const { result } = renderHook(() => useOfficialInterfacePreference())

    act(() => {
      result.current.setOfficialInterface(false)
    })

    expect(result.current.officialInterface).toBe(false)
    expect(window.localStorage.getItem(OFFICIAL_INTERFACE_STORAGE_KEY)).toBe("0")
  })
})

describe("useExamFullscreen", () => {
  it("reports fullscreen from the document", () => {
    const { result } = renderHook(() => useExamFullscreen())
    expect(result.current.isFullscreen).toBe(false)
  })
})
