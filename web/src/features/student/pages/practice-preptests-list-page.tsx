import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { FigmaDropdown } from "@/components/ui/figma-dropdown"
import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import type {
  PrepTestPoolAttempt,
  PrepTestPoolFilter,
  PrepTestPoolItem,
  PrepTestPoolStatusCounts,
} from "@/features/student/preptests/preptest-types"
import {
  blindReviewSectionSessionPath,
  firstBlindReviewSectionSessionId,
} from "@/features/student/blind-review/blind-review-navigation"
import { prepTestHubHref } from "@/features/student/preptests/preptest-hub-navigation"
import { buildPoolHistoryRows, poolCardDisplayScore } from "@/features/student/preptests/preptest-pool-display"
import { AttemptScoreBox, ScoreBadge } from "@/features/student/preptests/preptest-score-badge"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Settings,
} from "lucide-react"

const PAGE_SIZE = 10

const EMPTY_STATUS_COUNTS: PrepTestPoolStatusCounts = {
  all: 0,
  fresh: 0,
  in_progress: 0,
  completed: 0,
  blind_review: 0,
}

const FILTER_TABS: { id: PrepTestPoolFilter; label: string }[] = [
  { id: "all", label: "All Test" },
  { id: "in_progress", label: "In Progress" },
  { id: "fresh", label: "Fresh" },
  { id: "completed", label: "Completed" },
  { id: "blind_review", label: "Blind Review" },
]

const SORT_OPTIONS = ["Newest", "Oldest"] as const

const FILTER_PILL_ACTIVE_CLASS =
  "ds-btn h-[52px] shrink-0 rounded-[16px] px-4 text-[16px] font-semibold leading-[1.5] tracking-[0.32px]"
const FILTER_PILL_INACTIVE_CLASS =
  "inline-flex h-[52px] shrink-0 items-center justify-center whitespace-nowrap rounded-[16px] border border-[#dfe1e7] bg-white px-4 text-[16px] font-medium leading-[1.5] tracking-[0.32px] text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"

const PRIMARY_ACTION_CLASS =
  "ds-btn h-[52px] w-[148px] shrink-0 rounded-[16px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px]"
const RETAKE_ACTION_CLASS =
  "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[#dfe1e7] bg-white text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"
const BLIND_REVIEW_ACTION_CLASS =
  "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center rounded-[16px] border border-[#ffe5b7] bg-[#ffbd4c] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#062357] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f5b03f] disabled:opacity-60"
const RESULT_ACTION_CLASS =
  "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[#0d47a1] bg-[#f3f7ff] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#e8f0ff]"

/** Figma `18643:26555` — default pool row hover */
const PREPTEST_LIST_CARD_SHELL_BASE_CLASS =
  "w-full overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white transition-[border-color]"

type PrepTestListCardHoverTone = "default" | "success"

const PREPTEST_LIST_CARD_HOVER_CLASS: Record<
  PrepTestListCardHoverTone,
  { shell: string; row: string }
> = {
  default: {
    shell: "hover:border-[#0d47a1]",
    row: "transition-[background-color] hover:bg-[var(--primary-25)]",
  },
  /** Figma `18643:27007` — completed pool row hover */
  success: {
    shell: "hover:border-[#287f6e]",
    row: "transition-[background-color] hover:bg-[#effefa]",
  },
}

type BadgeTone = "default" | "success"

function displayPrepTestNumber(item: PrepTestPoolItem): number {
  const n = item.prepTestNumber ? Number.parseInt(item.prepTestNumber, 10) : NaN
  if (Number.isFinite(n)) return n
  const fromModule = /^LSAC(\d+)$/i.exec(item.moduleId)?.[1]
  return fromModule ? Number.parseInt(fromModule, 10) : 0
}

function formatCompletedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function attemptDetailLabel(attempt: PrepTestPoolAttempt): string {
  const ord =
    attempt.attemptNumber === 1
      ? "1st take"
      : attempt.attemptNumber === 2
        ? "2nd take"
        : attempt.attemptNumber === 3
          ? "3rd take"
          : `${attempt.attemptNumber}th take`
  return ord
}

