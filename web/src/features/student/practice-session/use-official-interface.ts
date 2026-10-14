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

export const PRACTICE_SESSION_IMMERSIVE_FRAME_SELECTOR =
  "[data-practice-session-immersive-frame]"

/** CSS immersive mode when the browser Fullscreen API is unavailable (iOS / phone DevTools). */
export const EXAM_CSS_FULLSCREEN_CLASS = "exam-session-fullscreen"
export const EXAM_CSS_FULLSCREEN_EVENT = "exam-css-fullscreenchange"

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  webkitRequestFullScreen?: () => Promise<void> | void
}

function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

function isCssFullscreen(): boolean {
  return document.documentElement.classList.contains(EXAM_CSS_FULLSCREEN_CLASS)
}

function setCssFullscreen(on: boolean) {
  document.documentElement.classList.toggle(EXAM_CSS_FULLSCREEN_CLASS, on)
  document.dispatchEvent(new Event(EXAM_CSS_FULLSCREEN_EVENT))
}

function exitNativeFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument
  if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
    return document.exitFullscreen()
  }
  if (doc.webkitFullscreenElement && typeof doc.webkitExitFullscreen === "function") {
    return Promise.resolve(doc.webkitExitFullscreen())
  }
  return Promise.resolve()
}

function requestNativeFullscreen(node: HTMLElement): Promise<void> {
  const el = node as FullscreenElement
  if (typeof el.requestFullscreen === "function") {
    return el.requestFullscreen()
  }
  if (typeof el.webkitRequestFullscreen === "function") {
    return Promise.resolve(el.webkitRequestFullscreen())
  }
  if (typeof el.webkitRequestFullScreen === "function") {
    return Promise.resolve(el.webkitRequestFullScreen())
  }
  return Promise.reject(new Error("Fullscreen API unavailable"))
}

export function toggleExamFullscreen() {
  if (getFullscreenElement()) {
    setCssFullscreen(false)
    void exitNativeFullscreen()
    return
  }

  if (isCssFullscreen()) {
    setCssFullscreen(false)
    return
  }

  const frame = document.querySelector(PRACTICE_SESSION_IMMERSIVE_FRAME_SELECTOR)
  const node = frame instanceof HTMLElement ? frame : document.documentElement

  void requestNativeFullscreen(node).then(
    () => {
      setCssFullscreen(false)
    },
    () => {
      // iPhone / WebKit / DevTools phone: native fullscreen often unavailable — use CSS edge-to-edge.
      setCssFullscreen(true)
    },
  )
}

/** Tracks browser fullscreen (or CSS fallback) so official rail can swap Full Screen / Normal view. */
export function useExamFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => Boolean(getFullscreenElement()) || isCssFullscreen(),
  )

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(getFullscreenElement()) || isCssFullscreen())
    document.addEventListener("fullscreenchange", sync)
    document.addEventListener("webkitfullscreenchange", sync as EventListener)
    document.addEventListener(EXAM_CSS_FULLSCREEN_EVENT, sync)
    return () => {
      document.removeEventListener("fullscreenchange", sync)
      document.removeEventListener("webkitfullscreenchange", sync as EventListener)
      document.removeEventListener(EXAM_CSS_FULLSCREEN_EVENT, sync)
      setCssFullscreen(false)
    }
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
