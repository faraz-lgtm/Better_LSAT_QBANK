import { describe, expect, it } from "vitest"

import { videoUrlSummary } from "./video-url-summary"

describe("videoUrlSummary", () => {
  it("shows empty state", () => {
    expect(videoUrlSummary("")).toBe("No video linked")
  })

  it("parses hostname for URLs", () => {
    expect(videoUrlSummary("https://youtube.com/watch?v=abc")).toContain("youtube.com")
  })
})
