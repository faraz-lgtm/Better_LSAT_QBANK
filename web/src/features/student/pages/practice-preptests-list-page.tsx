import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"

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
import {
  buildPoolHistoryRows,
  getAttemptDisplayScores,
  filterPrepTestPoolItems,
  poolCardDisplayScore,
} from "@/features/student/preptests/preptest-pool-display"
import { PrepTestScoreText } from "@/features/student/preptests/preptest-score-badge"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { prepTestFullTestUnavailableLabel } from "@/lib/prep-test-pool-availability"

/** First paint shows a short list; “See more” loads the full filtered pool. */
const INITIAL_PAGE_SIZE = 5
/**
 * Chunk size when expanding to the full list. Keep ≤ the edge `listPrepTestPool`
 * max (deployed functions may still cap at 50).
 */
const LOAD_ALL_CHUNK_SIZE = 50

const PREPTEST_FIGMA = "/figma/preptest"

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
  "inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] border border-[var(--primary-border)] bg-[var(--primary)] px-4 py-2 text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
const FILTER_PILL_INACTIVE_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 py-2 text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-[var(--primary)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--greyscale-25)]"

const CONTINUE_ACTION_CLASS =
  "ds-btn-sm h-10 w-[106px] shrink-0 rounded-[12px] px-4 py-2 text-[14px] font-semibold leading-[1.5] tracking-[0.28px]"
const RETAKE_ACTION_CLASS =
  "inline-flex h-10 w-[106px] shrink-0 items-center justify-center gap-2 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 py-2 text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--greyscale-25)]"
