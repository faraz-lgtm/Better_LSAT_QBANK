import { describe, expect, it, beforeEach, afterEach } from "vitest"

import { THEME_STORAGE_KEY } from "@/features/theme/theme-provider"

describe("theme storage key", () => {
  beforeEach(() => {
    window.localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.classList.remove("dark")
  })

  afterEach(() => {
    window.localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.classList.remove("dark")
  })

  it("uses a stable localStorage key", () => {
    expect(THEME_STORAGE_KEY).toBe("betterlsat.theme")
  })
})
