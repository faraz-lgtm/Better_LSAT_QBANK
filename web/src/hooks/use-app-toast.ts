import { useCallback, useEffect, useState } from "react"

export type AppToastVariant = "error" | "success"

export type AppToastState = {
  message: string
  variant: AppToastVariant
}

export function useAppToast(durationMs = 6000) {
  const [toast, setToast] = useState<AppToastState | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), durationMs)
    return () => window.clearTimeout(timer)
  }, [durationMs, toast])

  const showError = useCallback((message: string) => {
    setToast({ message, variant: "error" })
  }, [])

  const showSuccess = useCallback((message: string) => {
    setToast({ message, variant: "success" })
  }, [])

  const dismiss = useCallback(() => setToast(null), [])

  return { toast, showError, showSuccess, dismiss }
}
