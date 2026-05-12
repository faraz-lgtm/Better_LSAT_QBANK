import { useState } from "react"
import { FolderOpen, Video } from "lucide-react"

import { Select } from "@/components/ui/select"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"

type ExplanationExplainTabPanelProps = {
  videos: ExplanationQuestionDetailView["videos"]
}

function VideoExplanationCard({ v }: { v: ExplanationQuestionDetailView["videos"][number] }) {
  const [variant, setVariant] = useState(v.dropdownOptions[0]?.value ?? "")
  return (
    <article className="overflow-hidden rounded-2xl border border-[color:var(--greyscale-100)] bg-white shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f6] px-4 py-3 md:px-5 ${
          v.headerVariant === "yellow" ? "bg-[var(--lr-row)]" : "bg-white"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <FolderOpen className="size-5 shrink-0 text-[color:var(--color-student-accent)]" aria-hidden />
          <span className="font-semibold text-[color:var(--color-student-heading)]">{v.authorTitle}</span>
        </div>
        <div className="w-full min-w-[200px] max-w-xs sm:w-56">
          <Select
            aria-label={v.dropdownLabel}
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            options={v.dropdownOptions}
            className="h-10 rounded-xl border-[color:var(--greyscale-100)] text-sm font-medium text-[color:var(--color-student-heading)]"
          />
        </div>
      </div>
      <div className="p-4 md:p-5">
        <div className="mb-3 flex min-h-[280px] flex-col items-center justify-center rounded-xl bg-[#3f4654] text-center text-white">
          <Video className="mb-3 size-12 opacity-90" aria-hidden />
          <p className="text-sm font-medium text-slate-200">Video explanation will load</p>
        </div>
        <p className="mt-3 text-xs text-[color:var(--text)]">{v.postedLine}</p>
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
