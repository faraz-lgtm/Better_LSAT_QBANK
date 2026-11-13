import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Copy, Download, Pause, Play, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SessionTranscript } from "@/features/tutoring/lib/types"
import { cn } from "@/lib/utils"

type SessionTranscriptViewerProps = {
  transcript: SessionTranscript
  className?: string
}

function parseClockToSeconds(time: string): number {
  const parts = time.trim().split(":").map((part) => Number(part))
  if (parts.some((n) => Number.isNaN(n))) return 0
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!
  return parts[0] ?? 0
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (hh > 0) {
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
  }
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
}

function formatTranscriptPlainText(transcript: SessionTranscript): string {
  const sections: string[] = [transcript.title]
  if (transcript.metaLabel.trim()) sections.push(transcript.metaLabel)

  if (transcript.takeaways.length > 0) {
    sections.push("")
    sections.push("Key takeaways:")
    for (const item of transcript.takeaways) {
      sections.push(`- ${item}`)
    }
  }

  if (transcript.lines.length > 0) {
    sections.push("")
    sections.push("Transcript:")
    for (const line of transcript.lines) {
      sections.push(`[${line.time}] ${line.name}: ${line.text}`)
    }
  }

  return sections.join("\n")
}

function transcriptDownloadFilename(title: string, sessionId: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `${slug || `session-${sessionId}`}-transcript.txt`
}

