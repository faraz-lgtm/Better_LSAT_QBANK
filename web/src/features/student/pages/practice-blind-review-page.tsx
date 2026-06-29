import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
  BlindReviewPoolItem,
  BlindReviewPoolStatusCounts,
  BlindReviewStatus,
} from "@/features/student/blind-review/blind-review-types"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import type { PrepTestPoolAttempt } from "@/features/student/preptests/preptest-types"
import { buildPoolHistoryRows, poolCardDisplayScore } from "@/features/student/preptests/preptest-pool-display"
import { AttemptScoreBox, ScoreBadge } from "@/features/student/preptests/preptest-score-badge"
import { PREPTEST_LIST_HREF } from "@/features/student/preptests/preptest-routes"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PAGE_SIZE = 5

const FILTER_TABS: { id: "all" | BlindReviewStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "eligible", label: "Ready" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
]

const EMPTY_STATUS_COUNTS: BlindReviewPoolStatusCounts = {
  all: 0,
  eligible: 0,
  in_progress: 0,
  completed: 0,
}

/** Figma pool row hover — matches practice-preptests-list-page */
const BLIND_REVIEW_CARD_SHELL_BASE_CLASS =
  "w-full overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white transition-[border-color]"

type BlindReviewCardHoverTone = "default" | "success"

const BLIND_REVIEW_CARD_HOVER_CLASS: Record<
  BlindReviewCardHoverTone,
  { shell: string; row: string }
> = {
  default: {
    shell: "hover:border-[#0d47a1]",
    row: "transition-[background-color] hover:bg-[var(--primary-25)]",
  },
  success: {
    shell: "hover:border-[#287f6e]",
    row: "transition-[background-color] hover:bg-[#effefa]",
  },
}

