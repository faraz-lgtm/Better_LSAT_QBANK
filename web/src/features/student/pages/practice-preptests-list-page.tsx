import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PrepTestPreviewNotice } from "@/features/student/components/prep-test-preview-notice"
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
import { allowsPrepTestUnauthenticatedPreview } from "@/lib/dev/prep-test-ui-preview"
import { createPracticeApi } from "@/lib/api/practice"
import {
  countPracticePrepTestListRowsByFilter,
  filterPracticePrepTestListRows,
  mockPracticePrepTestListRows,
  type PracticePrepTestListFilter,
  type PracticePrepTestListRow,
  type PrepTestCompletedAttempt,
} from "@/features/student/lib/mock-practice-preptest-list"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  MoreVertical,
  RefreshCw,
  Share2,
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

const FILTER_PILL_ACTIVE_CLASS = "ds-btn h-[52px] shrink-0 rounded-2xl px-4 text-base font-semibold tracking-[0.32px]"
const FILTER_PILL_INACTIVE_CLASS =
  "inline-flex h-[52px] shrink-0 items-center justify-center whitespace-nowrap rounded-2xl border border-[#dfe1e7] bg-white px-4 text-base font-medium tracking-[0.32px] text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"

const PRIMARY_ACTION_CLASS = "ds-btn h-[52px] w-[148px] shrink-0 text-base tracking-[0.32px]"
const RETAKE_ACTION_CLASS =
  "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#dfe1e7] bg-white text-base font-semibold tracking-[0.32px] text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"
const LOCKED_START_ACTION_CLASS =
  "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#dfe1e7] bg-white text-base font-semibold tracking-[0.32px] text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)]"
const BLIND_REVIEW_ACTION_CLASS =
  "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center rounded-2xl border border-[#ffe5b7] bg-[#ffbd4c] text-base font-semibold tracking-[0.32px] text-[#062357] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f5b03f] disabled:opacity-60"
const RESULT_ACTION_CLASS =
  "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#0d47a1] bg-[#f3f7ff] text-base font-semibold tracking-[0.32px] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#e8f0ff]"
const INFO_ACTION_CLASS =
  "inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold tracking-[0.32px] text-[#666d80]"

type BadgeTone = "default" | "muted" | "success"

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

function badgeToneForMock(variant: PracticePrepTestListRow["variant"]): BadgeTone {
  if (variant === "completed") return "success"
  if (variant === "drill_only" || variant === "not_available" || variant === "drills_and_section") return "muted"
  return "default"
}

function titleClassForMock(variant: PracticePrepTestListRow["variant"]): string {
  if (variant === "completed") return "text-[#287f6e]"
  if (variant === "drill_only" || variant === "not_available" || variant === "drills_and_section") {
    return "text-[#666d80]"
  }
  return "text-[#0d47a1]"
}

function subtitleClassForMock(variant: PracticePrepTestListRow["variant"]): string {
  if (variant === "locked" || variant === "drill_only" || variant === "not_available" || variant === "drills_and_section") {
    return "font-semibold"
  }
  return "font-medium"
}

