import { ChevronUp, Video } from "lucide-react"

import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import { HtmlContent } from "@/lib/html/html-content"
import { cn } from "@/lib/utils"

type ExplanationExplainTabPanelProps = {
  videos: ExplanationQuestionDetailView["videos"]
  /** Review “Video Explanation” — only cards with a video URL; never written HTML. */
  videoOnly?: boolean
}

function hasVideoContent(v: ExplanationQuestionDetailView["videos"][number]): boolean {
  return Boolean(v.videoUrl?.trim())
}

function hasWrittenContent(v: ExplanationQuestionDetailView["videos"][number]): boolean {
  return Boolean(v.explanationHtml?.trim())
}

function placeholderMessage(v: ExplanationQuestionDetailView["videos"][number]): string {
  if (hasVideoContent(v)) return "Video explanation available"
  return "Explanation not given"
}

function VideoExplanationCard({
  v,
  videoOnly = false,
}: {
  v: ExplanationQuestionDetailView["videos"][number]
  videoOnly?: boolean
}) {
  const hasVideo = hasVideoContent(v)
  const hasWritten = !videoOnly && hasWrittenContent(v)

  return (
    <article className="overflow-hidden rounded-[14px] border border-[color:var(--greyscale-100)] bg-[var(--greyscale-25)] p-px shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div
        className={cn(
          "flex items-center justify-between gap-4 border-b px-5 py-4",
          v.headerVariant === "yellow"
            ? "border-[#fff6e0] bg-[#fff6e0]"
            : "border-[var(--primary-0)] bg-[var(--primary-0)]",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {!videoOnly ? <Video className="size-5 shrink-0 text-[#0d47a1]" aria-hidden /> : null}
          <span className="text-sm font-medium tracking-[0.02em] text-[#666d80]">{v.authorTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-medium tracking-[0.02em] text-[#0d47a1]">{v.dropdownLabel}</span>
          <ChevronUp className="size-6 shrink-0 text-[#0d47a1]" aria-hidden />
        </div>
      </div>

      {hasVideo ? (
        <div className="bg-white px-4 py-4">
          <video controls className="max-h-[min(50vh,339px)] w-full rounded-xl bg-black" src={v.videoUrl!} />
        </div>
      ) : hasWritten ? (
        <div className="bg-white px-4 py-5 md:px-6">
          <HtmlContent
            html={v.explanationHtml ?? ""}
            className="explanation-detail-body max-w-none text-[#062357]"
          />
        </div>
      ) : (
        <div className="flex min-h-[180px] flex-col items-center justify-center bg-[#f6f8fa] px-6 py-10 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-[10px] bg-[#0d47a1]">
            <Video className="size-6 text-white" aria-hidden />
          </div>
          <p className="m-0 text-sm font-medium leading-5 text-[#062357]">{placeholderMessage(v)}</p>
        </div>
      )}

      {v.postedLine ? (
        <div className="bg-[var(--greyscale-25)] px-4 pt-4 pb-4">
          <p className="m-0 text-xs leading-4 text-[#666d80]">{v.postedLine}</p>
        </div>
      ) : null}
    </article>
  )
}

function ExplanationExplainTabPanel({ videos, videoOnly = false }: ExplanationExplainTabPanelProps) {
  const visible = videos.filter((v) =>
    videoOnly ? hasVideoContent(v) : hasVideoContent(v) || hasWrittenContent(v),
  )
  if (visible.length === 0) {
    return (
      <p className="m-0 rounded-[14px] border border-dashed border-[#dfe1e7] bg-[#f6f8fa] px-4 py-6 text-center text-sm text-[#666d80]">
        {videoOnly ? "No video explanation available yet." : "No explanation available yet."}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      {visible.map((v) => (
        <VideoExplanationCard key={v.id} v={v} videoOnly={videoOnly} />
      ))}
    </div>
  )
}

export { ExplanationExplainTabPanel }
