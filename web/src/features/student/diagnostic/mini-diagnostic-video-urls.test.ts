import { describe, expect, it } from "vitest"

import { collectMiniDiagnosticVideoUrls } from "./mini-diagnostic-video-urls"

describe("collectMiniDiagnosticVideoUrls", () => {
  it("keeps only rows with a video url", () => {
    const map = collectMiniDiagnosticVideoUrls([
      {
        sourceItemId: "mini-diag-q1",
        videoUrl: "https://gumlet.tv/watch/abc/",
      },
      {
        sourceItemId: "mini-diag-q2",
        videoUrl: null,
      },
    ])
    expect(map.get("mini-diag-q1")).toBe("https://gumlet.tv/watch/abc/")
    expect(map.has("mini-diag-q2")).toBe(false)
  })

  it("merges dedicated videoUrls (mini + section) over explanation rows", () => {
    const map = collectMiniDiagnosticVideoUrls(
      [{ sourceItemId: "mini-diag-q1", videoUrl: "https://gumlet.tv/watch/mini/" }],
      [
        { sourceItemId: "section-diag-q1", videoUrl: "https://gumlet.tv/watch/sec/" },
        { sourceItemId: "mini-diag-q1", videoUrl: "https://gumlet.tv/watch/mini-updated/" },
      ],
    )
    expect(map.get("mini-diag-q1")).toBe("https://gumlet.tv/watch/mini-updated/")
    expect(map.get("section-diag-q1")).toBe("https://gumlet.tv/watch/sec/")
  })

  it("accepts snake_case video_url from older payloads", () => {
    const map = collectMiniDiagnosticVideoUrls([
      {
        source_item_id: "mini-diag-q1",
        video_url: "https://gumlet.tv/watch/xyz/",
      },
    ])
    expect(map.get("mini-diag-q1")).toBe("https://gumlet.tv/watch/xyz/")
  })
})