function PtBadge({ number, tone }: { number: number; tone: BadgeTone }) {
  const palette =
    tone === "success"
      ? "border-[#287f6e] bg-[#effefa] text-[#287f6e]"
      : tone === "muted"
        ? "border-[#666d80] bg-[#f6f8fa] text-[#666d80]"
        : "border-[#0d47a1] bg-[#f3f7ff] text-[#0d47a1]"
  return (
    <div className={cn("flex size-16 shrink-0 flex-col items-center justify-center rounded-[14px] border p-px", palette)}>
      <span className="w-[35px] text-center text-xs font-semibold leading-[1.35]">PT</span>
      <span className="text-2xl font-bold leading-[1.3]">{number || "—"}</span>
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

function MockAttemptScore({ label }: { label: string }) {
  const [testScore, brPart] = label.split("·").map((part) => part.trim())
  const hasBr = brPart?.includes("BR")

  return (
    <div className="inline-flex h-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[#dfe1e7] bg-white px-6">
      {hasBr ? (
        <>
          <span className="text-2xl font-bold leading-[1.3] text-[#062357]">{testScore}</span>
          <span className="text-2xl font-bold leading-[1.3] text-[#818898]">{` · ${brPart}`}</span>
        </>
      ) : (
        <span className="text-2xl font-bold leading-[1.3] text-[#062357]">{label}</span>
      )}
    </div>
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
  center?: ReactNode
  actions: ReactNode
  expanded?: boolean
  expandedContent?: ReactNode
}) {
  return (
    <article
      className="w-full overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
      data-testid={`preptest-list-row-${testId}`}
    >
      <div
        className={cn(
          "flex h-[110px] items-center gap-4 px-6",
          layout === "completed" ? "justify-between" : undefined,
          expanded ? "rounded-t-2xl border-b border-[#dfe1e7]" : undefined,
        )}
      >
        <div className={cn("flex min-w-0 items-center gap-6", layout === "standard" ? "flex-1" : "shrink-0")}>
          <PtBadge number={ptNumber} tone={badgeTone} />
          <div className="flex min-w-0 flex-col gap-2">
            <p className={cn("truncate text-2xl font-bold leading-[1.3]", titleClass)}>{title}</p>
            <p
              className={cn(
                "truncate text-sm leading-normal tracking-[0.28px] text-[#666d80]",
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

function MockPrepTestListCard({
  row,
  expanded,
  onToggleExpanded,
  onNavigate,
}: {
  row: PracticePrepTestListRow
  expanded: boolean
  onToggleExpanded: () => void
  onNavigate: (id: string) => void
}) {
  const isCompleted = row.variant === "completed"
  const canExpand = (row.completedAttempts?.length ?? 0) > 0

  function renderAction() {
    switch (row.variant) {
      case "ready":
        return (
          <button type="button" className={PRIMARY_ACTION_CLASS} onClick={() => onNavigate(row.id)}>
            Start
          </button>
        )
      case "in_process":
        return (
          <button type="button" className={BLIND_REVIEW_ACTION_CLASS} onClick={() => onNavigate(row.id)}>
            Blind Review
          </button>
        )
      case "locked":
        return (
          <button type="button" className={LOCKED_START_ACTION_CLASS} disabled>
            <Lock className="size-5 shrink-0" aria-hidden />
            Start
          </button>
        )
      case "drill_only":
        return (
          <div className={INFO_ACTION_CLASS}>
            <AlertCircle className="size-5 shrink-0" aria-hidden />
            Available only for drills
          </div>
        )
      case "drills_and_section":
        return (
          <div className={INFO_ACTION_CLASS}>
            <AlertCircle className="size-5 shrink-0" aria-hidden />
            Available only for drills and Section
          </div>
        )
      case "not_available":
        return (
          <div className={INFO_ACTION_CLASS}>
            <AlertCircle className="size-5 shrink-0" aria-hidden />
            Not Available
          </div>
        )
      case "completed":
        return (
          <button type="button" className={RETAKE_ACTION_CLASS} onClick={() => onNavigate(row.id)}>
            <RefreshCw className="size-5 shrink-0" aria-hidden />
            Retake
          </button>
        )
      default:
        return null
    }
  }

  const center =
    isCompleted && canExpand ? (
      <>
        {!expanded && row.completedSummaryScore != null ? <ScoreBadge score={row.completedSummaryScore} /> : null}
        <button
          type="button"
          onClick={onToggleExpanded}
          className="inline-flex size-6 shrink-0 items-center justify-center text-[#666d80] transition-colors hover:text-[#062357]"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse attempt history" : "Expand attempt history"}
        >
          <ChevronDown className={cn("size-6 transition-transform", expanded && "rotate-180")} />
        </button>
      </>
    ) : null

  const expandedContent =
    isCompleted && canExpand && expanded ? (
      <ul>
        {row.completedAttempts!.map((attempt: PrepTestCompletedAttempt, index: number) => (
          <li
            key={`${attempt.headline}-${index}`}
            className={cn(
              "flex flex-wrap items-center justify-between gap-4 bg-[#f6f8fa] py-7 pl-[112px] pr-6",
              index < row.completedAttempts!.length - 1 ? "border-b border-[#dfe1e7]" : "rounded-b-2xl",
            )}
          >
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[#062357]">{attempt.headline}</p>
              <p className="text-sm font-medium leading-normal tracking-[0.28px] text-[#666d80]">{attempt.detail}</p>
            </div>
            <div className="flex items-center gap-4">
              <MockAttemptScore label={attempt.scoreLabel} />
              <button
                type="button"
                className={RESULT_ACTION_CLASS}
                onClick={() => onNavigate(attempt.resultTestId)}
              >
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
      testId={row.id}
      ptNumber={row.prepTestNumber}
      badgeTone={badgeToneForMock(row.variant)}
      title={row.title}
      titleClass={titleClassForMock(row.variant)}
      subtitle={row.subtitle}
      subtitleClass={subtitleClassForMock(row.variant)}
      layout={isCompleted ? "completed" : "standard"}
      center={center}
      actions={renderAction()}
      expanded={expanded}
      expandedContent={expandedContent}
    />
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
              index < historyRows.length - 1 ? "border-b border-[#dfe1e7]" : "rounded-b-2xl",
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
  const previewAllowed = allowsPrepTestUnauthenticatedPreview()

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
  const [useMockPreview, setUseMockPreview] = useState(false)

  useEffect(() => {
    if (!previewAllowed) {
      setUseMockPreview(false)
      return
    }
    let cancelled = false
    const supabase = getSupabaseBrowserClient()
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      const mock = !data.session
      setUseMockPreview(mock)
      if (mock) {
        setExpandedIds(
          new Set(
            mockPracticePrepTestListRows.filter((row) => row.completedDefaultExpanded).map((row) => row.id),
          ),
        )
      }
    })
    return () => {
      cancelled = true
    }
  }, [previewAllowed])

  useEffect(() => {
    if (useMockPreview) {
      setLoading(false)
      setError(null)
      return
    }

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
  }, [practiceApi, filter, sort, page, useMockPreview])

  const mockRows = useMemo(() => {
    const filtered = filterPracticePrepTestListRows(
      mockPracticePrepTestListRows,
      filter as PracticePrepTestListFilter,
    )
    const sorted = [...filtered].sort((a, b) =>
      sort === "Newest" ? b.prepTestNumber - a.prepTestNumber : a.prepTestNumber - b.prepTestNumber,
    )
    return sorted
  }, [filter, sort])

  const mockStatusCounts = useMemo(
    () => ({
      all: countPracticePrepTestListRowsByFilter(mockPracticePrepTestListRows, "all"),
      fresh: countPracticePrepTestListRowsByFilter(mockPracticePrepTestListRows, "fresh"),
      in_progress: countPracticePrepTestListRowsByFilter(mockPracticePrepTestListRows, "in_progress"),
      completed: countPracticePrepTestListRowsByFilter(mockPracticePrepTestListRows, "completed"),
      blind_review: countPracticePrepTestListRowsByFilter(mockPracticePrepTestListRows, "blind_review"),
    }),
    [],
  )

  const totalPages = Math.max(1, Math.ceil((useMockPreview ? mockRows.length : total) / PAGE_SIZE))
  const pageStart = useMockPreview
    ? mockRows.length === 0
      ? 0
      : 1
    : total === 0
      ? 0
      : (page - 1) * PAGE_SIZE + 1
  const pageEnd = useMockPreview ? mockRows.length : Math.min(page * PAGE_SIZE, total)

  function filterTabLabel(tabId: PrepTestPoolFilter): string {
    const base = FILTER_TABS.find((t) => t.id === tabId)?.label ?? tabId
    if (tabId === "all" || tabId === "blind_review") return base
    const counts = useMockPreview ? mockStatusCounts : statusCounts
    return `${base} (${counts[tabId]})`
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

  function navigateMockRow(id: string) {
    navigate(`/app/practice/preptest/${encodeURIComponent(id)}`)
  }

  if (legacyTestId) {
    return <Navigate to={`/app/practice/preptest/${encodeURIComponent(legacyTestId)}`} replace />
  }

  return (
    <StudentMain>
      <PrepTestPreviewNotice />

      <div className="mb-6 flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <p className="max-w-[908px] text-sm font-medium leading-normal tracking-[0.28px] text-[#666d80]">
            Try a free PrepTest to gauge your starting point and see how to improve. When you&apos;re done, our
            Insights will tell you what to work on.
          </p>
          <button
            type="button"
            disabled
            className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 self-start rounded-2xl py-2 pl-2 pr-4 text-xs font-semibold leading-normal tracking-[0.24px] text-[#0d47a1] lg:self-center"
          >
            PrepTest settings
            <Share2 className="size-4 shrink-0" aria-hidden />
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

      {loading ? (
        <StudentPageLoader label="Loading PrepTests…" />
      ) : useMockPreview ? (
        mockRows.length === 0 ? (
          <p className="text-sm text-[#666d80]">No PrepTests match this filter.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {mockRows.map((row) => (
              <MockPrepTestListCard
                key={row.id}
                row={row}
                expanded={expandedIds.has(row.id)}
                onToggleExpanded={() => toggleExpanded(row.id)}
                onNavigate={navigateMockRow}
              />
            ))}
          </div>
        )
      ) : prepTests.length === 0 ? (
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
      <h2 className="shrink-0 text-2xl font-bold leading-[1.3] text-[#062357]">Start your PrepTest</h2>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-6 overflow-x-auto pb-1">
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
        <div className="relative w-[160px] shrink-0">
          <label htmlFor="preptest-sort" className="sr-only">
            Sort PrepTests
          </label>
          <select
            id="preptest-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof SORT_OPTIONS)[number])}
            className="h-[52px] w-full appearance-none rounded-2xl border border-[#dfe1e7] bg-white px-3 pr-10 text-base font-medium tracking-[0.32px] text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/25"
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

export { PracticePrepTestsListPage }