function displayPrepTestNumber(item: BlindReviewPoolItem): number {
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

function statusTitle(status: BlindReviewStatus): string {
  if (status === "eligible") return "Ready"
  if (status === "in_progress") return "In Progress"
  return "Completed"
}

function statusSubtitle(item: BlindReviewPoolItem): string {
  if (item.status === "completed") {
    const date = item.blindReviewCompletedAt ?? item.completedAt
    return date ? formatCompletedDate(date) : `${item.questionCount} questions`
  }
  if (item.status === "in_progress") return "Blind Review"
  if (item.scaledScore != null) {
    return `Test score ${item.scaledScore} · ${item.questionCount} questions`
  }
  return `${item.questionCount} questions`
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

function PtBadge({ number, tone }: { number: number; tone: "default" | "muted" | "success" }) {
  const palette =
    tone === "success"
      ? "border-[#287f6e] bg-[#fff3ea] text-[#287f6e]"
      : tone === "muted"
        ? "border-[#666d80] bg-[#f6f8fa] text-[#666d80]"
        : "border-[#0d47a1] bg-[#f3f7ff] text-[#0d47a1]"
  return (
    <div
      className={cn("flex size-16 shrink-0 flex-col items-center justify-center rounded-[14px] border p-px", palette)}
    >
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

function BlindReviewListCard({
  item,
  expanded,
  onToggleExpanded,
  onPrimary,
  onViewResult,
}: {
  item: BlindReviewPoolItem
  expanded: boolean
  onToggleExpanded: () => void
  onPrimary: () => void
  onViewResult: (sessionId: string) => void
}) {
  const ptNum = displayPrepTestNumber(item)
  const isCompleted = item.status === "completed"
  const isInProgress = item.status === "in_progress"
  const badgeTone: "default" | "muted" | "success" = isCompleted ? "success" : "default"
  const titleClass = isCompleted ? "text-[#287f6e]" : "text-[#0d47a1]"
  const historyRows = buildPoolHistoryRows(
    {
      attempts: item.attempts ?? [],
      completedAt: item.blindReviewCompletedAt ?? item.completedAt,
      scaledScore: item.scaledScore,
      blindReviewScaledScore: item.blindReviewScaledScore,
      openPrepTestSessionId: item.prepTestSessionId,
      id: item.id,
    },
    { includeFallback: isCompleted },
  )
  const displayScore = poolCardDisplayScore(item, historyRows[0] ?? null, historyRows)
  const canExpand = historyRows.length > 0
  const showScoreBlock = isCompleted && (displayScore != null || canExpand)

  const primaryLabel = isCompleted ? "View" : isInProgress ? "Continue" : "Start"
  const primaryClass = isCompleted
    ? "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center rounded-[16px] border border-[#dfe1e7] bg-white text-base font-semibold text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"
    : isInProgress
      ? "inline-flex h-[52px] min-w-[148px] shrink-0 items-center justify-center rounded-[16px] bg-[#ff9d51] px-6 text-base font-semibold text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f08a3a]"
      : "ds-btn min-w-[148px] shrink-0 rounded-[16px] text-base"

  const hoverTone: BlindReviewCardHoverTone = isCompleted ? "success" : "default"
  const hoverClass = BLIND_REVIEW_CARD_HOVER_CLASS[hoverTone]

  return (
    <article className={cn(BLIND_REVIEW_CARD_SHELL_BASE_CLASS, hoverClass.shell)}>
      <div
        className={cn(
          "grid min-h-[110px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-6 py-3 sm:gap-4 sm:py-0",
          hoverClass.row,
          expanded ? "rounded-t-[16px] border-b border-[#dfe1e7]" : undefined,
        )}
      >
        <div className="flex min-w-0 items-center gap-6">
          <PtBadge number={ptNum} tone={badgeTone} />
          <div className="flex min-w-0 flex-col gap-2">
            <p className={cn("truncate text-2xl font-bold leading-[1.3]", titleClass)}>{statusTitle(item.status)}</p>
            <p className="truncate text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
              {statusSubtitle(item)}
            </p>
          </div>
        </div>

        {showScoreBlock ? (
          <div className="col-span-full flex items-center justify-center gap-1 sm:col-span-1 sm:justify-self-center">
            {displayScore != null ? <ScoreBadge score={displayScore} /> : null}
            {canExpand ? (
              <button
                type="button"
                onClick={onToggleExpanded}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#666d80] transition-colors hover:bg-[#f6f8fa]"
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse attempt history" : "Expand attempt history"}
              >
                <ChevronDown className={cn("size-5 transition-transform", expanded && "rotate-180")} />
              </button>
            ) : null}
          </div>
        ) : (
          <div className="hidden sm:block" aria-hidden />
        )}

        <div className="col-span-full flex shrink-0 items-center justify-end gap-3 sm:col-span-1 sm:justify-self-end">
          <button type="button" onClick={onPrimary} className={primaryClass}>
            {primaryLabel}
          </button>
        </div>
      </div>

      {canExpand && expanded ? (
        <ul className="border-t border-[#dfe1e7] bg-[#f9fbfc] px-6 py-4">
          {historyRows.map((attempt) => (
            <li
              key={attempt.sessionId}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f4] py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#062357]">{formatCompletedDate(attempt.completedAt)}</p>
                <p className="text-xs font-medium tracking-[0.02em] text-[#666d80]">{attemptDetailLabel(attempt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <AttemptScoreBox attempt={attempt} />
                {attempt.sessionId ? (
                  <button
                    type="button"
                    onClick={() => onViewResult(attempt.sessionId)}
                    className="text-sm font-semibold text-[#0d47a1] hover:underline"
                  >
                    Result &gt;
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

function PracticeBlindReviewPage() {
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])

  const [filter, setFilter] = useState<"all" | BlindReviewStatus>("all")
  const [page, setPage] = useState(1)
  const [prepTests, setPrepTests] = useState<BlindReviewPoolItem[]>([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState<BlindReviewPoolStatusCounts>(EMPTY_STATUS_COUNTS)
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const out = await practiceApi.listBlindReviewPool({
          filter,
          page,
          pageSize: PAGE_SIZE,
        })
        if (!cancelled) {
          setPrepTests(out.prepTests)
          setTotal(out.total ?? 0)
          setStatusCounts(out.statusCounts ?? EMPTY_STATUS_COUNTS)
        }
      } catch (e) {
        if (!cancelled) {
          setPrepTests([])
          setTotal(0)
          setStatusCounts(EMPTY_STATUS_COUNTS)
          setError(e instanceof Error ? e.message : "Failed to load blind review")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [practiceApi, filter, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(page * PAGE_SIZE, total)

  function viewResult(sessionId: string) {
    navigate(`/app/analytics/preptests/results/${encodeURIComponent(sessionId)}`)
  }

  function filterTabLabel(tabId: "all" | BlindReviewStatus): string {
    const base = FILTER_TABS.find((t) => t.id === tabId)?.label ?? tabId
    const counts = statusCounts ?? EMPTY_STATUS_COUNTS
    if (tabId === "all") return `${base} (${counts.all})`
    return `${base} (${counts[tabId]})`
  }

  return (
    <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
      <p className="mb-6 max-w-[908px] text-[14px] font-medium leading-[1.5] tracking-[0.02em] text-[#666d80] md:text-base">
          After you finish a PrepTest, blind review lets you revisit every question without seeing correct answers.
          
        </p>

        <section className="mb-6 mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">Your PrepTests</h2>
            <div className="flex flex-wrap gap-3">
              {FILTER_TABS.map((tab) => {
                const active = filter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setFilter(tab.id)
                      setPage(1)
                    }}
                    className={cn(
                      "inline-flex items-center justify-center px-4 text-base transition-colors",
                      active
                        ? "ds-btn rounded-[16px] font-semibold"
                        : "h-[52px] rounded-[16px] border border-[#dfe1e7] bg-white font-medium text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#f6f8fa]",
                    )}
                  >
                    {filterTabLabel(tab.id)}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <StudentPageLoader centered className="min-h-0 flex-1" label="Loading blind review…" />
        ) : prepTests.length === 0 ? (
          <section className="rounded-2xl border border-[#dfe1e7] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#666d80]">
              {statusCounts.all === 0
                ? "Complete a PrepTest first (use Finish test on the PrepTest hub), then return here for blind review."
                : "No PrepTests match this filter."}
            </p>
            {statusCounts.all === 0 ? (
              <button
                type="button"
                className="mt-4 text-sm font-semibold text-[#0d47a1] hover:underline"
                onClick={() => navigate(PREPTEST_LIST_HREF)}
              >
                Go to PrepTests
              </button>
            ) : null}
          </section>
        ) : (
          <div className="flex flex-col gap-6">
            {prepTests.map((item) => (
              <BlindReviewListCard
                key={item.id}
                item={item}
                expanded={expandedIds.has(item.id)}
                onToggleExpanded={() => toggleExpanded(item.id)}
                onPrimary={() => navigate(`/app/practice/blind-review/${encodeURIComponent(item.id)}`)}
                onViewResult={viewResult}
              />
            ))}

            {total > PAGE_SIZE ? (
              <nav
                className="flex flex-col gap-3 border-t border-[#dfe1e7] pt-4 sm:flex-row sm:items-center sm:justify-between"
                aria-label="Blind review pagination"
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
          </div>
        )}
      </StudentMain>
  )
}

export { PracticeBlindReviewPage }
