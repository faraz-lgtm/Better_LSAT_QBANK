import { useCallback, useEffect, useState } from "react"

export const OFFICIAL_INTERFACE_STORAGE_KEY = "betterlsat.official-interface"

export function readOfficialInterfacePreference(): boolean {
  try {
    const stored = window.localStorage.getItem(OFFICIAL_INTERFACE_STORAGE_KEY)
    // Missing key → official (product default). Only an explicit "0" opts into BetterLSAT.
    return stored !== "0"
  } catch {
    return true
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

/** Persists official vs BetterLSAT exam chrome. Official is the default. */
export function useOfficialInterfacePreference() {
  const [officialInterface, setOfficialInterfaceState] = useState(readOfficialInterfacePreference)

  const setOfficialInterface = useCallback((next: boolean) => {
    setOfficialInterfaceState(next)
    writeOfficialInterfacePreference(next)
  }, [])

  return { officialInterface, setOfficialInterface }
}
