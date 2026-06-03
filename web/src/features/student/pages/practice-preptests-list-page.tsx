import { useEffect, useMemo, useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import type {
  PrepTestPoolFilter,
  PrepTestPoolItem,
  PrepTestPoolStatusCounts,
} from "@/features/student/preptests/preptest-types"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ChevronDown, ChevronLeft, ChevronRight, MoreVertical, RefreshCw, Settings } from "lucide-react"

const PAGE_SIZE = 10

const EMPTY_STATUS_COUNTS: PrepTestPoolStatusCounts = {
  all: 0,
  fresh: 0,
  in_progress: 0,
  completed: 0,
}

const FILTER_TABS: { id: PrepTestPoolFilter | "blind_review"; label: string }[] = [
  { id: "all", label: "All Test" },
  { id: "in_progress", label: "In Progress" },
  { id: "fresh", label: "Fresh" },
  { id: "completed", label: "Completed" },
  { id: "blind_review", label: "Blind Review" },
]

const SORT_OPTIONS = ["Newest", "Oldest"] as const

function displayPrepTestNumber(item: PrepTestPoolItem): number {
  const n = item.prepTestNumber ? Number.parseInt(item.prepTestNumber, 10) : NaN
  if (Number.isFinite(n)) return n
  const fromModule = /^LSAC(\d+)$/i.exec(item.moduleId)?.[1]
  return fromModule ? Number.parseInt(fromModule, 10) : 0
}

function statusTitle(status: PrepTestPoolItem["status"]): string {
  if (status === "fresh") return "Ready to Take"
  if (status === "in_progress") return "In Process"
  return "Completed"
}

function statusSubtitle(item: PrepTestPoolItem): string {
  if (item.status === "completed" && item.scaledScore != null) {
    return `Scaled score ${item.scaledScore}`
  }
  return `${item.questionCount} questions · ${item.timeMinutes} min`
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
      <span className="text-2xl font-bold leading-[1.3]">{number || "—"}</span>
    </div>
  )
}

