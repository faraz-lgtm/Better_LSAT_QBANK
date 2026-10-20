export type ProduktlyUserMetadata = Record<string, string | number | boolean | null | undefined>

export type StartProduktlyTourParams = {
  tourId: number
  stepIndex?: number
  ignorePublish?: boolean
  respectAllTourSettings?: boolean
  clearProgress?: boolean
  refreshToken?: string | number
}

type ProduktlyApi = {
  identifyUser: (
    userId: string | number,
    metadata?: ProduktlyUserMetadata,
    options?: { hash?: string },
  ) => void
  clearCurrentUser: () => void
  configure: (params: {
    token?: string
    redirect?: (url: string) => void
    waitForUser?: boolean
  }) => void
  startTour?: (params: StartProduktlyTourParams) => void
  openFeedback?: (params: { id: number; ignorePublish?: boolean }) => void
  closeFeedback?: (params: { id: number }) => void
}

declare global {
  interface Window {
    Produktly?: ProduktlyApi
    ProduktlyQ?: unknown[]
  }
}

/** Last identified user — duplicate identify aborts in-flight fetchAll. */
let lastIdentifiedUserId: string | null = null

/** Cancel in-flight startTour retries when a newer start is requested. */
let activeTourStartCancel: (() => void) | null = null

const TOUR_START_MAX_ATTEMPTS = 8
const TOUR_START_RETRY_MS = 250

function getProduktly(): ProduktlyApi | undefined {
  if (typeof window === "undefined") return undefined
  return window.Produktly
}

/** True when Produktly has mounted the product-tour card iframe. */
export function isProduktlyTourCardMounted(): boolean {
  if (typeof document === "undefined") return false
  return Boolean(document.getElementById("produktly-card-iframe"))
}

/** Identify the logged-in user for targeting and progress persistence. */
export function identifyProduktlyUser(
  userId: string,
  metadata?: ProduktlyUserMetadata,
): void {
  if (!userId) return
  // Same user again (auth TOKEN_REFRESHED / Strict Mode) — skip to avoid aborting fetchAll.
  if (lastIdentifiedUserId === userId) return
  lastIdentifiedUserId = userId
  getProduktly()?.identifyUser(userId, metadata)
}

/** Clear identity on logout so subsequent activity is anonymous. */
export function clearProduktlyUser(): void {
  lastIdentifiedUserId = null
  getProduktly()?.clearCurrentUser()
}

/**
 * Start a Produktly product tour by dashboard id.
 * When `clearProgress` is set, also bumps `refreshToken` so a dismissed tour
 * restarts from step 0 instead of being ignored / resumed mid-tour.
 *
 * Retries briefly until the tour card iframe mounts — Produktly often no-ops
 * if identify / available has not finished, or a same-tick SPA navigation
 * cancels the first start.
 */
export function startProduktlyTour(params: StartProduktlyTourParams): void {
  if (!params.tourId) return
  if (typeof window === "undefined") return

  activeTourStartCancel?.()

  let cancelled = false
  let attempt = 0
  let timer: number | null = null

  const cancel = () => {
    cancelled = true
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
    if (activeTourStartCancel === cancel) activeTourStartCancel = null
  }
  activeTourStartCancel = cancel

  const buildPayload = (): StartProduktlyTourParams => {
    if (!params.clearProgress) return params
    // Bump refreshToken on every attempt so a prior dismiss/no-op can re-trigger.
    if (params.refreshToken === undefined || attempt > 1) {
      return { ...params, refreshToken: Date.now() }
    }
    return params
  }

  const schedule = () => {
    if (cancelled) return
    timer = window.setTimeout(run, TOUR_START_RETRY_MS)
  }

  const run = () => {
    if (cancelled) return
    attempt += 1
    getProduktly()?.startTour?.(buildPayload())

    if (isProduktlyTourCardMounted()) {
      cancel()
      return
    }
    if (attempt >= TOUR_START_MAX_ATTEMPTS) {
      cancel()
      return
    }
    schedule()
  }

  run()
}

/** Open a Produktly feedback collector widget by dashboard id. */
export function openProduktlyFeedback(id: number, ignorePublish = true): void {
  if (!id) return
  getProduktly()?.openFeedback?.({ id, ignorePublish })
}

/** Close a Produktly feedback collector widget by dashboard id. */
export function closeProduktlyFeedback(id: number): void {
  if (!id) return
  getProduktly()?.closeFeedback?.({ id })
}
