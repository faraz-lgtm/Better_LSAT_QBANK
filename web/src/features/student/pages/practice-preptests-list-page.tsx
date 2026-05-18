import { useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"

import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { PrepTestPreviewNotice } from "@/features/student/components/prep-test-preview-notice"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import {
  countPracticePrepTestListRowsByFilter,
  filterPracticePrepTestListRows,
  mockPracticePrepTestListRows,
  type PracticePrepTestListFilter,
  type PracticePrepTestListRow,
} from "@/features/student/lib/mock-practice-preptest-list"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  ExternalLink,
  Lock,
  MoreVertical,
  RefreshCw,
} from "lucide-react"

const FILTER_TABS: { id: PracticePrepTestListFilter; label: string }[] = [
  { id: "all", label: "All Test" },
  { id: "in_progress", label: "In Progress" },
  { id: "fresh", label: "Fresh" },
  { id: "completed", label: "Completed" },
  { id: "blind_review", label: "Blind Review" },
]

const SORT_OPTIONS = ["Newest", "Oldest"] as const

function filterCountLabel(rows: typeof mockPracticePrepTestListRows, filter: PracticePrepTestListFilter): string {
  if (filter === "all") return FILTER_TABS.find((t) => t.id === "all")!.label
  const n = countPracticePrepTestListRowsByFilter(rows, filter)
  const base = FILTER_TABS.find((t) => t.id === filter)?.label ?? filter
  return `${base} (${n})`
}

