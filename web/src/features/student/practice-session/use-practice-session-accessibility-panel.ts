import { useCallback, useRef, useState } from "react"

import type { PracticeSessionAccessibilitySettings } from "@/features/student/practice-session/practice-session-accessibility"

function usePracticeSessionAccessibilityPanel(
  settings: PracticeSessionAccessibilitySettings,
  applySettings: (settings: PracticeSessionAccessibilitySettings) => void,
) {
  const [open, setOpen] = useState(false)
  const snapshotRef = useRef(settings)

  const openPanel = useCallback(() => {
    snapshotRef.current = settings
    setOpen(true)
  }, [settings])

  const closePanel = useCallback(() => {
    setOpen(false)
  }, [])

  const previewSettings = useCallback(
    (next: PracticeSessionAccessibilitySettings) => {
      applySettings(next)
    },
    [applySettings],
  )

  const cancelPanel = useCallback(() => {
    applySettings(snapshotRef.current)
  }, [applySettings])

  const saveSettings = useCallback(
    (next: PracticeSessionAccessibilitySettings) => {
      snapshotRef.current = next
      applySettings(next)
      setOpen(false)
    },
    [applySettings],
  )

  return {
    open,
    openPanel,
    closePanel,
    previewSettings,
    cancelPanel,
    saveSettings,
  }
}

export { usePracticeSessionAccessibilityPanel }
