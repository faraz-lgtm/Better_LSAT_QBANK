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

function getProduktly(): ProduktlyApi | undefined {
  if (typeof window === "undefined") return undefined
  return window.Produktly
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
 */
export function startProduktlyTour(params: StartProduktlyTourParams): void {
  if (!params.tourId) return
  const payload =
    params.clearProgress && params.refreshToken === undefined
      ? { ...params, refreshToken: Date.now() }
      : params
  getProduktly()?.startTour?.(payload)
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