const BLIND_REVIEW_ACTION_CLASS =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-[12px] border border-[#ffe5b7] bg-[#ffbd4c] px-4 py-2 text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f5b03f] disabled:opacity-60"
const RESULT_ACTION_CLASS =
  "inline-flex h-10 w-[106px] shrink-0 items-center justify-center gap-2 rounded-[12px] border border-[var(--primary)] bg-[var(--primary-0)] px-4 py-2 text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--primary)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-25)]"

/** Default white card; Figma `19956:59132` on hover (collapsed only). */
const PREPTEST_CARD_SHELL_CLASS =
  "border-[var(--greyscale-100)] bg-[var(--greyscale-0)] transition-colors hover:border-[var(--primary)]"
const PREPTEST_CARD_SHELL_HOVER_FILL_CLASS = "hover:bg-[var(--primary-25)]"
const PREPTEST_CARD_SHELL_MUTED_CLASS = "border-[var(--greyscale-100)] bg-[var(--greyscale-0)]"

type BadgeTone = "default" | "success" | "muted"

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

function displayUnavailableLabel(label: string): string {
  if (label === "Available only for drills and sections") {
    return "Available only for drills and Section"
  }
  return label
}

function restrictedTitle(item: PrepTestPoolItem): string {
  if (item.inDrills && item.inSections) return "Drills and Section"
  if (item.inDrills) return "Drills"
  if (item.inSections) return "Section"
  return "Not available"
}

function statusTitle(item: PrepTestPoolItem, isPoolRestricted: boolean): string {
  if (isPoolRestricted) return restrictedTitle(item)
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
  return ""
}

function filterTabLabel(
  tab: (typeof FILTER_TABS)[number],
  counts: PrepTestPoolStatusCounts,
): string {
  if (tab.id === "fresh" || tab.id === "in_progress" || tab.id === "completed") {
    return `${tab.label} (${counts[tab.id]})`
  }
  return tab.label
}

function FigmaIcon({
  name,
  width,
  height,
  className,
}: {
  name: string
  width: number
  height: number
  className?: string
}) {
  return (
    <img
      src={`${PREPTEST_FIGMA}/${name}.svg`}
      alt=""
      width={width}
      height={height}
      className={cn("max-w-none shrink-0 object-contain", className)}
      draggable={false}
    />
  )
}

function PtBadge({ number, tone = "default" }: { number: number; tone?: BadgeTone }) {
  const palette =
    tone === "muted"
      ? "border-[var(--greyscale-500)] bg-[var(--greyscale-25)] text-[var(--greyscale-500)]"
      : tone === "success"
        ? "border-[#287f6e] bg-[#effefa] text-[#287f6e]"
        : "border-[var(--primary)] bg-[var(--primary-0)] text-[var(--primary)]"
  return (
    <div
      data-pt-badge
      className={cn("relative box-border shrink-0 overflow-hidden rounded-[8px] border", palette)}
      style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
    >
      {/* Figma `I19956:59132;20920:43051` — 24×24 stack inset 4px inside the 32px badge */}
      <div
        className="absolute flex flex-col items-center overflow-hidden"
        style={{ top: 4, left: 4, width: 24, height: 24 }}
      >
        <span
          className="flex items-center justify-center font-bold"
          style={{ height: 10, fontSize: 10, lineHeight: "10px", letterSpacing: 0.2 }}
        >
          PT
        </span>
        <span
          className="flex items-center justify-center font-bold"
          style={{ height: 14, width: 24, fontSize: 12, lineHeight: "14px", letterSpacing: 0.24 }}
        >
          {number || "—"}
        </span>
      </div>
    </div>
  )
}

function MoreMenuButton() {
  return (
    <button
      type="button"
      className="inline-flex size-6 shrink-0 items-center justify-center"
      aria-label="More options"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="inline-flex size-6 items-center justify-center">
        <FigmaIcon name="dots-vertical" width={24} height={24} className="size-6" />
      </span>
    </button>
  )
}

function PrepTestIdentity({
  ptNumber,
  badgeTone,
  title,
  titleClass,
  subtitle,
}: {
  ptNumber: number
  badgeTone: BadgeTone
  title: string
  titleClass: string
  subtitle: string
}) {
  return (
    <>
      <PtBadge number={ptNumber} tone={badgeTone} />
      <div className="flex min-w-0 flex-col items-start justify-center gap-2">
        <p className={cn("truncate text-[16px] font-semibold leading-[1.5] tracking-[0.32px]", titleClass)}>{title}</p>
        {subtitle ? (
          <p className="truncate text-[12px] font-medium leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  )
}

function PrepTestListCardShell({
  testId,
  ptNumber,
  badgeTone,
  title,
  titleClass,
  subtitle,
  hoverShellClass,
  interactive,
  starting,
  onActivate,
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
  hoverShellClass: string
  interactive?: boolean
  starting?: boolean
  onActivate?: () => void
  center?: ReactNode
  actions: ReactNode
  expanded?: boolean
  expandedContent?: ReactNode
}) {
  const identityClass = cn(
    "flex min-w-0 items-center gap-4",
    center ? "w-[198px] shrink-0" : "min-h-0 flex-1",
  )
  const identity = (
    <PrepTestIdentity
      ptNumber={ptNumber}
      badgeTone={badgeTone}
      title={title}
      titleClass={titleClass}
      subtitle={subtitle}
    />
  )

  return (
    <article
      className={cn(
        "group w-full overflow-hidden rounded-[16px] border border-solid",
        hoverShellClass,
        interactive && "cursor-pointer",
      )}
      data-testid={`preptest-list-row-${testId}`}
      data-muted={badgeTone === "muted" ? "true" : undefined}
    >
      <div
        className={cn(
          "flex h-[82px] items-center transition-colors",
          center ? "justify-between px-4" : "gap-4 p-4",
          expanded ? "rounded-t-[16px]" : undefined,
          !expanded && badgeTone !== "muted" && "group-hover:bg-[var(--primary-25)]",
        )}
      >
        {interactive ? (
          <button
            type="button"
            disabled={starting}
            aria-busy={starting || undefined}
            aria-label={`Take PrepTest ${ptNumber || ""}`.trim()}
            onClick={onActivate}
            className={cn(identityClass, "bg-transparent text-left")}
          >
            {identity}
          </button>
        ) : (
          <div className={identityClass}>{identity}</div>
        )}

        {center}

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
  const unavailableLabel = prepTestFullTestUnavailableLabel({
    inDrills: item.inDrills,
    inSections: item.inSections,
    inTests: item.inTests,
  })
  const isPoolRestricted = unavailableLabel != null && !blindReviewPending
  const isReadyToTake = item.status === "fresh" && !isPoolRestricted && !blindReviewPending
  const badgeTone: BadgeTone = isPoolRestricted ? "muted" : isCompleted ? "success" : "default"
  const titleClass = isPoolRestricted
    ? "text-[var(--greyscale-500)]"
    : isCompleted
      ? "text-[#287f6e]"
      : "text-[var(--primary)]"
  const historyRows = buildPoolHistoryRows(item, { includeFallback: isCompleted })
  const latestAttempt = historyRows[0] ?? null
  const displayScore = poolCardDisplayScore(item, latestAttempt, historyRows)
  const latestScores = latestAttempt
    ? getAttemptDisplayScores(latestAttempt)
    : { test: displayScore, br: item.blindReviewScaledScore }
  const canExpand = !isPoolRestricted && historyRows.length > 0
  const showScoreBlock = !isPoolRestricted && isCompleted && (displayScore != null || canExpand)

  const action = blindReviewPending ? (
    <button
      type="button"
      disabled={startingBlindReview}
      onClick={onBlindReview}
      className={BLIND_REVIEW_ACTION_CLASS}
    >
      {startingBlindReview ? "…" : "Blind Review"}
    </button>
  ) : unavailableLabel ? (
    <span
      className="inline-flex h-10 max-w-[280px] items-center justify-center gap-2 rounded-2xl px-4 py-2 text-center text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]"
      title={unavailableLabel}
    >
      <span className="inline-flex size-5 shrink-0 items-center justify-center">
        <FigmaIcon name="alert-circle" width={20} height={20} className="size-5" />
      </span>
      {displayUnavailableLabel(unavailableLabel)}
    </span>
  ) : isCompleted ? (
    <button type="button" disabled={starting} onClick={onPrimary} className={RETAKE_ACTION_CLASS}>
      <span className="inline-flex size-4 shrink-0 items-center justify-center">
        <FigmaIcon name="reset" width={16} height={16} className="size-4" />
      </span>
      {starting ? "…" : "Retake"}
    </button>
  ) : isReadyToTake ? null : (
    <button type="button" disabled={starting} onClick={onPrimary} className={CONTINUE_ACTION_CLASS}>
      {starting ? "…" : "Continue"}
    </button>
  )

  const center = showScoreBlock ? (
    <button
      type="button"
      onClick={onToggleExpanded}
      disabled={!canExpand}
      className={cn(
        "inline-flex h-[52px] w-max shrink-0 items-center justify-center rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6",
        expanded ? "gap-0" : "gap-4",
        canExpand ? "cursor-pointer" : "cursor-default",
      )}
      aria-expanded={canExpand ? expanded : undefined}
      aria-label={
        canExpand ? (expanded ? "Collapse attempt history" : "Expand attempt history") : undefined
      }
    >
      {!expanded ? <PrepTestScoreText variant="header" test={latestScores.test} br={latestScores.br} /> : null}
      {canExpand ? (
        <span className="relative inline-flex size-6 shrink-0 items-center justify-center">
          <FigmaIcon
            name="chevron-down-primary"
            width={24}
            height={24}
            className={cn("size-6 max-w-none", expanded && "rotate-180")}
          />
        </span>
      ) : null}
    </button>
  ) : null

  const expandedContent =
    canExpand && expanded ? (
      <ul>
        {historyRows.map((attempt, index) => {
          const scores = getAttemptDisplayScores(attempt)
          const isLast = index === historyRows.length - 1
          return (
            <li
              key={attempt.sessionId}
              className={cn(
                "flex h-[68px] items-center justify-between bg-[var(--greyscale-25)] px-4 py-2",
                isLast
                  ? "rounded-b-[16px] border-t border-[var(--greyscale-100)]"
                  : "border-t border-[var(--greyscale-100)]",
              )}
            >
              <div className="flex w-[198px] shrink-0 items-center">
                <div className="flex min-w-0 flex-col items-start justify-center gap-2">
                  <p className="truncate text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--primary-800)]">
                    {formatCompletedDate(attempt.completedAt)}
                  </p>
                  <p className="truncate text-[12px] font-medium leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
                    {attemptDetailLabel(attempt)}
                  </p>
                </div>
              </div>
              <div className="inline-flex h-10 w-max shrink-0 items-center justify-center rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6">
                <PrepTestScoreText variant="history" test={scores.test} br={scores.br} />
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <button type="button" onClick={() => onViewResult(attempt.sessionId)} className={RESULT_ACTION_CLASS}>
                  Result
                  <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
                    <FigmaIcon name="chevron-right" width={16} height={16} className="size-4 max-w-none" />
                  </span>
                </button>
                <MoreMenuButton />
              </div>
            </li>
          )
        })}
      </ul>
    ) : null

  const hoverShellClass = isPoolRestricted
    ? PREPTEST_CARD_SHELL_MUTED_CLASS
    : cn(PREPTEST_CARD_SHELL_CLASS, !expanded && PREPTEST_CARD_SHELL_HOVER_FILL_CLASS)

  return (
    <PrepTestListCardShell
      testId={item.id}
      ptNumber={ptNum}
      badgeTone={badgeTone}
      title={statusTitle(item, isPoolRestricted)}
      titleClass={titleClass}
      subtitle={statusSubtitle(item)}
      hoverShellClass={hoverShellClass}
      interactive={isReadyToTake}
      starting={isReadyToTake && starting}
      onActivate={isReadyToTake ? onPrimary : undefined}
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
  const [prepTests, setPrepTests] = useState<PrepTestPoolItem[]>([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState<PrepTestPoolStatusCounts>(EMPTY_STATUS_COUNTS)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [startingBlindReviewId, setStartingBlindReviewId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)

  const poolSort = sort === "Newest" ? "newest" : "oldest"

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const out = await practiceApi.listPrepTestPool({
          filter,
          page: 1,
          pageSize: INITIAL_PAGE_SIZE,
          sort: poolSort,
        })
        if (!cancelled) {
          setPrepTests(out.prepTests)
          setTotal(out.total)
          setStatusCounts(out.statusCounts ?? EMPTY_STATUS_COUNTS)
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
  }, [practiceApi, filter, poolSort])

  const visiblePrepTests = useMemo(() => filterPrepTestPoolItems(prepTests, filter), [prepTests, filter])
  const hasMore = visiblePrepTests.length < total

  async function handleSeeMore() {
    if (loadingMore || loading || !hasMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const collected: PrepTestPoolItem[] = []
      const seen = new Set<string>()
      let nextTotal = total
      let page = 1

      // One click should expand to the full pool. Page in chunks so this still
      // works when the edge function caps pageSize (historically 50).
      while (collected.length < nextTotal) {
        const out = await practiceApi.listPrepTestPool({
          filter,
          page,
          pageSize: LOAD_ALL_CHUNK_SIZE,
          sort: poolSort,
        })
        nextTotal = out.total
        if (out.statusCounts) setStatusCounts(out.statusCounts)
        for (const item of out.prepTests) {
          if (seen.has(item.id)) continue
          seen.add(item.id)
          collected.push(item)
        }
        if (out.prepTests.length === 0) break
        page += 1
        // Safety: avoid an infinite loop if total is stale vs returned rows.
        if (page > Math.ceil(Math.max(nextTotal, 1) / LOAD_ALL_CHUNK_SIZE) + 2) break
      }

      setPrepTests(collected)
      // Prefer the rows we actually collected so “See more” cannot stick when
      // the API total is higher than what pagination returns.
      setTotal(collected.length)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PrepTests")
    } finally {
      setLoadingMore(false)
    }
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
      <div className="flex flex-col gap-6">
        <p className="max-w-[756px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
          Here you can find all official Prep Tests from the Law School Admission Council. When you're finished a PT,
          our Insights will tell you what to work on
        </p>

        <PrepTestListFilters
          filter={filter}
          setFilter={(f) => {
            setLoading(true)
            setPrepTests([])
            setFilter(f)
          }}
          sort={sort}
          setSort={(s) => {
            setLoading(true)
            setPrepTests([])
            setSort(s)
          }}
          statusCounts={statusCounts}
        />

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {visiblePrepTests.length === 0 ? (
          <p className="text-sm text-[var(--greyscale-500)]">No PrepTests match this filter.</p>
        ) : (
          <>
            <div className="flex flex-col gap-6">
              {visiblePrepTests.map((item) => (
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
            {hasMore ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void handleSeeMore()}
                  className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--primary)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--greyscale-25)] disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "See more"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </StudentMain>
  )
}

function PrepTestListFilters({
  filter,
  setFilter,
  sort,
  setSort,
  statusCounts,
}: {
  filter: PrepTestPoolFilter
  setFilter: (f: PrepTestPoolFilter) => void
  sort: (typeof SORT_OPTIONS)[number]
  setSort: (s: (typeof SORT_OPTIONS)[number]) => void
  statusCounts: PrepTestPoolStatusCounts
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <h2 className="shrink-0 text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--primary-800)]">
        Start your PrepTest
      </h2>
      <div className="flex min-w-0 flex-wrap items-center gap-6">
        <div className="min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.id
              const label = filterTabLabel(tab, statusCounts)
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={active ? FILTER_PILL_ACTIVE_CLASS : FILTER_PILL_INACTIVE_CLASS}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="relative z-20 w-[106px] shrink-0">
          <label htmlFor="preptest-sort" className="sr-only">
            Sort PrepTests
          </label>
          <FigmaDropdown
            id="preptest-sort"
            variant="pill"
            size="sm"
            menuAlign="end"
            value={sort}
            onChange={(next) => setSort(next as (typeof SORT_OPTIONS)[number])}
            options={SORT_OPTIONS.map((option) => ({ value: option, label: option }))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}

export { PracticePrepTestsListPage }
