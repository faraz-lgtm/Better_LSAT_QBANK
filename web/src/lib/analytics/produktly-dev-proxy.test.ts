import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("installProduktlyDevProxy", () => {
  const originalFetch = window.fetch

  beforeEach(() => {
    vi.resetModules()
    window.fetch = originalFetch
  })

  afterEach(() => {
    window.fetch = originalFetch
    vi.unstubAllEnvs()
  })

  it("rewrites api.produktly.com fetch URLs through the Vite proxy in DEV", async () => {
    vi.stubEnv("DEV", true)
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    window.fetch = fetchMock

    await import("./produktly-dev-proxy")

    await window.fetch("https://api.produktly.com/api/client/available", {
      method: "POST",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/__produktly_api/api/client/available",
      expect.objectContaining({ method: "POST" }),
    )
  })
})
