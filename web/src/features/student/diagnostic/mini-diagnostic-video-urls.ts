import type { DiagnosticVideoUrl, MiniDiagnosticExplanation } from "@/lib/api/diagnostic"

type VideoUrlLike = MiniDiagnosticExplanation | DiagnosticVideoUrl | Record<string, unknown>

function readSourceItemId(row: VideoUrlLike): string {
  if (typeof (row as { sourceItemId?: unknown }).sourceItemId === "string") {
    return (row as { sourceItemId: string }).sourceItemId
  }
  if (typeof (row as { source_item_id?: unknown }).source_item_id === "string") {
    return (row as { source_item_id: string }).source_item_id
  }
  return ""
}

function readVideoUrl(row: VideoUrlLike): string {
  const camel = (row as { videoUrl?: unknown }).videoUrl
  if (typeof camel === "string" && camel.trim()) return camel.trim()
  const snake = (row as { video_url?: unknown }).video_url
  if (typeof snake === "string" && snake.trim()) return snake.trim()
  return ""
}

/** Collect non-empty video URLs keyed by `sourceItemId` (supports camelCase or snake_case). */
export function collectMiniDiagnosticVideoUrls(
  explanations: ReadonlyArray<VideoUrlLike>,
  extraVideoUrls: ReadonlyArray<VideoUrlLike> = [],
): Map<string, string> {
  const next = new Map<string, string>()
  for (const row of [...explanations, ...extraVideoUrls]) {
    const sourceItemId = readSourceItemId(row)
    const url = readVideoUrl(row)
    if (sourceItemId && url) next.set(sourceItemId, url)
  }
  return next
}