function PrepTestListCard({
  item,
  starting,
  onPrimary,
}: {
  item: PrepTestPoolItem
  starting: boolean
  onPrimary: () => void
}) {
  const ptNum = displayPrepTestNumber(item)
  const isCompleted = item.status === "completed"
  const badgeTone: "default" | "muted" | "success" = isCompleted ? "success" : "default"
  const titleClass = isCompleted ? "text-[#287f6e]" : "text-[#0d47a1]"

  const primaryLabel = isCompleted ? "Retake" : item.status === "in_progress" ? "Continue" : "Start"
  const primaryClass = isCompleted
    ? "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#dfe1e7] bg-white text-base font-semibold text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"
    : item.status === "in_progress"
      ? "ds-btn min-w-[148px] shrink-0 text-base"
      : "ds-btn min-w-[148px] shrink-0 text-base"

  return (
    <article
      className="flex min-h-[110px] w-full flex-wrap items-center gap-4 rounded-2xl border border-[#dfe1e7] bg-white px-6 py-3 shadow-[0px_1px_1px_rgba(13,13,18,0.06)] sm:flex-nowrap sm:py-0"
      data-testid={`preptest-list-row-${item.id}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <PtBadge number={ptNum} tone={badgeTone} />
        <div className="flex min-w-0 flex-col gap-2">
          <p className={cn("truncate text-2xl font-bold leading-[1.3]", titleClass)}>{statusTitle(item.status)}</p>
          <p className="truncate text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
            {item.title ?? item.moduleId} · {statusSubtitle(item)}
          </p>
        </div>
      </div>
      <PrepTestListCardActions
        isCompleted={isCompleted}
        primaryLabel={primaryLabel}
        primaryClass={primaryClass}
        starting={starting}
        onPrimary={onPrimary}
      />
    </article>
  )
}

function PrepTestListCardActions({
  isCompleted,
  primaryLabel,
  primaryClass,
  starting,
  onPrimary,
}: {
  isCompleted: boolean
  primaryLabel: string
  primaryClass: string
  starting: boolean
  onPrimary: () => void
}) {
  return (
    <div className="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
      <button type="button" disabled={starting} onClick={onPrimary} className={primaryClass}>
        {starting ? "…" : isCompleted ? (
          <>
            <RefreshCw className="size-5 shrink-0" aria-hidden />
            {primaryLabel}
          </>
        ) : (
          primaryLabel
        )}
      </button>
      <button
        type="button"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#666d80] transition-colors hover:bg-[#f6f8fa] hover:text-[#062357]"
        aria-label="More options"
      >
        <MoreVertical className="size-6" />
      </button>
    </div>
  )
}

function PracticePrepTestsListPage() {
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const [searchParams] = useSearchParams()
  const legacyTestId = searchParams.get("testId")

  const [filter, setFilter] = useState<PrepTestPoolFilter>("all")
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>("Newest")
  const [page, setPage] = useState(1)
  const [prepTests, setPrepTests] = useState<PrepTestPoolItem[]>([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState<PrepTestPoolStatusCounts>(EMPTY_STATUS_COUNTS)
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const out = await practiceApi.listPrepTestPool({
          filter,
          page,
          pageSize: PAGE_SIZE,
          sort: sort === "Newest" ? "newest" : "oldest",
        })
        if (!cancelled) {
          setPrepTests(out.prepTests)
          setTotal(out.total)
          setStatusCounts(out.statusCounts)
        }
      } catch (e) {
        if (!cancelled) {
          setPrepTests([])
          setTotal(0)
          setStatusCounts(EMPTY_STATUS_COUNTS)
          setError(e instanceof Error ? e.message : "Failed to load PrepTests")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [practiceApi, filter, sort, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(page * PAGE_SIZE, total)

  function filterTabLabel(tabId: PrepTestPoolFilter | "blind_review"): string {
    const base = FILTER_TABS.find((t) => t.id === tabId)?.label ?? tabId
    if (tabId === "all" || tabId === "blind_review") return base
    return `${base} (${statusCounts[tabId]})`
  }

  async function handlePrimary(item: PrepTestPoolItem) {
    setStartingId(item.id)
    setError(null)
    try {
      if (item.status === "fresh") {
        await practiceApi.startPrepTest({ prepTestId: item.id })
      }
      navigate(`/app/practice/preptest/${encodeURIComponent(item.id)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start PrepTest")
    } finally {
      setStartingId(null)
    }
  }

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
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <p className="max-w-[908px] text-sm font-medium leading-[1.5] tracking-[0.02em] text-[#666d80] md:text-base">
            Try a free PrepTest to gauge your starting point and see how to improve. When you&apos;re done, our
            analytics will tell you what to work on.
          </p>
          <button
            type="button"
            disabled
            className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 self-start rounded-2xl py-2 pl-2 pr-4 text-xs font-semibold leading-[1.5] tracking-[0.02em] text-[#a4acb9] lg:self-center"
          >
            PrepTest settings
            <Settings className="size-4 shrink-0" aria-hidden />
          </button>
        </div>

        <section className="mb-6">
          <PrepTestListFilters
            filter={filter}
            setFilter={(f) => {
              setFilter(f)
              setPage(1)
            }}
            sort={sort}
            setSort={(s) => {
              setSort(s)
              setPage(1)
            }}
            filterTabLabel={filterTabLabel}
          />
        </section>

        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-[#666d80]">Loading PrepTests…</p>
        ) : prepTests.length === 0 ? (
          <p className="text-sm text-[#666d80]">No PrepTests match this filter.</p>
        ) : (
          <>
            <PrepTestListRows rows={prepTests} startingId={startingId} onPrimary={handlePrimary} />
            {!loading && total > PAGE_SIZE ? (
              <nav
                className="mt-6 flex flex-col gap-3 border-t border-[#dfe1e7] pt-4 sm:flex-row sm:items-center sm:justify-between"
                aria-label="PrepTest pagination"
              >
                <p className="text-sm text-[#666d80]">
                  Showing {pageStart}–{pageEnd} of {total} PrepTests
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    Previous
                  </Button>
                  <span className="min-w-[4.5rem] text-center text-sm font-medium tabular-nums text-[#062357]">
                    {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </nav>
            ) : null}
          </>
        )}
      </StudentMain>
    </>
  )
}

function PrepTestListFilters({
  filter,
  setFilter,
  sort,
  setSort,
  filterTabLabel,
}: {
  filter: PrepTestPoolFilter
  setFilter: (f: PrepTestPoolFilter) => void
  sort: (typeof SORT_OPTIONS)[number]
  setSort: (s: (typeof SORT_OPTIONS)[number]) => void
  filterTabLabel: (tabId: PrepTestPoolFilter | "blind_review") => string
}) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between gap-6">
      <h2 className="shrink-0 text-2xl font-bold leading-[1.3] text-[#062357]">Start your PrepTest</h2>
      <div className="flex shrink-0 items-center gap-3">
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === "blind_review") {
                    navigate("/app/practice/blind-review")
                    return
                  }
                  setFilter(tab.id)
                }}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center whitespace-nowrap px-4 text-base transition-colors",
                  active
                    ? "ds-btn font-semibold"
                    : "h-[52px] rounded-2xl border border-[#dfe1e7] bg-white font-medium text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#f6f8fa]",
                )}
              >
                {filterTabLabel(tab.id)}
              </button>
            )
          })}
        <div className="relative w-[160px] shrink-0">
          <label htmlFor="preptest-sort" className="sr-only">
            Sort PrepTests
          </label>
          <select
            id="preptest-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof SORT_OPTIONS)[number])}
            className="h-[52px] w-full appearance-none rounded-2xl border border-[#dfe1e7] bg-white px-3 pr-10 text-base font-medium text-[#666d80] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/25"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[#666d80]" />
        </div>
      </div>
    </div>
  )
}

function PrepTestListRows({
  rows,
  startingId,
  onPrimary,
}: {
  rows: PrepTestPoolItem[]
  startingId: string | null
  onPrimary: (item: PrepTestPoolItem) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {rows.map((item) => (
        <PrepTestListCard
          key={item.id}
          item={item}
          starting={startingId === item.id}
          onPrimary={() => void onPrimary(item)}
        />
      ))}
    </div>
  )
}

export { PracticePrepTestsListPage }