function statusTitle(item: PrepTestPoolItem): string {
  if (item.status === "fresh") return "Ready to Take"
  if (item.status === "in_progress" || item.blindReviewStatus) return "In Process"
  return "Completed"
}

function statusSubtitle(item: PrepTestPoolItem): string {
  if (item.blindReviewStatus) return "Blind Review"
  if (item.status === "completed" && item.completedAt) {
    return formatCompletedDate(item.completedAt)
  }
  if (item.status === "completed" && item.scaledScore != null) {
    return `Scaled score ${item.scaledScore}`
  }
  return `${item.questionCount} questions · ${item.timeMinutes} min`
}

function PtBadge({ number, tone }: { number: number; tone: BadgeTone }) {
  const palette =
    tone === "success"
      ? "border-[#287f6e] bg-[#effefa] text-[#287f6e]"
      : "border-[#0d47a1] bg-[#f3f7ff] text-[#0d47a1]"
  return (
    <div className={cn("flex size-16 shrink-0 flex-col items-center justify-center rounded-[14px] border p-px", palette)}>
      <span className="w-[35px] text-center text-[12px] font-semibold leading-[1.35]">PT</span>
      <span className="text-[24px] font-bold leading-[1.3]">{number || "—"}</span>
    </div>
  )
}

function MoreMenuButton() {
  return (
    <button
      type="button"
      className="inline-flex size-6 shrink-0 items-center justify-center text-[#666d80] transition-colors hover:text-[#062357]"
      aria-label="More options"
    >
      <MoreVertical className="size-6" />
    </button>
  )
}

function PrepTestListCardShell({
  testId,
  ptNumber,
  badgeTone,
  title,
  titleClass,
  subtitle,
  subtitleClass = "font-medium",
  layout = "standard",
  hoverTone = "default",
  center,
  actions,
  expanded,
  expandedContent,
}: {
  testId: string
  ptNumber: number
  badgeTone: BadgeTone
  title: string
  titleClass: string
  subtitle: string
  subtitleClass?: string
  layout?: "standard" | "completed"
  hoverTone?: PrepTestListCardHoverTone
  center?: ReactNode
  actions: ReactNode
  expanded?: boolean
  expandedContent?: ReactNode
}) {
  const hoverClass = PREPTEST_LIST_CARD_HOVER_CLASS[hoverTone]

  return (
    <article
      className={cn(PREPTEST_LIST_CARD_SHELL_BASE_CLASS, hoverClass.shell)}
      data-testid={`preptest-list-row-${testId}`}
    >
      <div
        className={cn(
          "flex h-[110px] items-center gap-4 px-6",
          hoverClass.row,
          layout === "completed" ? "justify-between" : undefined,
          expanded ? "rounded-t-[16px] border-b border-[#dfe1e7]" : undefined,
        )}
      >
        <div className={cn("flex min-w-0 items-center gap-6", layout === "standard" ? "flex-1" : "shrink-0")}>
          <PtBadge number={ptNumber} tone={badgeTone} />
          <div className="flex min-w-0 flex-col gap-2">
            <p className={cn("truncate text-[24px] font-bold leading-[1.3]", titleClass)}>{title}</p>
            <p
              className={cn(
                "truncate text-[14px] leading-[1.5] tracking-[0.28px] text-[#666d80]",
                subtitleClass,
              )}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {center ? <div className="flex min-w-0 flex-1 items-center justify-center gap-4">{center}</div> : null}

        <div className="flex shrink-0 items-center gap-4">
          {actions}
          <MoreMenuButton />
        </div>
      </div>

      {expandedContent}
    </article>
  )
}