function PtBadge({ number, tone }: { number: number; tone: "default" | "muted" | "success" }) {
  const palette =
    tone === "success"
      ? "border-[#287f6e] bg-[#fff3ea] text-[#287f6e]"
      : tone === "muted"
        ? "border-[#666d80] bg-[#f6f8fa] text-[#666d80]"
        : "border-[#0d47a1] bg-[#f3f7ff] text-[#0d47a1]"
  return (
    <div className={cn("flex size-16 shrink-0 flex-col items-center justify-center rounded-[14px] border p-px", palette)}>
      <span
        className="w-[35px] text-center text-xs font-semibold leading-[1.35]"
        style={{ fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif" }}
      >
        PT
      </span>
      <span className="text-xl font-bold leading-[1.3]">{number}</span>
    </div>
  )
}

function CompletedPrepTestCard({
  row,
  onRetake,
}: {
  row: PracticePrepTestListRow
  onRetake: (id: string) => void
}) {
  const attempts = row.completedAttempts ?? []
  const summaryScore = row.completedSummaryScore ?? 0
  const [expanded, setExpanded] = useState(row.completedDefaultExpanded ?? false)
  const canToggle = attempts.length > 0

  const headerRow = (
    <div
      className={cn(
        "flex min-h-[96px] flex-wrap items-center gap-4 border-[#dfe1e7] px-6 py-4 sm:flex-nowrap",
        expanded ? "border-b bg-white" : "",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <PtBadge number={row.prepTestNumber} tone="success" />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xl font-bold leading-[1.3] text-[#287f6e]">
            <span className="font-bold">C</span>
            <span className="font-bold" style={{ fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif" }}>
              ompleted
            </span>
          </p>
          <p className="truncate text-sm font-medium leading-[1.5] tracking-[0.02em] text-[#666d80]">{row.subtitle}</p>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-wrap items-center justify-end gap-4 sm:w-auto sm:justify-end">
        {!expanded && canToggle ? (
          <div className="flex flex-1 flex-wrap items-center justify-end gap-4 sm:flex-initial">
            <div className="flex h-[90px] min-w-[100px] flex-col items-center justify-center gap-1 rounded-[14px] border border-[#287f6e] bg-[#fff3ea] px-6">
              <p className="w-full text-center text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#287f6e]">
                Score
              </p>
              <p className="text-center text-[36px] font-bold leading-none text-[#287f6e]">{summaryScore}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#666d80] transition-colors hover:bg-[#f6f8fa]"
              aria-expanded={false}
              aria-label="Show attempts"
            >
              <ChevronDown className="size-6" />
            </button>
          </div>
        ) : null}

        {expanded && canToggle ? (
          <div className="flex min-h-[52px] flex-1 items-center justify-center sm:min-w-[120px]">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#666d80] transition-colors hover:bg-[#f6f8fa]"
              aria-expanded
              aria-label="Hide attempts"
            >
              <ChevronUp className="size-6" />
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => onRetake(row.id)}
          className="inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#dfe1e7] bg-white text-base font-semibold text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"
        >
          <RefreshCw className="size-5 shrink-0" aria-hidden />
          Retake
        </button>
        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#666d80] transition-colors hover:bg-[#f6f8fa] hover:text-[#062357]"
          aria-label="More options"
        >
          <MoreVertical className="size-6" />
        </button>
      </div>
    </div>
  )

  if (!canToggle) {
    return (
      <article
        className="w-full overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
        data-testid={`preptest-list-row-${row.id}`}
      >
        {headerRow}
      </article>
    )
  }

  return (
    <article
      className="w-full overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
      data-testid={`preptest-list-row-${row.id}`}
    >
      {headerRow}
      {expanded ? (
        <div className="bg-white">
          {attempts.map((attempt, index) => {
            const isLast = index === attempts.length - 1
            return (
              <div
                key={`${attempt.headline}-${index}`}
                className={cn(
                  "flex flex-wrap items-center gap-4 border-t border-[#dfe1e7] bg-[#f6f8fa] py-6 pl-6 pr-6 sm:pl-24 md:pl-28",
                  isLast ? "" : "",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <p className="text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[#062357]">{attempt.headline}</p>
                  <p className="text-sm font-medium leading-[1.5] tracking-[0.02em] text-[#666d80]">{attempt.detail}</p>
                </div>
                <div className="flex min-h-[52px] min-w-[72px] flex-col items-center justify-center rounded-[14px] border border-[#dfe1e7] bg-white px-6">
                  <p className="text-center text-2xl font-bold leading-[1.3] text-[#062357]">{attempt.scoreLabel}</p>
                </div>
                <Link
                  to={`/app/analytics/preptests/results/${encodeURIComponent(attempt.resultTestId)}`}
                  className="inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#0b4e6e] bg-[#f3f7ff] text-base font-semibold text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#e8eef9]"
                >
                  Result
                  <ChevronRight className="size-5 shrink-0" aria-hidden />
                </Link>
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#666d80] transition-colors hover:bg-white/80 hover:text-[#062357]"
                  aria-label="More options"
                >
                  <MoreVertical className="size-6" />
                </button>
              </div>
            )
          })}
        </div>
      ) : null}
    </article>
  )
}

function PrepTestListCard({
  row,
  onStart,
  onBlindReview,
}: {
  row: PracticePrepTestListRow
  onStart: (id: string) => void
  onBlindReview: () => void
}) {
  if (row.variant === "completed") {
    return <CompletedPrepTestCard row={row} onRetake={onStart} />
  }

  const mutedTitle = row.variant === "drill_only" || row.variant === "not_available" || row.variant === "drills_and_section"
  const titleClass = mutedTitle ? "text-[#666d80]" : "text-[#0d47a1]"
  const badgeTone: "default" | "muted" = mutedTitle ? "muted" : "default"

  const rightSlot = (() => {
    switch (row.variant) {
      case "ready":
        return (
          <button
            type="button"
            onClick={() => onStart(row.id)}
            className="inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] text-base font-semibold text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#0b3d82]"
          >
            Start
          </button>
        )
      case "in_process":
        return (
          <button
            type="button"
            onClick={onBlindReview}
            className="inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center rounded-2xl border border-[#ffe5b7] bg-[#ffbd4c] text-base font-semibold text-[#062357] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#ffb01a]"
          >
            Blind Review
          </button>
        )
      case "locked":
        return (
          <button
            type="button"
            onClick={() => onStart(row.id)}
            className="inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#dfe1e7] bg-white text-base font-semibold text-[#0d47a1] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"
          >
            <Lock className="size-5 shrink-0" aria-hidden />
            Start
          </button>
        )
      case "drill_only":
        return (
          <div className="flex h-[52px] shrink-0 items-center justify-center gap-2 px-4 text-base font-semibold text-[#666d80]">
            <CircleAlert className="size-5 shrink-0" aria-hidden />
            <span className="hidden text-left sm:inline">Available only for drills</span>
            <span className="sm:hidden">Drills only</span>
          </div>
        )
      case "not_available":
        return (
          <div className="flex h-[52px] shrink-0 items-center justify-center gap-2 px-4 text-base font-semibold text-[#666d80]">
            <CircleAlert className="size-5 shrink-0" aria-hidden />
            Not Available
          </div>
        )
      case "drills_and_section":
        return (
          <div className="flex h-[52px] max-w-[min(100%,380px)] shrink-0 items-center justify-center gap-2 px-2 text-base font-semibold text-[#666d80]">
            <CircleAlert className="size-5 shrink-0" aria-hidden />
            <span className="hidden text-left lg:inline">Available only for drills and Section</span>
            <span className="lg:hidden">Drills &amp; Section</span>
          </div>
        )
      default:
        return null
    }
  })()

  return (
    <article
      className="flex min-h-[96px] w-full flex-wrap items-center gap-4 rounded-2xl border border-[#dfe1e7] bg-white px-6 py-4 shadow-[0px_1px_1px_rgba(13,13,18,0.06)] sm:flex-nowrap"
      data-testid={`preptest-list-row-${row.id}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <PtBadge number={row.prepTestNumber} tone={badgeTone} />
        <div className="flex min-w-0 flex-col gap-2">
          <p className={cn("truncate text-xl font-bold leading-[1.3]", titleClass)}>{row.title}</p>
          <p className="truncate text-sm font-medium leading-[1.5] tracking-[0.02em] text-[#666d80]">{row.subtitle}</p>
        </div>
      </div>
      <div className="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
        {rightSlot}
        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#666d80] transition-colors hover:bg-[#f6f8fa] hover:text-[#062357]"
          aria-label="More options"
        >
          <MoreVertical className="size-6" />
        </button>
      </div>
    </article>
  )
}

function PracticePrepTestsListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const legacyTestId = searchParams.get("testId")

  const [filter, setFilter] = useState<PracticePrepTestListFilter>("all")
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>("Newest")

  const rows = useMemo(() => {
    const filtered = filterPracticePrepTestListRows(mockPracticePrepTestListRows, filter)
    const mult = sort === "Newest" ? 1 : -1
    return [...filtered].sort((a, b) => mult * (a.prepTestNumber - b.prepTestNumber))
  }, [filter, sort])

  if (legacyTestId) {
    return <Navigate to={`/app/practice/preptest/${encodeURIComponent(legacyTestId)}`} replace />
  }

  return (
    <>
      <StudentSubnavStrip
        title="PrepTests"
        crumbs={[{ label: "Practice", href: "/app/practice/drills" }, { label: "PrepTests" }]}
      />
      <StudentMain>
        <PrepTestPreviewNotice />

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-[908px] text-sm font-medium leading-[1.5] tracking-[0.02em] text-[#666d80]">
            Try a free PrepTest to gauge your starting point and see how to improve. When you&apos;re done, our
            analytics will tell you what to work on.
          </p>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#0d47a1] transition-colors hover:underline sm:self-center"
          >
            PrepTest settings
            <ExternalLink className="size-4 shrink-0" aria-hidden />
          </button>
        </div>

        <section className="mb-4 space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="shrink-0 text-[24px] font-bold leading-[1.3] text-[#062357]">Start your PrepTest</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end xl:min-w-0 xl:flex-1">
              <div className="flex flex-wrap gap-2">
                {FILTER_TABS.map((tab) => {
                  const active = filter === tab.id
                  const label = tab.id === "all" ? "All Test" : filterCountLabel(mockPracticePrepTestListRows, tab.id)
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilter(tab.id)}
                      className={cn(
                        "inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors",
                        active
                          ? "border-[#0b4e6e] bg-[#0d47a1] font-semibold text-white"
                          : "border-[#dfe1e7] bg-white font-medium text-[#666d80] hover:bg-[#f6f8fa]",
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <div className="relative w-full shrink-0 sm:w-[140px]">
                <label htmlFor="preptest-sort" className="sr-only">
                  Sort PrepTests
                </label>
                <select
                  id="preptest-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as (typeof SORT_OPTIONS)[number])}
                  className="h-10 w-full appearance-none rounded-2xl border border-[#dfe1e7] bg-white px-3 pr-9 text-sm font-medium text-[#666d80] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/25"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#666d80]" />
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <PrepTestListCard
              key={row.id}
              row={row}
              onStart={(id) => navigate(`/app/practice/preptest/${encodeURIComponent(id)}`)}
              onBlindReview={() => navigate("/app/practice/blind-review")}
            />
          ))}
        </div>
      </StudentMain>
    </>
  )
}

export { PracticePrepTestsListPage }
