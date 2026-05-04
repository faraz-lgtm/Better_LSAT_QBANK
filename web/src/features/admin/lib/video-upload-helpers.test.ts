import { describe, expect, it } from "vitest"

import { fileExtensionForVideoUpload } from "./video-upload-helpers"

describe("fileExtensionForVideoUpload", () => {
  it("uses extension from filename when allowed", () => {
    expect(fileExtensionForVideoUpload(new File([], "clip.MP4", { type: "" }))).toBe("mp4")
  })

  it("falls back to MIME type", () => {
    expect(fileExtensionForVideoUpload(new File([], "x", { type: "video/quicktime" }))).toBe("mov")
  })

  it("defaults to webm", () => {
    expect(fileExtensionForVideoUpload(new File([], "x", { type: "application/octet-stream" }))).toBe("webm")
  })
})
