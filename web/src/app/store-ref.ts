type AppStoreInstance = {
  getState: () => unknown
  dispatch: (action: unknown) => unknown
}

let storeRef: AppStoreInstance | null = null

/** Called once from store.ts after configureStore — breaks import cycles. */
export function registerAppStore(next: AppStoreInstance): void {
  storeRef = next
}

export function getAppStore(): AppStoreInstance {
  if (!storeRef) {
    throw new Error("App store has not been registered yet")
  }
  return storeRef
}
