import { isRouteErrorResponse, useRouteError } from "react-router-dom"

import { AppErrorScreen } from "@/features/app-shell/app-error-screen"

function resolveRouteError(error: unknown): unknown {
  if (isRouteErrorResponse(error)) {
    return new Error(error.statusText || `Request failed (${error.status})`)
  }
  return error
}

/** React Router `errorElement` — replaces the default “Unexpected Application Error!” screen. */
function AppRouteErrorPage() {
  const error = resolveRouteError(useRouteError())
  return <AppErrorScreen error={error} />
}

export { AppRouteErrorPage }
