import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Bookmark, Calendar, Check, ExternalLink, Eye, MoreVertical } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { analyticsSegmentedTabClass } from "@/features/student/analytics/components/analytics-overview-ui"
import { checkedFromToggleEvent } from "@/features/student/analytics/session-bookmarks"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import type { PrepTestHistoryEntry } from "@/features/student/lib/mock-analytics-preptests"
import type { AnalyticsSectionFilter } from "@/features/student/analytics/section-filter"

const SCORE_BOX_WIDTH_PX = 188

const SECTION_FILTER_OPTIONS: Array<{ id: AnalyticsSectionFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "LR", label: "LR" },
  { id: "RC", label: "RC" },
]

export const OVERVIEW_HISTORY_TABS = [
  { id: "all", label: "All History" },
  { id: "drill", label: "Drill History" },
  { id: "section", label: "Section History" },
  { id: "preptest", label: "PrepTest History" },
] as const

export type OverviewHistoryTab = (typeof OVERVIEW_HISTORY_TABS)[number]["id"]

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
                ? "bg-[var(--primary)] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
                : "border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--primary)] hover:bg-[var(--primary-0)]",
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
      className="flex h-10 min-w-[188px] shrink-0 flex-col justify-center gap-1 rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-2.5"
      style={{ width: SCORE_BOX_WIDTH_PX }}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="whitespace-nowrap text-[10px] font-medium leading-normal tracking-[0.02em] text-[var(--greyscale-500)] sm:text-xs">
          {label}
        </span>
        <span className="w-9 shrink-0 text-right text-xs font-semibold leading-normal tracking-[0.02em] text-[var(--color-student-heading)]">
          {safeValue}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-md bg-[var(--greyscale-100)]">
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
        className="flex size-8 items-center justify-center rounded-[10px] text-[var(--greyscale-500)] transition-colors hover:bg-[var(--greyscale-25)]"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-30 mt-2 min-w-[200px] overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
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
                className="flex h-8 w-full items-center gap-2 rounded-[10px] px-3 text-xs font-medium tracking-[0.02em] text-[var(--color-student-heading)] transition-colors hover:bg-[var(--greyscale-25)]"
              >
                <ExternalLink className="size-4 text-[var(--greyscale-500)]" aria-hidden />
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
              className="flex h-8 w-full items-center gap-2 rounded-[10px] px-3 text-xs font-medium tracking-[0.02em] text-[var(--color-student-heading)] transition-colors hover:bg-[var(--greyscale-25)]"
            >
              <Bookmark
                className={cn(
                  "size-4",
                  entry.bookmarked ? "fill-[var(--primary)] text-[var(--primary)]" : "text-[var(--greyscale-500)]",
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
        "grid grid-cols-1 gap-2 border-b border-[var(--greyscale-100)] py-2.5 last:border-b-0 lg:h-14 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center lg:gap-2 lg:py-0",
        labelClickable && "hover:bg-[var(--primary-0)]/40",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {entry.sectionType === "LR" || entry.sectionType === "RC" ? (
          <SectionInitialBadge section={entry.sectionType} variant="compact" />
        ) : null}
        <div className="flex min-w-0 flex-col gap-0">
          {labelClickable ? (
            <button
              type="button"
              onClick={() => onSelectEntry?.(entry.id)}
              title={entry.testLabel}
              className="truncate text-left text-sm font-semibold leading-[1.35] tracking-[0.02em] text-[var(--primary)] hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {entry.testLabel}
            </button>
          ) : (
            <p
              title={entry.testLabel}
              className="truncate text-sm font-semibold leading-[1.35] tracking-[0.02em] text-[var(--primary)]"
            >
              {entry.testLabel}
            </p>
          )}
          <div className="inline-flex min-w-0 items-center gap-1.5 text-[11px] leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
            <Calendar className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{entry.dateLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:contents">
        <div className="flex items-center justify-center">
          <ScoreMetric label="Score" value={entry.score} max={entry.scoreMax} barColor="var(--primary)" />
        </div>
        <div className="flex items-center justify-center">
          <ScoreMetric
            label="Un-timed Review"
            value={entry.blindReviewScore}
            max={entry.blindReviewMax}
            barColor={brBarColor}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 lg:justify-center">
        <button
          type="button"
          onClick={() => onToggleBookmark(entry.id)}
          className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[var(--primary)] transition-colors hover:bg-[var(--greyscale-25)]"
          aria-label={entry.bookmarked ? "Remove bookmark" : "Bookmark"}
          aria-pressed={entry.bookmarked}
        >
          <Bookmark
            className={cn(
              "size-4",
              entry.bookmarked ? "fill-[var(--primary)] text-[var(--primary)]" : "text-[var(--greyscale-500)]",
            )}
            aria-hidden
          />
        </button>
        {onSelectEntry ? (
          <button
            type="button"
            onClick={() => onSelectEntry(entry.id)}
            className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[var(--primary)] transition-colors hover:bg-[var(--greyscale-25)]"
            aria-label={`View ${entry.testLabel}`}
          >
            <Eye className="size-4" aria-hidden />
          </button>
        ) : null}
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
  /** Untimed Review progress bar fill — Sections uses red; Drills uses orange. */
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
  /** When true with viewMoreHref, always show View more (Overview Figma). */
  alwaysShowViewMore?: boolean
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
  alwaysShowViewMore = false,
}: AnalyticsPrepTestHistoryProps) {
  const showSectionFilter = sectionFilter != null && onSectionFilterChange != null
  const displayedEntries =
    previewLimit != null ? visibleEntries.slice(0, previewLimit) : visibleEntries
  const showViewMore =
    Boolean(viewMoreHref) &&
    (alwaysShowViewMore || (previewLimit != null && visibleEntries.length > previewLimit))

  return (
    <section className="flex flex-col gap-3 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4 shadow-[0px_1px_2px_rgba(13,13,18,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-base font-bold leading-[1.3] text-[var(--color-student-heading)]">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {showSectionFilter ? (
            <HistorySectionFilter value={sectionFilter} onChange={onSectionFilterChange} />
          ) : null}
          <div className="flex shrink-0 items-center gap-2">
            <Bookmark className="size-3.5 shrink-0 text-[var(--color-student-heading)]" aria-hidden />
            <span className="whitespace-nowrap text-xs font-semibold leading-normal tracking-[0.02em] text-[var(--color-student-heading)]">
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
          "flex flex-col pr-1",
          previewLimit == null && "max-h-[360px] overflow-y-auto",
        )}
      >
        {displayedEntries.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-4 py-5 text-center text-xs text-[var(--greyscale-500)]">
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
        <div className="flex justify-center pt-1">
          <Link
            to={viewMoreHref}
            className="text-xs font-semibold leading-[1.4] tracking-[0.02em] text-[var(--primary)] transition-colors hover:underline"
          >
            View More
          </Link>
        </div>
      ) : null}
    </section>
  )
}

function OverviewHistoryTabs({
  value,
  onChange,
}: {
  value: OverviewHistoryTab
  onChange: (next: OverviewHistoryTab) => void
}) {
  return (
    <div role="tablist" aria-label="History type" className="flex flex-wrap items-center gap-2">
      {OVERVIEW_HISTORY_TABS.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              analyticsSegmentedTabClass(active),
              "h-9 gap-1.5 rounded-[10px] px-4 text-xs",
              !active && "text-[var(--primary)]",
            )}
          >
            {active ? (
              <span
                className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-white/20"
                aria-hidden
              >
                <Check className="size-2.5 stroke-[3]" />
              </span>
            ) : null}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

type OverviewHistoryShellProps = {
  activeTab: OverviewHistoryTab
  onTabChange: (next: OverviewHistoryTab) => void
  children: ReactNode
}

function OverviewHistoryShell({ activeTab, onTabChange, children }: OverviewHistoryShellProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold leading-[1.3] text-[var(--color-student-heading)]">History</h2>
        <OverviewHistoryTabs value={activeTab} onChange={onTabChange} />
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

export { AnalyticsPrepTestHistory, OverviewHistoryShell, OverviewHistoryTabs }
