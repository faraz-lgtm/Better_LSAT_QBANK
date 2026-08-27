import { useCallback, useEffect, useState } from "react"

export const OFFICIAL_INTERFACE_STORAGE_KEY = "betterlsat.official-interface"

export function readOfficialInterfacePreference(): boolean {
  try {
    return window.localStorage.getItem(OFFICIAL_INTERFACE_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function writeOfficialInterfacePreference(enabled: boolean) {
  try {
    window.localStorage.setItem(OFFICIAL_INTERFACE_STORAGE_KEY, enabled ? "1" : "0")
  } catch {
    // Private mode / blocked storage should not break the exam chrome toggle.
  }
}

export function toggleExamFullscreen() {
  const node = document.querySelector(".practice-session-card")
  if (!(node instanceof HTMLElement)) return
  if (document.fullscreenElement) {
    void document.exitFullscreen()
    return
  }
  void node.requestFullscreen()
}

/** Tracks browser fullscreen so official rail can swap arrows-out / arrows-in. */
export function useExamFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement))

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])

  return { isFullscreen, toggleExamFullscreen }
}

/** Persists the Official Interface exam-chrome toggle across sessions. */
export function useOfficialInterfacePreference() {
  const [officialInterface, setOfficialInterfaceState] = useState(readOfficialInterfacePreference)

  const setOfficialInterface = useCallback((next: boolean) => {
    setOfficialInterfaceState(next)
    writeOfficialInterfacePreference(next)
  }, [])

  return { officialInterface, setOfficialInterface }
}
