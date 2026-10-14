import { renderHook, act } from "@testing-library/react"
import { describe, expect, it, beforeEach, vi } from "vitest"

import {
  EXAM_CSS_FULLSCREEN_CLASS,
  OFFICIAL_INTERFACE_STORAGE_KEY,
  PRACTICE_SESSION_IMMERSIVE_FRAME_SELECTOR,
  toggleExamFullscreen,
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
  beforeEach(() => {
    document.documentElement.classList.remove(EXAM_CSS_FULLSCREEN_CLASS)
  })

  it("reports fullscreen from the document", () => {
    const { result } = renderHook(() => useExamFullscreen())
    expect(result.current.isFullscreen).toBe(false)
  })

  it("fullscreens the immersive frame so the exam card can keep its max-width cap", async () => {
    const frame = document.createElement("div")
    frame.setAttribute("data-practice-session-immersive-frame", "")
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    frame.requestFullscreen = requestFullscreen
    document.body.append(frame)

    toggleExamFullscreen()

    expect(PRACTICE_SESSION_IMMERSIVE_FRAME_SELECTOR).toBe("[data-practice-session-immersive-frame]")
    expect(requestFullscreen).toHaveBeenCalledOnce()
    await Promise.resolve()
    expect(document.documentElement.classList.contains(EXAM_CSS_FULLSCREEN_CLASS)).toBe(false)

    frame.remove()
  })

  it("falls back to CSS edge-to-edge when the Fullscreen API rejects", async () => {
    const frame = document.createElement("div")
    frame.setAttribute("data-practice-session-immersive-frame", "")
    frame.requestFullscreen = vi.fn().mockRejectedValue(new Error("blocked"))
    document.body.append(frame)

    const { result } = renderHook(() => useExamFullscreen())
    expect(result.current.isFullscreen).toBe(false)

    await act(async () => {
      toggleExamFullscreen()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(document.documentElement.classList.contains(EXAM_CSS_FULLSCREEN_CLASS)).toBe(true)
    expect(result.current.isFullscreen).toBe(true)

    await act(async () => {
      toggleExamFullscreen()
    })

    expect(document.documentElement.classList.contains(EXAM_CSS_FULLSCREEN_CLASS)).toBe(false)
    expect(result.current.isFullscreen).toBe(false)

    frame.remove()
  })
})
