import { useEffect } from "react"

import {
  getDefaultZoomScale,
  getNextZoomScale,
  getPreviousZoomScale,
  resolvePracticeSessionZoomShortcutAction,
} from "@/features/student/practice-session/practice-session-zoom-shortcuts"

function usePracticeSessionZoomShortcuts(
  enabled: boolean,
  zoomScale: number,
  onZoomScaleChange: (zoomScale: number) => void,
) {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
          return
        }
      }

      const action = resolvePracticeSessionZoomShortcutAction(event)
      if (!action) return

      event.preventDefault()

      if (action === "zoom-reset") {
        onZoomScaleChange(getDefaultZoomScale())
        return
      }

      if (action === "zoom-in") {
        onZoomScaleChange(getNextZoomScale(zoomScale))
        return
      }

      onZoomScaleChange(getPreviousZoomScale(zoomScale))
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [enabled, onZoomScaleChange, zoomScale])
}

export { usePracticeSessionZoomShortcuts }