function SessionTranscriptViewer({ transcript, className }: SessionTranscriptViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const copiedResetRef = useRef<number | null>(null)
  const [activeSegmentId, setActiveSegmentId] = useState(transcript.segments[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [playing, setPlaying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentSeconds, setCurrentSeconds] = useState(() =>
    parseClockToSeconds(transcript.currentTime || "00:00"),
  )
  const [durationSeconds, setDurationSeconds] = useState(() =>
    parseClockToSeconds(transcript.totalTime || "00:00"),
  )
  const plainText = useMemo(() => formatTranscriptPlainText(transcript), [transcript])

  const filteredLines = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return transcript.lines
    return transcript.lines.filter(
      (line) => line.text.toLowerCase().includes(q) || line.name.toLowerCase().includes(q),
    )
  }, [query, transcript.lines])

  const hasVideo = Boolean(transcript.recordingUrl)
  const progressPct =
    durationSeconds > 0 ? Math.min(100, Math.max(0, (currentSeconds / durationSeconds) * 100)) : 0

  useEffect(() => {
    setActiveSegmentId(transcript.segments[0]?.id ?? "")
    setCurrentSeconds(parseClockToSeconds(transcript.currentTime || "00:00"))
    setDurationSeconds(parseClockToSeconds(transcript.totalTime || "00:00"))
    setPlaying(false)
  }, [transcript.sessionId, transcript.currentTime, transcript.totalTime, transcript.segments])

  useEffect(() => {
    return () => {
      if (copiedResetRef.current != null) window.clearTimeout(copiedResetRef.current)
    }
  }, [])

  useEffect(() => {
    if (transcript.segments.length === 0) return
    let active = transcript.segments[0]!
    for (const segment of transcript.segments) {
      if (parseClockToSeconds(segment.time) <= currentSeconds + 0.5) active = segment
    }
    if (active.id !== activeSegmentId) setActiveSegmentId(active.id)
  }, [currentSeconds, transcript.segments, activeSegmentId])

  function seekToSeconds(seconds: number, autoplay = true) {
    const video = videoRef.current
    setCurrentSeconds(seconds)
    if (!video) return
    video.currentTime = Math.max(0, seconds)
    if (autoplay) {
      void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  function seekToTimeLabel(time: string, segmentId?: string) {
    if (segmentId) setActiveSegmentId(segmentId)
    seekToSeconds(parseClockToSeconds(time), true)

    const match = transcript.lines.find(
      (line) => parseClockToSeconds(line.time) >= parseClockToSeconds(time) - 1,
    )
    const node = match ? lineRefs.current[match.id] : null
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) {
      // No in-app recording — jump to the active segment in the transcript list.
      const segment =
        transcript.segments.find((item) => item.id === activeSegmentId) ?? transcript.segments[0]
      if (segment) seekToTimeLabel(segment.time, segment.id)
      return
    }
    if (video.paused) {
      void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plainText)
      setCopied(true)
      if (copiedResetRef.current != null) window.clearTimeout(copiedResetRef.current)
      copiedResetRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function handleDownload() {
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = transcriptDownloadFilename(transcript.title, transcript.sessionId)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 rounded-[10px]"
            onClick={() => void handleCopy()}
            aria-label={copied ? "Copied" : "Copy"}
          >
            {copied ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-10 gap-1.5 rounded-[10px]"
            onClick={handleDownload}
            aria-label="Download"
          >
            <Download className="size-3.5" aria-hidden />
            Download
          </Button>
        </div>
      </div>

      {transcript.recordingUrl ? (
        <div className="border-b border-[#e4e9f2] bg-[#0b1220] px-[18px] py-4">
          <video
            ref={videoRef}
            className="mx-auto max-h-[420px] w-full rounded-[10px]"
            controls
            preload="metadata"
            src={transcript.recordingUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(event) => setCurrentSeconds(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => {
              if (Number.isFinite(event.currentTarget.duration) && event.currentTarget.duration > 0) {
                setDurationSeconds(event.currentTarget.duration)
              }
            }}
          >
            <track kind="captions" />
          </video>
        </div>
      ) : transcript.zoomShareUrl ? (
        <div className="border-b border-[#e4e9f2] bg-[#f7f9fc] px-[18px] py-4">
          <p className="text-sm text-[var(--color-student-heading)]">
            In-app video is not available for this session. You can watch the Zoom cloud recording
            instead.
          </p>
          <a
            href={transcript.zoomShareUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-10 items-center rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            Open Zoom recording
          </a>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-[277px_1fr]">
        <aside className="border-b border-[#e4e9f2] bg-[#fbfcfe] p-[18px] lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]">Key takeaways</p>
          {transcript.takeaways.length > 0 ? (
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
          ) : (
            <p className="mt-3 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
              Takeaways will appear here once generated.
            </p>
          )}
          <p className="mt-6 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
            Summary generated from the transcript.
          </p>
        </aside>

        <div className="flex flex-col gap-3.5 p-[18px]">
          <div className="border-b border-[#dfe1e7] pb-1.5 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white disabled:opacity-50"
                aria-label={playing ? "Pause recording" : "Play recording"}
                onClick={togglePlay}
                disabled={!hasVideo && transcript.segments.length === 0}
              >
                {playing ? (
                  <Pause className="size-3.5 fill-current" aria-hidden />
                ) : (
                  <Play className="size-3.5 fill-current" aria-hidden />
                )}
              </button>
              <div className="relative h-[26px] min-w-0 flex-1">
                <div className="absolute top-[10px] right-0 left-0 h-1.5 rounded-full bg-[#eceff3]" />
                <div
                  className="absolute top-[10px] left-0 h-1.5 rounded-full bg-[var(--primary)]"
                  style={{ width: `${progressPct}%` }}
                />
                {transcript.segments.map((segment) => {
                  const active = activeSegmentId === segment.id
                  const leftPct =
                    durationSeconds > 0
                      ? Math.min(96, Math.max(2, (parseClockToSeconds(segment.time) / durationSeconds) * 100))
                      : 8
                  return (
                    <button
                      key={segment.id}
                      type="button"
                      aria-label={`Jump to ${segment.label} (${segment.time})`}
                      onClick={() => seekToTimeLabel(segment.time, segment.id)}
                      className={cn(
                        "absolute top-1.5 size-3.5 rounded-full border-2",
                        active
                          ? "border-white bg-[var(--primary)]"
                          : segment.kind === "action"
                            ? "border-[#b45309] bg-[#fff7ed]"
                            : "border-[var(--primary)] bg-white",
                      )}
                      style={{ left: `calc(${leftPct}% - 7px)` }}
                    />
                  )
                })}
              </div>
              <span className="shrink-0 text-[12px] font-semibold text-[var(--greyscale-500)]">
                {formatClock(currentSeconds)} / {formatClock(durationSeconds)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {transcript.segments.map((segment) => {
                const active = activeSegmentId === segment.id
                const isAction = segment.kind === "action" || segment.label === "Actions needed"
                return (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => seekToTimeLabel(segment.time, segment.id)}
                    className={cn(
                      "min-h-[34px] rounded-full border px-3 py-2 text-[12px] font-semibold",
                      active
                        ? isAction
                          ? "border-[#b45309] bg-[#b45309] text-white"
                          : "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : isAction
                          ? "border-[#fed7aa] bg-[#fff7ed] text-[#b45309]"
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
              <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center">
                <Search className="size-4 text-[var(--greyscale-500)]" aria-hidden />
              </span>
              <Input
                size="sm"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this transcript…"
                className="rounded-[10px] border-[#d5deec] pl-9"
              />
            </div>
            <span className="shrink-0 text-xs font-bold tracking-[0.02em] text-[var(--greyscale-500)]">
              {filteredLines.length} lines
            </span>
          </div>

          <div className="max-h-[420px] space-y-3.5 overflow-y-auto pr-1">
            {filteredLines.map((line) => {
              const lineSeconds = parseClockToSeconds(line.time)
              const active =
                hasVideo &&
                currentSeconds >= lineSeconds &&
                currentSeconds < lineSeconds + 8
              return (
                <div
                  key={line.id}
                  ref={(node) => {
                    lineRefs.current[line.id] = node
                  }}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-[10px] px-1 py-0.5 transition-colors",
                    active ? "bg-[var(--primary-25)]" : "hover:bg-[#f7f9fc]",
                  )}
                  onClick={() => seekToTimeLabel(line.time)}
                >
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
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export { SessionTranscriptViewer }
