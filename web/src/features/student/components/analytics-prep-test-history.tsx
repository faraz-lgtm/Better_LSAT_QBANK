import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Bookmark, Calendar, ExternalLink, MoreVertical } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { checkedFromToggleEvent } from "@/features/student/analytics/session-bookmarks"
import type { PrepTestHistoryEntry } from "@/features/student/lib/mock-analytics-preptests"
import type { AnalyticsSectionFilter } from "@/features/student/analytics/section-filter"

const SCORE_BOX_WIDTH_PX = 148

const SECTION_FILTER_OPTIONS: Array<{ id: AnalyticsSectionFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "LR", label: "LR" },
  { id: "RC", label: "RC" },
]

function HistorySectionFilter({
  value,
  onChange,
}: {
  value: AnalyticsSectionFilter
  onChange: (next: AnalyticsSectionFilter) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by section">
      {SECTION_FILTER_OPTIONS.map((option) => {
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={cn(
              "h-7 rounded-[8px] px-2.5 text-xs font-semibold leading-none tracking-[0.02em] transition-colors",
              active
                ? "bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
                : "border border-[#dfe1e7] bg-white text-[#0d47a1] hover:bg-[#f3f7ff]",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

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
  const safeValue = Number.isFinite(value) ? value : 0
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1
  const widthPct = Math.max(0, Math.min(100, (safeValue / safeMax) * 100))
  return (
    <div
      className="flex h-10 shrink-0 flex-col justify-center gap-1 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] px-2.5"
      style={{ width: SCORE_BOX_WIDTH_PX }}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="text-xs font-medium leading-normal tracking-[0.02em] text-[#666d80]">{label}</span>
        <span className="w-9 text-right text-xs font-semibold leading-normal tracking-[0.02em] text-[#062357]">
          {safeValue}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-md bg-[#dfe1e7]">
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
        className="flex size-8 items-center justify-center rounded-[10px] border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-30 mt-2 min-w-[200px] overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
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
                className="flex h-8 w-full items-center gap-2 rounded-[10px] px-3 text-xs font-medium tracking-[0.02em] text-[#062357] transition-colors hover:bg-[#f6f8fa]"
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
              className="flex h-8 w-full items-center gap-2 rounded-[10px] px-3 text-xs font-medium tracking-[0.02em] text-[#062357] transition-colors hover:bg-[#f6f8fa]"
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
  brBarColor,
}: {
  entry: PrepTestHistoryEntry
  onToggleBookmark: (id: string) => void
  onSelectEntry?: (id: string) => void
  onOpenPractice?: (id: string) => void
  brBarColor: string
}) {
  const labelClickable = Boolean(onSelectEntry)
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 rounded-[12px] border border-[#dfe1e7] bg-white p-2.5 lg:h-14 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)_72px] lg:items-center lg:gap-0 lg:p-0",
        labelClickable && "hover:bg-[#f9fbff]",
      )}
    >
      <div className="flex min-w-0 items-center gap-2 lg:h-14 lg:px-2.5">
        <button
          type="button"
          onClick={() => onToggleBookmark(entry.id)}
          className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[#dfe1e6] bg-[#f9f9fb] text-[#0d47a1] transition-colors hover:bg-white"
          aria-label={entry.bookmarked ? "Remove bookmark" : "Bookmark"}
          aria-pressed={entry.bookmarked}
        >
          <Bookmark
            className={cn("size-4", entry.bookmarked ? "fill-[#0d47a1] text-[#0d47a1]" : "text-[#666d80]")}
            aria-hidden
          />
        </button>
        <div className="min-w-0 flex flex-col gap-0">
          {labelClickable ? (
            <button
              type="button"
              onClick={() => onSelectEntry?.(entry.id)}
              className="truncate text-left text-sm font-semibold leading-[1.35] tracking-[0.02em] text-[#0d47a1] hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {entry.testLabel}
            </button>
          ) : (
            <p className="truncate text-sm font-semibold leading-[1.35] tracking-[0.02em] text-[#0d47a1]">
              {entry.testLabel}
            </p>
          )}
          <div className="inline-flex min-w-0 items-center gap-1.5 text-[11px] leading-normal tracking-[0.02em] text-[#666d80]">
            <Calendar className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{entry.dateLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 lg:contents">
        <div className="flex flex-1 items-center justify-center lg:h-14 lg:flex-none lg:px-2.5">
          <ScoreMetric label="Score" value={entry.score} max={entry.scoreMax} barColor="#0d47a1" />
        </div>
        <div className="flex flex-1 items-center justify-center lg:h-14 lg:flex-none lg:px-2.5">
          <ScoreMetric label="BR" value={entry.blindReviewScore} max={entry.blindReviewMax} barColor={brBarColor} />
        </div>
      </div>

      <div className="flex items-center justify-end lg:h-14 lg:justify-center lg:px-2.5">
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
  /** BR progress bar fill — Sections uses red; Drills uses orange. */
  brBarColor?: string
  /** Insights tab heading — Drill / Section / PrepTest History. */
  title?: string
  /** Noun used in empty-state copy (e.g. "drills", "sections", "PrepTests"). */
  emptyNoun?: string
  /** When set, shows All / LR / RC filters in the card header. */
  sectionFilter?: AnalyticsSectionFilter
  onSectionFilterChange?: (next: AnalyticsSectionFilter) => void
  /** Overview preview: show this many rows, then a View more link. */
  previewLimit?: number
  viewMoreHref?: string
}

function AnalyticsPrepTestHistory({
  visibleEntries,
  bookmarkedOnly,
  onBookmarkedOnlyChange,
  onToggleBookmark,
  onSelectEntry,
  onOpenPractice,
  brBarColor = "#ff6f00",
  title = "PrepTest History",
  emptyNoun = "PrepTests",
  sectionFilter,
  onSectionFilterChange,
  previewLimit,
  viewMoreHref,
}: AnalyticsPrepTestHistoryProps) {
  const showSectionFilter = sectionFilter != null && onSectionFilterChange != null
  const displayedEntries =
    previewLimit != null ? visibleEntries.slice(0, previewLimit) : visibleEntries
  const showViewMore =
    Boolean(viewMoreHref) && previewLimit != null && visibleEntries.length > previewLimit

  return (
    <section className="rounded-[14px] border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[#f6f8fa] px-3 py-2">
        <h2 className="text-base font-bold leading-[1.3] text-[#062357]">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {showSectionFilter ? (
            <HistorySectionFilter value={sectionFilter} onChange={onSectionFilterChange} />
          ) : null}
          <div className="flex shrink-0 items-center gap-2">
            <Bookmark className="size-3.5 shrink-0 text-[#062357]" aria-hidden />
            <span className="whitespace-nowrap text-xs font-semibold leading-normal tracking-[0.02em] text-[#062357]">
              Bookmarked only
            </span>
            <Switch
              checked={bookmarkedOnly}
              onChange={(event) => onBookmarkedOnlyChange(checkedFromToggleEvent(event))}
              aria-label="Show bookmarked only"
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 pr-1",
          previewLimit == null && "max-h-[360px] overflow-y-auto",
        )}
      >
        {displayedEntries.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-4 py-5 text-center text-xs text-[#666d80]">
            {bookmarkedOnly
              ? `No bookmarked ${emptyNoun} in this range. Adjust the time range or bookmark a ${emptyNoun.replace(/s$/, "")}.`
              : showSectionFilter && sectionFilter !== "all"
                ? `No ${sectionFilter} ${emptyNoun} in this range. Try All or another section.`
                : `No ${emptyNoun} recorded in this range. Try widening the time range.`}
          </p>
        ) : (
          displayedEntries.map((entry) => (
            <PrepTestHistoryRow
              key={entry.id}
              entry={entry}
              onToggleBookmark={onToggleBookmark}
              onSelectEntry={onSelectEntry}
              onOpenPractice={onOpenPractice}
              brBarColor={brBarColor}
            />
          ))
        )}
      </div>

      {showViewMore && viewMoreHref ? (
        <div className="mt-3 flex justify-center">
          <Link
            to={viewMoreHref}
            className="inline-flex h-8 min-w-[120px] items-center justify-center rounded-[10px] border border-[#dfe1e7] bg-white px-4 text-xs font-semibold leading-[1.4] tracking-[0.02em] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"
          >
            View more
          </Link>
        </div>
      ) : null}
    </section>
  )
}

export { AnalyticsPrepTestHistory }