function PrepTestListCard({
  item,
  starting,
  startingBlindReview,
  expanded,
  onToggleExpanded,
  onPrimary,
  onBlindReview,
  onViewResult,
}: {
  item: PrepTestPoolItem
  starting: boolean
  startingBlindReview: boolean
  expanded: boolean
  onToggleExpanded: () => void
  onPrimary: () => void
  onBlindReview: () => void
  onViewResult: (sessionId: string) => void
}) {
  const ptNum = displayPrepTestNumber(item)
  const isCompleted = item.status === "completed"
  const blindReviewPending = item.blindReviewStatus != null
  const badgeTone: BadgeTone = isCompleted ? "success" : "default"
  const titleClass = isCompleted ? "text-[#287f6e]" : "text-[#0d47a1]"
  const historyRows = buildPoolHistoryRows(item, { includeFallback: isCompleted })
  const latestAttempt = historyRows[0] ?? null
  const displayScore = poolCardDisplayScore(item, latestAttempt, historyRows)
  const canExpand = historyRows.length > 0
  const showScoreBlock = isCompleted && (displayScore != null || canExpand)

  const primaryLabel = isCompleted ? "Retake" : item.status === "in_progress" && !blindReviewPending ? "Continue" : "Start"

  const action = blindReviewPending ? (
    <button
      type="button"
      disabled={startingBlindReview}
      onClick={onBlindReview}
      className={BLIND_REVIEW_ACTION_CLASS}
    >
      {startingBlindReview ? "…" : "Blind Review"}
    </button>
  ) : (
    <button
      type="button"
      disabled={starting}
      onClick={onPrimary}
      className={isCompleted ? RETAKE_ACTION_CLASS : PRIMARY_ACTION_CLASS}
    >
      {starting ? "…" : isCompleted ? (
        <>
          <RefreshCw className="size-5 shrink-0" aria-hidden />
          {primaryLabel}
        </>
      ) : (
        primaryLabel
      )}
    </button>
  )

  const center = showScoreBlock ? (
    <>
      {!expanded && displayScore != null ? <ScoreBadge score={displayScore} /> : null}
      {canExpand ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="inline-flex size-6 shrink-0 items-center justify-center text-[#666d80] transition-colors hover:text-[#062357]"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse attempt history" : "Expand attempt history"}
        >
          <ChevronDown className={cn("size-6 transition-transform", expanded && "rotate-180")} />
        </button>
      ) : null}
    </>
  ) : null

  const expandedContent =
    canExpand && expanded ? (
      <ul>
        {historyRows.map((attempt, index) => (
          <li
            key={attempt.sessionId}
            className={cn(
              "flex flex-wrap items-center justify-between gap-4 bg-[#f6f8fa] py-7 pl-[112px] pr-6",
              index < historyRows.length - 1 ? "border-b border-[#dfe1e7]" : "rounded-b-[16px]",
            )}
          >
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[#062357]">
                {formatCompletedDate(attempt.completedAt)}
              </p>
              <p className="text-sm font-medium leading-normal tracking-[0.28px] text-[#666d80]">
                {attemptDetailLabel(attempt)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <AttemptScoreBox attempt={attempt} />
              <button type="button" onClick={() => onViewResult(attempt.sessionId)} className={RESULT_ACTION_CLASS}>
                Result
                <ChevronRight className="size-5 shrink-0" aria-hidden />
              </button>
              <MoreMenuButton />
            </div>
          </li>
        ))}
      </ul>
    ) : null

  return (
    <PrepTestListCardShell
      testId={item.id}
      ptNumber={ptNum}
      badgeTone={badgeTone}
      title={statusTitle(item)}
      titleClass={titleClass}
      subtitle={statusSubtitle(item)}
      layout={isCompleted ? "completed" : "standard"}
      hoverTone={isCompleted ? "success" : "default"}
      center={center}
      actions={action}
      expanded={expanded}
      expandedContent={expandedContent}
    />
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
  const [startingBlindReviewId, setStartingBlindReviewId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
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

  function filterTabLabel(tabId: PrepTestPoolFilter): string {
    const base = FILTER_TABS.find((t) => t.id === tabId)?.label ?? tabId
    if (tabId === "all" || tabId === "blind_review") return base
    return `${base} (${statusCounts[tabId]})`
  }

  async function handlePrimary(item: PrepTestPoolItem) {
    setStartingId(item.id)
    setError(null)
    try {
      if (item.status === "fresh" || item.status === "completed") {
        await practiceApi.startPrepTest({ prepTestId: item.id })
      }
      navigate(
        item.status === "completed" ? prepTestHubHref(item.id, { retake: true }) : prepTestHubHref(item.id),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start PrepTest")
    } finally {
      setStartingId(null)
    }
  }

  async function handleBlindReview(item: PrepTestPoolItem) {
    setStartingBlindReviewId(item.id)
    setError(null)
    try {
      if (item.blindReviewStatus === "eligible") {
        await practiceApi.startBlindReview(item.id)
      }
      const detail = await practiceApi.getBlindReviewDetail(item.id)
      const firstSessionId = firstBlindReviewSectionSessionId(detail)
      if (firstSessionId) {
        navigate(blindReviewSectionSessionPath(item.id, firstSessionId))
        return
      }
      navigate(`/app/practice/blind-review/${encodeURIComponent(item.id)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start blind review")
    } finally {
      setStartingBlindReviewId(null)
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function viewResult(sessionId: string) {
    navigate(`/app/analytics/preptests/results/${encodeURIComponent(sessionId)}`)
  }

  if (legacyTestId) {
    return <Navigate to={prepTestHubHref(legacyTestId)} replace />
  }

  if (loading) {
    return (
      <StudentMain>
        <StudentPageLoader centered className="min-h-[min(480px,70vh)]" label="Loading PrepTests…" />
      </StudentMain>
    )
  }

  return (
    <StudentMain>
      <div className="mb-6 flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <p className="max-w-[908px] text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#666d80]">
            Try a free PrepTest to gauge your starting point and see how to improve. When you&apos;re done, our
            Insights will tell you what to work on.
          </p>
          <button
            type="button"
            disabled
            className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 self-start rounded-[16px] py-2 pl-2 pr-4 text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-[#0d47a1] lg:self-center"
          >
            PrepTest settings
            <Settings className="size-4 shrink-0" aria-hidden />
          </button>
        </div>

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
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {prepTests.length === 0 ? (
        <p className="text-sm text-[#666d80]">No PrepTests match this filter.</p>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {prepTests.map((item) => (
              <PrepTestListCard
                key={item.id}
                item={item}
                starting={startingId === item.id}
                startingBlindReview={startingBlindReviewId === item.id}
                expanded={expandedIds.has(item.id)}
                onToggleExpanded={() => toggleExpanded(item.id)}
                onPrimary={() => void handlePrimary(item)}
                onBlindReview={() => void handleBlindReview(item)}
                onViewResult={viewResult}
              />
            ))}
          </div>
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
                <span className="min-w-18 text-center text-sm font-medium tabular-nums text-[#062357]">
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
  filterTabLabel: (tabId: PrepTestPoolFilter) => string
}) {
  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <h2 className="shrink-0 text-[24px] font-bold leading-[1.3] text-[#062357]">Start your PrepTest</h2>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-6 overflow-x-auto pb-1 lg:gap-6">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={active ? FILTER_PILL_ACTIVE_CLASS : FILTER_PILL_INACTIVE_CLASS}
            >
              {filterTabLabel(tab.id)}
            </button>
          )
        })}
        <div className="w-[160px] shrink-0">
          <label htmlFor="preptest-sort" className="sr-only">
            Sort PrepTests
          </label>
          <FigmaDropdown
            id="preptest-sort"
            variant="pill"
            value={sort}
            onChange={(next) => setSort(next as (typeof SORT_OPTIONS)[number])}
            options={SORT_OPTIONS.map((option) => ({ value: option, label: option }))}
          />
        </div>
      </div>
    </div>
  )
}

export { PracticePrepTestsListPage }
