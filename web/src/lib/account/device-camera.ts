const USER_FACING_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: "user" },
  audio: false,
}

const ANY_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: true,
  audio: false,
}

function resolveMediaDevices(
  mediaDevices?: MediaDevices,
): MediaDevices | undefined {
  if (mediaDevices) return mediaDevices
  return typeof navigator !== "undefined" ? navigator.mediaDevices : undefined
}

/**
 * Returns true when the browser can open a user-facing camera.
 * Probes MediaDevices; stops any temporary stream immediately.
 */
export async function canUseDeviceCamera(
  mediaDevices?: MediaDevices,
): Promise<boolean> {
  try {
    const stream = await openDeviceCamera(mediaDevices)
    stopMediaStream(stream)
    return true
  } catch {
    return false
  }
}

/** Opens a camera stream. Caller must stop the stream when done. */
export async function openDeviceCamera(
  mediaDevices?: MediaDevices,
): Promise<MediaStream> {
  const devices = resolveMediaDevices(mediaDevices)
  if (!devices?.getUserMedia) {
    throw new Error("Camera is not supported in this browser")
  }
  try {
    return await devices.getUserMedia(USER_FACING_CONSTRAINTS)
  } catch {
    // Desktop webcams often reject facingMode; fall back to any video device.
    return await devices.getUserMedia(ANY_CAMERA_CONSTRAINTS)
  }
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return
  for (const track of stream.getTracks()) track.stop()
}

/** Attaches a MediaStream to a video element and starts playback. */
export function attachStreamToVideo(
  video: HTMLVideoElement | null | undefined,
  stream: MediaStream | null | undefined,
): void {
  if (!video) return
  if (!stream) {
    video.srcObject = null
    return
  }
  if (video.srcObject !== stream) {
    video.srcObject = stream
  }
  if (video.paused) {
    void video.play().catch(() => {})
  }
}

/** Captures the current video frame as a JPEG file for upload. */
export async function capturePhotoFromVideo(
  video: HTMLVideoElement,
  options?: { fileName?: string; quality?: number },
): Promise<File> {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) throw new Error("Camera preview is not ready yet")

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not capture photo")
  context.drawImage(video, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("Could not capture photo"))),
      "image/jpeg",
      options?.quality ?? 0.92,
    )
  })

  return new File([blob], options?.fileName ?? `profile-${Date.now()}.jpg`, {
    type: "image/jpeg",
  })
}
