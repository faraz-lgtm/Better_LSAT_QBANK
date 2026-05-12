const ALLOWED = new Set(["webm", "mp4", "mov", "m4v", "mkv"])

/** Picks an extension accepted by `admin-reserve-question-video-upload` for storage path + MIME. */
export function fileExtensionForVideoUpload(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : undefined
  if (fromName && ALLOWED.has(fromName)) return fromName
  if (file.type === "video/webm") return "webm"
  if (file.type === "video/mp4") return "mp4"
  if (file.type === "video/quicktime") return "mov"
  if (file.type === "video/x-matroska") return "mkv"
  return "webm"
}
