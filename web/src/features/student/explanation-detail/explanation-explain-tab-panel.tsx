import { ChevronUp, Video } from "lucide-react"

import { resolveExplanationVideoPlayback } from "@/features/student/explanation-detail/resolve-explanation-video-playback"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import { cn } from "@/lib/utils"

type ExplanationExplainTabPanelProps = {
  videos: ExplanationQuestionDetailView["videos"]
  /** Review “Video Explanation” — only cards with a video URL; never written HTML. */
  videoOnly?: boolean
}

function hasVideoContent(v: ExplanationQuestionDetailView["videos"][number]): boolean {
  return Boolean(v.videoUrl?.trim())
}

function VideoExplanationCard({
  v,
  hideChrome = false,
}: {
  v: ExplanationQuestionDetailView["videos"][number]
  /** Hide author header, dropdown label, and posted footer — video player only. */
  hideChrome?: boolean
}) {
  const playback = v.videoUrl?.trim() ? resolveExplanationVideoPlayback(v.videoUrl) : null

  return (
    <article className="overflow-hidden rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      {hideChrome ? null : (
        <div
          className={cn(
            "flex items-center justify-between gap-4 border-b px-4 py-4",
            v.headerVariant === "yellow"
              ? "border-[var(--explanation-in-process-bg)] bg-[var(--explanation-in-process-bg)]"
              : "border-[var(--primary-0)] bg-[var(--primary-0)]",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Video className="size-5 shrink-0 text-[var(--primary)]" aria-hidden />
            <span className="text-base font-medium tracking-[0.02em] text-[#1a1b25]">{v.authorTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-medium tracking-[0.02em] text-[var(--primary)]">{v.dropdownLabel}</span>
            <ChevronUp className="size-6 shrink-0 text-[var(--primary)]" aria-hidden />
          </div>
        </div>
      )}

      {playback ? (
        <div className={cn("bg-[var(--greyscale-0)]", hideChrome ? "p-0" : "px-4 py-4")}>
          {playback.kind === "iframe" ? (
            <div
              className={cn(
                "aspect-video w-full overflow-hidden bg-black",
                hideChrome ? "rounded-none" : "rounded-xl",
              )}
            >
              <iframe
                title={v.dropdownLabel || "Explanation video"}
                src={playback.src}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              controls
              className={cn("aspect-video w-full bg-black", hideChrome ? "rounded-none" : "rounded-xl")}
              src={playback.src}
            />
          )}
        </div>
      ) : (
        <div className="flex min-h-[388px] flex-col items-center justify-center bg-[#36394a] px-6 py-10 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white/20">
            <Video className="size-8 text-white" aria-hidden />
          </div>
          <p className="m-0 text-sm font-normal leading-5 text-[#f5f9ff]">No videos available yet</p>
        </div>
      )}

      {!hideChrome && v.postedLine ? (
        <div className="bg-[var(--greyscale-25)] px-4 pb-4 pt-4">
          <p className="m-0 text-xs leading-4 text-[var(--greyscale-500)]">{v.postedLine}</p>
        </div>
      ) : null}
    </article>
  )
}

function ExplanationExplainTabPanel({ videos, videoOnly = false }: ExplanationExplainTabPanelProps) {
  const visible = videoOnly ? videos.filter(hasVideoContent) : videos

  if (visible.length === 0) {
    return (
      <p className="m-0 rounded-[14px] border border-dashed border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-4 py-6 text-center text-sm text-[var(--greyscale-500)]">
        No videos available yet
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {visible.map((v) => (
        <VideoExplanationCard key={v.id} v={v} hideChrome={videoOnly} />
      ))}
    </div>
  )
}

export { ExplanationExplainTabPanel }
