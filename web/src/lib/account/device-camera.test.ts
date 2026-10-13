import { afterEach, describe, expect, it, vi } from "vitest"

import {
  attachStreamToVideo,
  canUseDeviceCamera,
  capturePhotoFromVideo,
  openDeviceCamera,
  stopMediaStream,
} from "./device-camera"

describe("device-camera", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("canUseDeviceCamera returns false when MediaDevices is unavailable", async () => {
    await expect(canUseDeviceCamera(undefined)).resolves.toBe(false)
  })

  it("openDeviceCamera requests a user-facing video stream", async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream
    const mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(stream),
    } as unknown as MediaDevices

    await expect(openDeviceCamera(mediaDevices)).resolves.toBe(stream)
    expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "user" },
      audio: false,
    })
  })

  it("openDeviceCamera falls back to any camera when facingMode fails", async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream
    const mediaDevices = {
      getUserMedia: vi
        .fn()
        .mockRejectedValueOnce(new Error("OverconstrainedError"))
        .mockResolvedValueOnce(stream),
    } as unknown as MediaDevices

    await expect(openDeviceCamera(mediaDevices)).resolves.toBe(stream)
    expect(mediaDevices.getUserMedia).toHaveBeenNthCalledWith(2, {
      video: true,
      audio: false,
    })
  })

  it("canUseDeviceCamera returns true after a successful probe and stops tracks", async () => {
    const stop = vi.fn()
    const mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop }],
      }),
    } as unknown as MediaDevices

    await expect(canUseDeviceCamera(mediaDevices)).resolves.toBe(true)
    expect(stop).toHaveBeenCalledOnce()
  })

  it("canUseDeviceCamera returns false when getUserMedia fails", async () => {
    const mediaDevices = {
      getUserMedia: vi.fn().mockRejectedValue(new Error("NotFoundError")),
    } as unknown as MediaDevices

    await expect(canUseDeviceCamera(mediaDevices)).resolves.toBe(false)
  })

  it("stopMediaStream stops every track", () => {
    const stopA = vi.fn()
    const stopB = vi.fn()
    stopMediaStream({
      getTracks: () => [{ stop: stopA }, { stop: stopB }],
    } as unknown as MediaStream)
    expect(stopA).toHaveBeenCalledOnce()
    expect(stopB).toHaveBeenCalledOnce()
  })

  it("attachStreamToVideo sets srcObject and plays", () => {
    const play = vi.fn().mockResolvedValue(undefined)
    const video = {
      srcObject: null,
      paused: true,
      play,
    } as unknown as HTMLVideoElement
    const stream = { id: "s1" } as unknown as MediaStream

    attachStreamToVideo(video, stream)
    expect(video.srcObject).toBe(stream)
    expect(play).toHaveBeenCalledOnce()
  })

  it("capturePhotoFromVideo draws the frame into a jpeg file", async () => {
    const drawImage = vi.fn()
    const toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(["jpeg-bytes"], { type: "image/jpeg" }))
    })
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage }),
          toBlob,
        } as unknown as HTMLCanvasElement
      }
      return document.createElement(tagName)
    })

    const video = {
      videoWidth: 640,
      videoHeight: 480,
    } as HTMLVideoElement

    const file = await capturePhotoFromVideo(video, { fileName: "profile.jpg" })
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe("profile.jpg")
    expect(file.type).toBe("image/jpeg")
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480)
  })

  it("capturePhotoFromVideo rejects when preview has no dimensions", async () => {
    const video = { videoWidth: 0, videoHeight: 0 } as HTMLVideoElement
    await expect(capturePhotoFromVideo(video)).rejects.toThrow("Camera preview is not ready yet")
  })
})
