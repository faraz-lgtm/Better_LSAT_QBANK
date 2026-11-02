import { useMemo, useState } from "react"
import { Check, Copy, Download, Play, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SessionTranscript } from "@/features/tutoring/lib/types"
import { cn } from "@/lib/utils"

type SessionTranscriptViewerProps = {
  transcript: SessionTranscript
  className?: string
}

function SessionTranscriptViewer({ transcript, className }: SessionTranscriptViewerProps) {
  const [activeSegmentId, setActiveSegmentId] = useState(transcript.segments[0]?.id ?? "")
  const [query, setQuery] = useState("")

  const filteredLines = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return transcript.lines
    return transcript.lines.filter(
      (line) => line.text.toLowerCase().includes(q) || line.name.toLowerCase().includes(q),
    )
  }, [query, transcript.lines])

  return (
    <div className={cn("overflow-hidden rounded-[14px] border border-[#e4e9f2]", className)}>
      <div className="flex flex-col gap-3 border-b border-[#e4e9f2] bg-[#f7f9fc] px-[18px] py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.02em] text-[var(--primary)]">SESSION TRANSCRIPT</p>
          <h3 className="mt-1 text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
            {transcript.title}
          </h3>
          <p className="mt-1 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">{transcript.metaLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5 rounded-[10px]">
            <Copy className="size-3.5" aria-hidden />
            Copy
          </Button>
          <Button type="button" size="sm" className="h-10 gap-1.5 rounded-[10px]">
            <Download className="size-3.5" aria-hidden />
            Download
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[277px_1fr]">
        <aside className="border-b border-[#e4e9f2] bg-[#fbfcfe] p-[18px] lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]">Key takeaways</p>
          <ul className="mt-3 space-y-2.5">
            {transcript.takeaways.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-xs tracking-[0.02em] text-[var(--color-student-heading)]"
              >
                <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
            Summary generated from the transcript.
          </p>
        </aside>

        <div className="flex flex-col gap-3.5 p-[18px]">
          <div className="border-b border-[#dfe1e7] pb-1.5 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white"
                aria-label="Play through transcript"
              >
                <Play className="size-3.5 fill-current" aria-hidden />
              </button>
              <div className="relative h-[26px] min-w-0 flex-1">
                <div className="absolute top-[10px] right-0 left-0 h-1.5 rounded-full bg-[#eceff3]" />
                <div className="absolute top-[10px] left-0 h-1.5 w-[8%] rounded-full bg-[var(--primary)]" />
                {transcript.segments.map((segment, index) => {
                  const active = activeSegmentId === segment.id
                  return (
                    <button
                      key={segment.id}
                      type="button"
                      aria-label={`Jump to ${segment.label} (${segment.time})`}
                      onClick={() => setActiveSegmentId(segment.id)}
                      className={cn(
                        "absolute top-1.5 size-3.5 rounded-full border-2",
                        active
                          ? "border-white bg-[var(--primary)]"
                          : "border-[var(--primary)] bg-white",
                      )}
                      style={{ left: `${8 + index * 28}%` }}
                    />
                  )
                })}
              </div>
              <span className="shrink-0 text-[12px] font-semibold text-[var(--greyscale-500)]">
                {transcript.currentTime} / {transcript.totalTime}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {transcript.segments.map((segment) => {
                const active = activeSegmentId === segment.id
                return (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => setActiveSegmentId(segment.id)}
                    className={cn(
                      "min-h-[34px] rounded-full border px-3 py-2 text-[12px] font-semibold",
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[var(--primary-0)] bg-[var(--greyscale-0)] text-[var(--primary)]",
                    )}
                  >
                    <span className="opacity-80">{segment.time}</span> {segment.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--greyscale-500)]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this transcript…"
                className="h-10 rounded-[10px] border-[#d5deec] pl-9"
              />
            </div>
            <span className="shrink-0 text-xs font-bold tracking-[0.02em] text-[var(--greyscale-500)]">
              {filteredLines.length} lines
            </span>
          </div>

          <div className="max-h-[420px] space-y-3.5 overflow-y-auto pr-1">
            {filteredLines.map((line) => (
              <div key={line.id} className="flex gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-2xl text-[10px] font-bold",
                    line.speaker === "tutor"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--primary-25)] text-[var(--primary)]",
                  )}
                >
                  {line.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]">
                      {line.name}
                    </span>
                    <span className="text-[10px] tracking-[0.02em] text-[var(--primary)]">{line.time}</span>
                  </div>
                  <p className="mt-0.5 text-sm tracking-[0.02em] text-[var(--color-student-heading)]">
                    {line.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { SessionTranscriptViewer }
