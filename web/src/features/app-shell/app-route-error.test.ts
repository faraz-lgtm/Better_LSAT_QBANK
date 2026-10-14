import { afterEach, describe, expect, it } from "vitest"

import {
  CHUNK_LOAD_RELOAD_KEY,
  clearChunkReloadAttempt,
  formatAppErrorDetails,
  getAppErrorCopy,
  isChunkLoadError,
  markChunkReloadAttempted,
  shouldAutoReloadForChunkError,
} from "./app-route-error"

describe("isChunkLoadError", () => {
  it("detects failed dynamic import messages", () => {
    expect(
      isChunkLoadError(
        new TypeError(
          "Failed to fetch dynamically imported module: https://app.betterlsat.com/assets/guest-diagnostic-results-page-1eKagq_U.js",
        ),
      ),
    ).toBe(true)
  })

  it("detects vite / webpack chunk load variants", () => {
    expect(isChunkLoadError(new Error("error loading dynamically imported module"))).toBe(true)
    expect(isChunkLoadError(new Error("Loading chunk guest-diagnostic-results-page failed"))).toBe(true)
    expect(isChunkLoadError(new Error("ChunkLoadError: Loading chunk 3 failed"))).toBe(true)
  })

  it("returns false for unrelated errors", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})

describe("getAppErrorCopy", () => {
  it("uses update copy for chunk load failures", () => {
    const copy = getAppErrorCopy(new Error("Failed to fetch dynamically imported module: x.js"))
    expect(copy.title).toBe("Update available")
    expect(copy.primaryLabel).toBe("Reload page")
  })

  it("uses generic copy otherwise", () => {
    const copy = getAppErrorCopy(new Error("boom"))
    expect(copy.title).toBe("Something went wrong")
    expect(copy.primaryLabel).toBe("Try again")
  })
})

describe("chunk reload helpers", () => {
  const data = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return data.size
    },
    clear() {
      data.clear()
    },
    getItem(key: string) {
      return data.get(key) ?? null
    },
    key(index: number) {
      return [...data.keys()][index] ?? null
    },
    removeItem(key: string) {
      data.delete(key)
    },
    setItem(key: string, value: string) {
      data.set(key, value)
    },
  }

  afterEach(() => {
    data.clear()
  })

  it("auto-reloads once for chunk errors", () => {
    const err = new Error("Failed to fetch dynamically imported module: x.js")
    expect(shouldAutoReloadForChunkError(err, storage)).toBe(true)
    markChunkReloadAttempted(storage)
    expect(storage.getItem(CHUNK_LOAD_RELOAD_KEY)).toBe("1")
    expect(shouldAutoReloadForChunkError(err, storage)).toBe(false)
    clearChunkReloadAttempt(storage)
    expect(shouldAutoReloadForChunkError(err, storage)).toBe(true)
  })

  it("does not auto-reload for generic errors", () => {
    expect(shouldAutoReloadForChunkError(new Error("boom"), storage)).toBe(false)
  })
})

describe("formatAppErrorDetails", () => {
  it("formats Error instances", () => {
    const details = formatAppErrorDetails(new Error("boom"))
    expect(details).toContain("boom")
  })

  it("returns null for empty values", () => {
    expect(formatAppErrorDetails(null)).toBeNull()
  })
})
