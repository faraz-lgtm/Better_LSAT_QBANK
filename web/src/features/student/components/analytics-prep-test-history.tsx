import { useEffect, useRef, useState } from "react"
import { Bookmark, Calendar, ExternalLink, MoreVertical } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { PrepTestHistoryEntry } from "@/features/student/lib/mock-analytics-drills"

const SCORE_BOX_WIDTH_PX = 179

function ScoreMetric({
  label,
  value,
  max,
  barColor,
}: {
  label: string
  value: number
  max: number
  barColor: string
}) {
  const widthPct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div
      className="flex h-[62px] shrink-0 flex-col justify-between rounded-[16px] border border-[#e5e7eb] bg-[#f6f8fa] px-3 py-2.5"
      style={{ width: SCORE_BOX_WIDTH_PX }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium leading-normal tracking-[0.02em] text-[#666d80]">{label}</span>
        <span className="text-sm font-semibold leading-normal tracking-[0.02em] text-[#062357]">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-lg bg-[#dfe1e7]">
        <div className="h-full rounded-lg" style={{ width: `${widthPct}%`, backgroundColor: barColor }} />
      </div>
    </div>
  )
}

function RowMenu({
  entry,
  onToggleBookmark,
  onOpenPractice,
}: {
  entry: PrepTestHistoryEntry
  onToggleBookmark: (id: string) => void
  onOpenPractice?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (containerRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((c) => !c)}
        className="flex size-10 items-center justify-center rounded-xl border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="size-[18px]" aria-hidden />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-30 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
        >
          {onOpenPractice ? (
            <li role="presentation">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onOpenPractice(entry.id)
                  setOpen(false)
                }}
                className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium tracking-[0.02em] text-[#062357] transition-colors hover:bg-[#f6f8fa]"
              >
                <ExternalLink className="size-4 text-[#666d80]" aria-hidden />
                Practice this PrepTest
              </button>
            </li>
          ) : null}
          <li role="presentation">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleBookmark(entry.id)
                setOpen(false)
              }}
              className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium tracking-[0.02em] text-[#062357] transition-colors hover:bg-[#f6f8fa]"
            >
              <Bookmark
                className={cn(
                  "size-4",
                  entry.bookmarked ? "fill-[#0d47a1] text-[#0d47a1]" : "text-[#666d80]",
                )}
                aria-hidden
              />
              {entry.bookmarked ? "Remove bookmark" : "Add bookmark"}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  )
}

function PrepTestHistoryRow({
  entry,
  onToggleBookmark,
  onSelectEntry,
  onOpenPractice,
}: {
  entry: PrepTestHistoryEntry
  onToggleBookmark: (id: string) => void
  onSelectEntry?: (id: string) => void
  onOpenPractice?: (id: string) => void
}) {
  const labelClickable = Boolean(onSelectEntry)
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[16px] border border-[#dfe1e7] bg-white px-3 py-3 lg:flex-nowrap",
        labelClickable && "hover:bg-[#f9fbff]",
      )}
    >
      <div className="flex w-full min-w-0 max-w-[361px] shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={() => onToggleBookmark(entry.id)}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#dfe1e6] bg-[#f9f9fb] text-[#0d47a1] transition-colors hover:bg-white"
          aria-label={entry.bookmarked ? "Remove bookmark" : "Bookmark"}
          aria-pressed={entry.bookmarked}
        >
          <Bookmark
            className={cn("size-[18px]", entry.bookmarked ? "fill-[#0d47a1] text-[#0d47a1]" : "text-[#666d80]")}
            aria-hidden
          />
        </button>
        <div className="min-w-0 flex flex-col gap-0.5">
          {labelClickable ? (
            <button
              type="button"
              onClick={() => onSelectEntry?.(entry.id)}
              className="truncate text-left text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[#0d47a1] hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {entry.testLabel}
            </button>
          ) : (
            <p className="truncate text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[#0d47a1]">
              {entry.testLabel}
            </p>
          )}
          <div className="inline-flex min-w-0 items-center gap-2 text-xs leading-normal tracking-[0.02em] text-[#666d80]">
            <Calendar className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{entry.dateLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ScoreMetric label="Score" value={entry.score} max={entry.scoreMax} barColor="#0d47a1" />
        <ScoreMetric label="BR" value={entry.blindReviewScore} max={entry.blindReviewMax} barColor="#df1c41" />
      </div>

      <div className="ml-auto shrink-0">
        <RowMenu entry={entry} onToggleBookmark={onToggleBookmark} onOpenPractice={onOpenPractice} />
      </div>
    </div>
  )
}

type AnalyticsPrepTestHistoryProps = {
  visibleEntries: PrepTestHistoryEntry[]
  bookmarkedOnly: boolean
  onBookmarkedOnlyChange: (next: boolean) => void
  onToggleBookmark: (id: string) => void
  onSelectEntry?: (id: string) => void
  onOpenPractice?: (id: string) => void
}

function AnalyticsPrepTestHistory({
  visibleEntries,
  bookmarkedOnly,
  onBookmarkedOnlyChange,
  onToggleBookmark,
  onSelectEntry,
  onOpenPractice,
}: AnalyticsPrepTestHistoryProps) {
  return (
    <section className="rounded-[16px] border border-[#dfe1e7] bg-white p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[#f6f8fa] px-6 py-4">
        <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">PrepTest History</h2>
        <label className="flex cursor-pointer items-center gap-2.5">
          <Bookmark className="size-4 text-[#062357]" aria-hidden />
          <span className="text-base font-semibold leading-normal tracking-[0.02em] text-[#062357]">
            Bookmarked only
          </span>
          <Switch
            checked={bookmarkedOnly}
            onChange={(event) => onBookmarkedOnlyChange(event.target.checked)}
            aria-label="Show bookmarked only"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {visibleEntries.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-6 py-8 text-center text-sm text-[#666d80]">
            {bookmarkedOnly
              ? "No bookmarked PrepTests in this range. Adjust the time range or bookmark a PrepTest."
              : "No PrepTests recorded in this range. Try widening the time range."}
          </p>
        ) : (
          visibleEntries.map((entry) => (
            <PrepTestHistoryRow
              key={entry.id}
              entry={entry}
              onToggleBookmark={onToggleBookmark}
              onSelectEntry={onSelectEntry}
              onOpenPractice={onOpenPractice}
            />
          ))
        )}
      </div>
    </section>
  )
}

export { AnalyticsPrepTestHistory }
