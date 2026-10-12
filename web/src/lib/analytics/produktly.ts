export type ProduktlyUserMetadata = Record<string, string | number | boolean | null | undefined>

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
}

declare global {
  interface Window {
    Produktly?: ProduktlyApi
    ProduktlyQ?: unknown[]
  }
}

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
  getProduktly()?.identifyUser(userId, metadata)
}

/** Clear identity on logout so subsequent activity is anonymous. */
export function clearProduktlyUser(): void {
  getProduktly()?.clearCurrentUser()
}
