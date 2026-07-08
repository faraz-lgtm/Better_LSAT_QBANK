import { useCallback, useState } from "react"

function usePracticeSessionPauseModal(
  pauseTimer: () => void,
  resumeTimer: () => void,
) {
  const [open, setOpen] = useState(false)

  const requestPause = useCallback(() => {
    pauseTimer()
    setOpen(true)
  }, [pauseTimer])

  const resume = useCallback(() => {
    resumeTimer()
    setOpen(false)
  }, [resumeTimer])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  return {
    open,
    requestPause,
    resume,
    close,
  }
}

export { usePracticeSessionPauseModal }
