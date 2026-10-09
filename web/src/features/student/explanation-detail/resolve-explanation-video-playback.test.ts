import { describe, expect, it } from "vitest"

import { resolveExplanationVideoPlayback } from "./resolve-explanation-video-playback"

describe("resolveExplanationVideoPlayback", () => {
  it("returns null for blank input", () => {
    expect(resolveExplanationVideoPlayback("")).toBeNull()
    expect(resolveExplanationVideoPlayback("   ")).toBeNull()
  })

  it("maps Gumlet watch pages to play.gumlet.io embeds", () => {
    expect(
      resolveExplanationVideoPlayback("https://gumlet.tv/watch/6ac7f1fe2b2e8222c6c6e72d/"),
    ).toEqual({
      kind: "iframe",
      src: "https://play.gumlet.io/embed/6ac7f1fe2b2e8222c6c6e72d",
    })
  })

  it("keeps Gumlet embed URLs as iframe", () => {
    expect(
      resolveExplanationVideoPlayback("https://play.gumlet.io/embed/6ac7f1fe2b2e8222c6c6e72d"),
    ).toEqual({
      kind: "iframe",
      src: "https://play.gumlet.io/embed/6ac7f1fe2b2e8222c6c6e72d",
    })
  })

  it("maps YouTube watch URLs to embed", () => {
    expect(resolveExplanationVideoPlayback("https://www.youtube.com/watch?v=abc123XYZ")).toEqual({
      kind: "iframe",
      src: "https://www.youtube.com/embed/abc123XYZ",
    })
  })

  it("uses native video for direct file URLs", () => {
    expect(resolveExplanationVideoPlayback("https://cdn.example.com/v.mp4")).toEqual({
      kind: "file",
      src: "https://cdn.example.com/v.mp4",
    })
  })
})
