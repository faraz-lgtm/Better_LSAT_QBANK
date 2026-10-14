import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { STUDENT_DASHBOARD_HREF } from "@/features/app-shell/student-nav-config"
import {
  formatAppErrorDetails,
  getAppErrorCopy,
  markChunkReloadAttempted,
  shouldAutoReloadForChunkError,
} from "@/features/app-shell/app-route-error"
import { captureException } from "@/lib/analytics/posthog"

type AppErrorScreenProps = {
  error: unknown
  /** When true, show stack / message for local debugging. */
  showDetails?: boolean
}

function reloadPage() {
  window.location.reload()
}

function goHome() {
  window.location.assign(STUDENT_DASHBOARD_HREF)
}

function AppErrorScreen({ error, showDetails = import.meta.env.DEV }: AppErrorScreenProps) {
  const copy = getAppErrorCopy(error)
  const details = showDetails ? formatAppErrorDetails(error) : null
  const [autoReloading, setAutoReloading] = useState(() => shouldAutoReloadForChunkError(error))

  useEffect(() => {
    captureException(error, { source: "app_error_screen" })
  }, [error])

  useEffect(() => {
    if (!shouldAutoReloadForChunkError(error)) {
      setAutoReloading(false)
      return
    }
    markChunkReloadAttempted()
    setAutoReloading(true)
    reloadPage()
  }, [error])

  if (autoReloading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--background)] px-6 text-center">
        <p className="text-sm text-[#666d80]">Loading the latest version…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="flex items-center px-6 py-5 sm:px-10">
        <a href={STUDENT_DASHBOARD_HREF} className="flex shrink-0 items-center" aria-label="betterLSAT home">
          <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="h-8 w-auto" />
        </a>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-[#121a26] sm:text-3xl">{copy.title}</h1>
          <p className="text-base leading-relaxed text-[#666d80]">{copy.body}</p>

          <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" className="w-full sm:w-auto" onClick={reloadPage}>
              {copy.primaryLabel}
            </Button>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={goHome}>
              {copy.secondaryLabel}
            </Button>
          </div>

          {details ? (
            <pre
              className="mt-6 max-h-48 w-full overflow-auto rounded-lg bg-[#f5f6f8] p-4 text-left text-xs leading-relaxed text-[#666d80]"
              data-testid="app-error-details"
            >
              {details}
            </pre>
          ) : null}
        </div>
      </main>
    </div>
  )
}

export { AppErrorScreen }
