import { ChevronUp, Video } from "lucide-react"

import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import { HtmlContent } from "@/lib/html/html-content"
import { cn } from "@/lib/utils"

type ExplanationExplainTabPanelProps = {
  videos: ExplanationQuestionDetailView["videos"]
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

function VideoExplanationCard({ v }: { v: ExplanationQuestionDetailView["videos"][number] }) {
  const hasVideo = hasVideoContent(v)
  const hasWritten = hasWrittenContent(v)

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
          <Video className="size-5 shrink-0 text-[#0d47a1]" aria-hidden />
          <span className="text-base font-medium tracking-[0.02em] text-[#1a1b25]">{v.authorTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-medium tracking-[0.02em] text-[#0d47a1]">{v.dropdownLabel}</span>
          <ChevronUp className="size-6 shrink-0 text-[#818898]" aria-hidden />
        </div>
      </div>

      {hasVideo ? (
        <div className="bg-[#36394a] px-6 py-6">
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
        <div className="flex min-h-[339px] flex-col items-center justify-center bg-[#36394a] px-6 py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white/20">
            <Video className="size-8 text-white" aria-hidden />
          </div>
          <p className="text-sm font-normal leading-5 text-[#f5f9ff]">{placeholderMessage(v)}</p>
        </div>
      )}

      <div className="bg-[var(--greyscale-25)] px-4 pt-4 pb-4">
        <p className="m-0 text-xs leading-4 text-[#666d80]">{v.postedLine || "—"}</p>
      </div>
    </article>
  )
}

function ExplanationExplainTabPanel({ videos }: ExplanationExplainTabPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      {videos.map((v) => (
        <VideoExplanationCard key={v.id} v={v} />
      ))}
    </div>
  )
}

export { ExplanationExplainTabPanel }
