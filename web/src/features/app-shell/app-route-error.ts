/** sessionStorage flag so a stale deploy only triggers one automatic reload. */
export const CHUNK_LOAD_RELOAD_KEY = "blsat:chunk-reload"

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return ""
}

/**
 * True when a lazy route chunk failed to load (common after a new deploy
 * invalidates hashed assets still referenced by an open tab).
 */
export function isChunkLoadError(error: unknown): boolean {
  const message = errorMessage(error)
  if (!message) return false

  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  )
}

export type AppErrorCopy = {
  title: string
  body: string
  primaryLabel: string
  secondaryLabel: string
}

export function getAppErrorCopy(error: unknown): AppErrorCopy {
  if (isChunkLoadError(error)) {
    return {
      title: "Update available",
      body: "BetterLSAT was updated while this page was open. Reload to continue where you left off.",
      primaryLabel: "Reload page",
      secondaryLabel: "Go to dashboard",
    }
  }

  return {
    title: "Something went wrong",
    body: "We hit an unexpected error loading this page. Try again, or head back to your dashboard.",
    primaryLabel: "Try again",
    secondaryLabel: "Go to dashboard",
  }
}

export function shouldAutoReloadForChunkError(error: unknown, storage: Storage = sessionStorage): boolean {
  if (!isChunkLoadError(error)) return false
  if (storage.getItem(CHUNK_LOAD_RELOAD_KEY) === "1") return false
  return true
}

export function markChunkReloadAttempted(storage: Storage = sessionStorage): void {
  storage.setItem(CHUNK_LOAD_RELOAD_KEY, "1")
}

export function clearChunkReloadAttempt(storage: Storage = sessionStorage): void {
  storage.removeItem(CHUNK_LOAD_RELOAD_KEY)
}

export function formatAppErrorDetails(error: unknown): string | null {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`
  }
  if (typeof error === "string" && error.trim()) return error
  return null
}
