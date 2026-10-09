import { describe, expect, it, vi } from "vitest"

import { fetchGumletCssAspectRatio } from "./fetch-gumlet-aspect-ratio"

describe("fetchGumletCssAspectRatio", () => {
  it("returns null for non-Gumlet URLs", async () => {
    expect(await fetchGumletCssAspectRatio("https://cdn.example.com/v.mp4")).toBeNull()
  })

  it("maps oembed width/height to CSS ratio", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ width: 800, height: 392 }),
    })
    await expect(
      fetchGumletCssAspectRatio("https://gumlet.tv/watch/abc/", fetchFn as unknown as typeof fetch),
    ).resolves.toBe("800 / 392")
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.gumlet.com/v1/oembed?url=https%3A%2F%2Fplay.gumlet.io%2Fembed%2Fabc&format=json",
    )
  })

  it("returns null when oembed fails", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false })
    await expect(
      fetchGumletCssAspectRatio(
        "https://play.gumlet.io/embed/abc",
        fetchFn as unknown as typeof fetch,
      ),
    ).resolves.toBeNull()
  })
})
