import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  BarChart3,
  Bookmark,
  ChevronDown,
  ChevronRight,
  PlayCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { StudentOptionMenu } from "@/features/student/components/student-option-menu"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import {
  cacheExplanationPrepTestTree,
  getCachedExplanationPrepTestTree,
} from "@/features/student/explanation-detail/explanation-tree-cache"
import { explanationQuestionDetailHref } from "@/features/student/explanation-detail/explanation-question-index"
import {
  readExplanationBookmarkCache,
  writeExplanationBookmarkCache,
} from "@/features/student/explanation-detail/explanation-bookmark-cache"
import { filterPrepTestTreeToQuestionIds } from "@/features/student/explanation-detail/filter-explanation-tree"
import { passagesInQuestionOrder } from "@/features/student/explanation-detail/order-explanation-passages"
import type {
  ExplanationPrepTestListItem,
  ExplanationPrepTestNode,
  ExplanationQuestionNode,
  ExplanationQuestionStatus,
  ExplanationSectionNode,
  ExplanationStatusCounts,
} from "@/features/student/explanation-detail/explanation-tree-types"
import { mockExplanationPrepTests } from "@/features/student/lib/mock-explanations-tree"
import {
  difficultyLabelFromLevel,
  type PracticeDifficultyLabel,
} from "@/features/student/practice-session/practice-results-ui"
import { createExplanationsApi } from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

const S = {
  heading: "var(--color-student-heading)",
  accent: "var(--color-student-accent)",
  border: "var(--greyscale-100)",
  rowOpen: "var(--primary-25)",
  muted: "var(--text)",
  surface: "var(--background)",
  listRowAlt: "var(--explanation-list-row-alt)",
  passagePanel: "var(--explanation-passage-panel-bg)",
  badgeRadius: "14px",
  prepTestCardRadius: "var(--explanation-prep-test-card-radius)",
} as const

const PREP_TEST_BADGE_SIZE = {
  width: "64px",
  height: "64px",
  borderRadius: "14px",
} as const

const SECTION_BADGE_SIZE = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
} as const

const TREE_BADGE_CLASS = "flex shrink-0 items-center justify-center"

const GREEN = "#287f6e"
const SEEN_GRAY = "#666d80"

function prepTestStatusTag(status: ExplanationQuestionStatus): string {
  switch (status) {
    case "in_process":
      return "In Process • Blind Review"
    case "fresh":
      return "Fresh"
    case "answered":
      return "Answered"
    case "seen":
      return "Seen"
    case "not_started":
      return "Not Started"
    default:
      return "Fresh"
  }
}

function StatusStat({ dot, count, label }: { dot: string; count: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: dot }} aria-hidden />
      <span className="text-sm leading-[1.5] tracking-[0.28px] tabular-nums text-[#062357]">
        <span className="font-semibold">{count}</span>
        <span className="font-normal"> {label}</span>
      </span>
    </div>
  )
}

function statusLabel(status: ExplanationQuestionStatus): string {
  switch (status) {
    case "in_process":
      return "In Process"
    case "not_started":
      return "Not Started"
    case "answered":
      return "Answered"
    case "fresh":
      return "Fresh"
    case "seen":
      return "Seen"
    default:
      return status
  }
}

function statusBadgeStyle(status: ExplanationQuestionStatus): {
  backgroundColor: string
  color: string
  dotColor: string
} {
  switch (status) {
    case "in_process":
      return { backgroundColor: "#fff6e0", color: "#ffbd4c", dotColor: "#ffbd4c" }
    case "not_started":
      return { backgroundColor: "#f6f8fa", color: "#666d80", dotColor: "#666d80" }
    case "answered":
      return {
        backgroundColor: "var(--explanation-answered-bg)",
        color: "var(--explanation-answered)",
        dotColor: "var(--explanation-answered)",
      }
    case "fresh":
      return { backgroundColor: "#eff6ff", color: "#0d47a1", dotColor: "#0d47a1" }
    case "seen":
      return { backgroundColor: "#f3f4f6", color: "#9ca3af", dotColor: "#9ca3af" }
    default:
      return { backgroundColor: "#f3f4f6", color: "#666d80", dotColor: "#666d80" }
  }
}

function StatusBadge({ status }: { status: ExplanationQuestionStatus }) {
  const style = statusBadgeStyle(status)
  return (
    <span
      className="inline-flex h-7 shrink-0 items-center gap-2 rounded-[10px] px-4 text-xs font-semibold leading-[1.5] tracking-[0.24px] whitespace-nowrap"
      style={{ backgroundColor: style.backgroundColor, color: style.color }}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: style.dotColor }} aria-hidden />
      {statusLabel(status)}
    </span>
  )
}

const TREE_ROW_CLASS =
  "flex h-20 w-full flex-nowrap items-center justify-between gap-6 border-b p-6 text-left last:border-b-0"

const QUESTION_ROW_CLASS =
  "flex h-20 w-full flex-nowrap items-center justify-between gap-6 border-b bg-white p-6 last:border-b-0"

const PREP_TEST_ROW_CLASS =
  "flex h-[88px] w-full flex-nowrap items-center justify-between gap-6 border-b bg-white px-6 text-left transition-colors hover:bg-[#f3f7ff] last:border-b-0"

function derivePrepTestStatus(tree: ExplanationPrepTestNode | null | undefined): ExplanationQuestionStatus {
  if (!tree) return "fresh"
  let hasInProcess = false
  let hasFresh = false
  let hasAnswered = false
  let hasSeen = false
  for (const sec of tree.sections) {
    for (const pass of sec.passages) {
      for (const q of pass.questions) {
        if (q.status === "in_process") hasInProcess = true
        else if (q.status === "fresh") hasFresh = true
        else if (q.status === "answered") hasAnswered = true
        else if (q.status === "seen") hasSeen = true
      }
    }
  }
  if (hasInProcess) return "in_process"
  if (hasFresh) return "fresh"
  if (hasAnswered) return "answered"
  if (hasSeen) return "seen"
  return "fresh"
}

function prepTestBadgeColors(status: ExplanationQuestionStatus): {
  backgroundColor: string
  borderColor: string
  color: string
} {
  switch (status) {
    case "answered":
      return { backgroundColor: "#effefa", borderColor: "#287f6e", color: "#287f6e" }
    case "seen":
      return { backgroundColor: "#f3f4f6", borderColor: "#9ca3af", color: "#9ca3af" }
    default:
      // Fresh / In Process / Not Started — Figma blue PT tag
      return { backgroundColor: "#f3f7ff", borderColor: "#0d47a1", color: "#0d47a1" }
  }
}

function SectionKindBadge({ kind }: { kind: ExplanationSectionNode["kind"] }) {
  const accentColor =
    kind === "RC" ? "#40c4aa" : "var(--explanation-lr-badge-bg)"
  return (
    <span
      className={`${TREE_BADGE_CLASS} text-sm font-bold leading-[1.5] tracking-[0.02em]`}
      style={{
        ...SECTION_BADGE_SIZE,
        backgroundColor: accentColor,
        color: "#ffffff",
      }}
      aria-hidden
    >
      {kind}
    </span>
  )
}

function PassageIndexBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border text-sm font-semibold leading-[1.5] tracking-[0.28px]"
      style={{
        borderColor: "var(--color-student-accent)",
        backgroundColor: "var(--primary-0)",
        color: "var(--color-student-accent)",
      }}
    >
      {children}
    </span>
  )
}

function QuestionIndexBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border text-sm font-semibold leading-[1.5] tracking-[0.28px]"
      style={{
        borderColor: "var(--color-student-accent)",
        backgroundColor: "var(--primary-0)",
        color: "var(--color-student-accent)",
      }}
    >
      {children}
    </span>
  )
}

const DIFFICULTY_METER_COLORS: Record<PracticeDifficultyLabel, string> = {
  Easiest: "var(--explanation-teal)",
  Easy: "#ffbd4c",
  Medium: "#ff6f00",
  Hard: "#df1c41",
  Hardest: "#df1c41",
}

function DifficultyMeter({ level }: { level: ExplanationQuestionNode["difficulty"] }) {
  const label = difficultyLabelFromLevel(level)
  const activeColor = DIFFICULTY_METER_COLORS[label]
  return (
    <div
      className="flex h-10 w-[132px] shrink-0 items-center gap-2.5 rounded-[10px] bg-[#f3f7ff] px-2.5"
      title={`Difficulty ${level} of 5`}
    >
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="h-4 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: i < level ? activeColor : "#ced0e7" }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold leading-[1.5] tracking-[0.24px] whitespace-nowrap" style={{ color: activeColor }}>
        {label}
      </span>
    </div>
  )
}

function filterPrepTests(pts: ExplanationPrepTestNode[], filter: "all" | "lr" | "rc"): ExplanationPrepTestNode[] {
  const kind = filter === "all" ? null : filter.toUpperCase()
  return pts
    .map((pt) => ({
      ...pt,
      sections: kind ? pt.sections.filter((s) => s.kind === kind) : pt.sections,
    }))
    .filter((pt) => pt.sections.length > 0)
}

function sortPrepTests(pts: ExplanationPrepTestNode[], sort: "newest" | "oldest"): ExplanationPrepTestNode[] {
  const copy = [...pts]
  copy.sort((a, b) => {
    const na = Number.parseInt(a.prepTestNumber, 10) || 0
    const nb = Number.parseInt(b.prepTestNumber, 10) || 0
    return sort === "newest" ? nb - na : na - nb
  })
  return copy
}

function countByStatus(trees: ExplanationPrepTestNode[]): Record<ExplanationQuestionStatus, number> {
  const counts: Record<ExplanationQuestionStatus, number> = {
    in_process: 0,
    not_started: 0,
    answered: 0,
    fresh: 0,
    seen: 0,
  }
  for (const pt of trees) {
    for (const sec of pt.sections) {
      for (const pass of sec.passages) {
        for (const q of pass.questions) {
          counts[q.status] += 1
        }
      }
    }
  }
  return counts
}

type PrepTestRow = ExplanationPrepTestListItem & {
  prepTestNumber: string
  rowSubtitle: string
}

const INITIAL_PAGE_SIZE = 5
const SEE_MORE_PAGE_SIZE = 50

const EMPTY_STATUS_COUNTS: ExplanationStatusCounts = {
  in_process: 0,
  fresh: 0,
  answered: 0,
  seen: 0,
}

function mapListItemToRow(r: ExplanationPrepTestListItem): PrepTestRow {
  return {
    ...r,
    prepTestNumber: (r.prepTestNumber ?? r.title.replace(/\D/g, "")) || "—",
    rowSubtitle: r.rowSubtitle?.trim() || "Fresh",
  }
}

type ExplanationsListMode = "newest" | "oldest" | "bookmarked"

function ExplanationsPage() {
  const [listMode, setListMode] = useState<ExplanationsListMode>("newest")
  const [sectionFilter] = useState<"all" | "lr" | "rc">("all")
  const [totalPrepTests, setTotalPrepTests] = useState(0)
  const [prepTestRows, setPrepTestRows] = useState<PrepTestRow[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [useMock, setUseMock] = useState(false)
  const [statusCounts, setStatusCounts] = useState<ExplanationStatusCounts>(EMPTY_STATUS_COUNTS)

  const [openPt, setOpenPt] = useState(() => new Set<string>())
  const [openSection, setOpenSection] = useState(() => new Set<string>())
  const [openPassage, setOpenPassage] = useState(() => new Set<string>())
  const [treeLoading, setTreeLoading] = useState(() => new Set<string>())
  const [treeErrors, setTreeErrors] = useState<Record<string, string>>({})
  const [treeVersion, setTreeVersion] = useState(0)
  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] = useState(() => new Set<string>())
  const [bookmarkedPrepTestIds, setBookmarkedPrepTestIds] = useState(() => new Set<string>())

  const sort: "newest" | "oldest" = listMode === "oldest" ? "oldest" : "newest"
  const bookmarkedOnly = listMode === "bookmarked"

  const explanationsApi = useMemo(() => {
    try {
      return createExplanationsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const loadPrepTestTree = useCallback(
    async (prepTestId: string) => {
      if (getCachedExplanationPrepTestTree(prepTestId)) return
      if (!explanationsApi) return

      setTreeLoading((prev) => new Set(prev).add(prepTestId))
      setTreeErrors((prev) => {
        const next = { ...prev }
        delete next[prepTestId]
        return next
      })
      try {
        const tree = await explanationsApi.getPrepTestTree(prepTestId)
        cacheExplanationPrepTestTree(tree)
        setTreeVersion((v) => v + 1)
      } catch (e) {
        setTreeErrors((prev) => ({
          ...prev,
          [prepTestId]: e instanceof Error ? formatSupabaseCallError(e) : "Failed to load PrepTest",
        }))
      } finally {
        setTreeLoading((prev) => {
          const next = new Set(prev)
          next.delete(prepTestId)
          return next
        })
      }
    },
    [explanationsApi],
  )

  useEffect(() => {
    const cached = readExplanationBookmarkCache()
    setBookmarkedQuestionIds(new Set(cached.questionIds))
    setBookmarkedPrepTestIds(new Set(cached.prepTestIds))
    if (!explanationsApi) return
    let alive = true
    void explanationsApi
      .listQuestionBookmarks()
      .then((result) => {
        if (!alive) return
        setBookmarkedQuestionIds(new Set(result.questionIds))
        setBookmarkedPrepTestIds((prev) => {
          writeExplanationBookmarkCache({
            questionIds: result.questionIds,
            prepTestIds: [...prev],
          })
          return prev
        })
      })
      .catch(() => {
        /* Keep the local cache when the hosted function does not support bookmarks yet. */
      })
    return () => {
      alive = false
    }
  }, [explanationsApi])

  useEffect(() => {
    if (!explanationsApi) {
      if (import.meta.env.DEV) {
        setUseMock(true)
        const allMockRows: PrepTestRow[] = mockExplanationPrepTests.map((pt) => ({
          id: pt.id,
          title: `PrepTest ${pt.prepTestNumber}`,
          moduleId: `LSAC${pt.prepTestNumber}`,
          prepTestNumber: pt.prepTestNumber,
          questionCount: pt.sections.reduce((n, s) => n + s.passages.reduce((m, p) => m + p.questions.length, 0), 0),
          explainedCount: 0,
          rowSubtitle: pt.rowSubtitle,
        }))
        const sorted = [...allMockRows].sort((a, b) => {
          const na = Number.parseInt(a.prepTestNumber, 10) || 0
          const nb = Number.parseInt(b.prepTestNumber, 10) || 0
          return sort === "newest" ? nb - na : na - nb
        })
        setTotalPrepTests(sorted.length)
        setPrepTestRows(sorted.slice(0, INITIAL_PAGE_SIZE))
        for (const pt of mockExplanationPrepTests) {
          cacheExplanationPrepTestTree(pt)
        }
        setTreeVersion((v) => v + 1)
        setStatusCounts(countByStatus(mockExplanationPrepTests))
      } else {
        setListError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      }
      setListLoading(false)
      setLoadingMore(false)
      return
    }

    let alive = true
    setListLoading(true)
    setLoadingMore(false)
    setListError(null)
    setPrepTestRows([])
    void explanationsApi
      .listPrepTests({
        page: 1,
        pageSize: INITIAL_PAGE_SIZE,
        offset: 0,
        sort,
        bookmarkedOnly,
      })
      .then((result) => {
        if (!alive) return
        setPrepTestRows(result.prepTests.map(mapListItemToRow))
        setTotalPrepTests(result.total)
        setStatusCounts(result.statusCounts)
      })
      .catch(async (e) => {
        if (!alive) return
        if (bookmarkedOnly) {
          try {
            const fallback = await explanationsApi.listPrepTests({
              page: 1,
              pageSize: INITIAL_PAGE_SIZE,
              offset: 0,
              sort,
            })
            if (!alive) return
            setPrepTestRows(fallback.prepTests.map(mapListItemToRow))
            setTotalPrepTests(fallback.total)
            setStatusCounts(fallback.statusCounts)
            return
          } catch {
            /* Use the original list error below. */
          }
        }
        setPrepTestRows([])
        setTotalPrepTests(0)
        setStatusCounts(EMPTY_STATUS_COUNTS)
        setListError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to load explanations")
      })
      .finally(() => {
        if (alive) setListLoading(false)
      })
    return () => {
      alive = false
    }
  }, [bookmarkedOnly, explanationsApi, sort])

  const loadMorePrepTests = useCallback(async () => {
    if (loadingMore || listLoading) return
    if (useMock) {
      const allMockRows: PrepTestRow[] = mockExplanationPrepTests.map((pt) => ({
        id: pt.id,
        title: `PrepTest ${pt.prepTestNumber}`,
        moduleId: `LSAC${pt.prepTestNumber}`,
        prepTestNumber: pt.prepTestNumber,
        questionCount: pt.sections.reduce((n, s) => n + s.passages.reduce((m, p) => m + p.questions.length, 0), 0),
        explainedCount: 0,
        rowSubtitle: pt.rowSubtitle,
      }))
      const sorted = [...allMockRows].sort((a, b) => {
        const na = Number.parseInt(a.prepTestNumber, 10) || 0
        const nb = Number.parseInt(b.prepTestNumber, 10) || 0
        return sort === "newest" ? nb - na : na - nb
      })
      setPrepTestRows(sorted.slice(0, Math.min(sorted.length, prepTestRows.length + SEE_MORE_PAGE_SIZE)))
      return
    }
    if (!explanationsApi) return
    const offset = prepTestRows.length
    if (offset >= totalPrepTests) return
    setLoadingMore(true)
    setListError(null)
    try {
      const result = await explanationsApi.listPrepTests({
        offset,
        pageSize: SEE_MORE_PAGE_SIZE,
        sort,
        bookmarkedOnly,
      })
      const rows = result.prepTests.map(mapListItemToRow)
      setPrepTestRows((prev) => {
        const seen = new Set(prev.map((row) => row.id))
        const appended = rows.filter((row) => !seen.has(row.id))
        return [...prev, ...appended]
      })
      setTotalPrepTests(result.total)
      setStatusCounts(result.statusCounts)
    } catch (e) {
      setListError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to load more PrepTests")
    } finally {
      setLoadingMore(false)
    }
  }, [
    bookmarkedOnly,
    explanationsApi,
    listLoading,
    loadingMore,
    prepTestRows.length,
    sort,
    totalPrepTests,
    useMock,
  ])

  const loadedTrees = useMemo(() => {
    void treeVersion
    if (useMock) return sortPrepTests(filterPrepTests(mockExplanationPrepTests, sectionFilter), sort)
    const trees: ExplanationPrepTestNode[] = []
    for (const row of prepTestRows) {
      const tree = getCachedExplanationPrepTestTree(row.id)
      if (tree) trees.push(tree)
    }
    return sortPrepTests(filterPrepTests(trees, sectionFilter), sort)
  }, [prepTestRows, sort, sectionFilter, useMock, treeVersion])

  const mockStatusCounts = useMemo(() => countByStatus(loadedTrees), [loadedTrees])
  const displayStatusCounts = useMock ? mockStatusCounts : statusCounts

  const statusStats = [
    { dot: "#ffbd4c", count: displayStatusCounts.in_process, label: "In Process" },
    { dot: "#0d47a1", count: displayStatusCounts.fresh, label: "Fresh" },
    { dot: GREEN, count: displayStatusCounts.answered, label: "Answered" },
    { dot: SEEN_GRAY, count: displayStatusCounts.seen, label: "Seen" },
  ] as const

  const displayRows = useMemo(() => {
    if (!bookmarkedOnly) return prepTestRows
    if (bookmarkedQuestionIds.size === 0) return []
    if (bookmarkedPrepTestIds.size === 0) return prepTestRows
    const matched = prepTestRows.filter((row) => bookmarkedPrepTestIds.has(row.id))
    return matched.length > 0 ? matched : prepTestRows
  }, [bookmarkedOnly, bookmarkedPrepTestIds, bookmarkedQuestionIds.size, prepTestRows])
  const hasMore = !bookmarkedOnly && prepTestRows.length < totalPrepTests

  const handleListModeChange = (next: ExplanationsListMode) => {
    setListMode(next)
    setOpenPt(new Set())
    setOpenSection(new Set())
    setOpenPassage(new Set())
  }

  const persistBookmarks = (questionIds: Set<string>, prepTestIds: Set<string>) => {
    writeExplanationBookmarkCache({
      questionIds: [...questionIds],
      prepTestIds: [...prepTestIds],
    })
  }

  const toggleQuestionBookmark = async (prepTestId: string, questionId: string) => {
    const nextBookmarked = !bookmarkedQuestionIds.has(questionId)
    const nextQuestionIds = new Set(bookmarkedQuestionIds)
    const nextPrepTestIds = new Set(bookmarkedPrepTestIds)
    if (nextBookmarked) {
      nextQuestionIds.add(questionId)
      nextPrepTestIds.add(prepTestId)
    } else {
      nextQuestionIds.delete(questionId)
      const tree = getCachedExplanationPrepTestTree(prepTestId)
      const stillBookmarkedInPt = tree
        ? tree.sections.some((sec) =>
            sec.passages.some((pass) =>
              pass.questions.some((q) => q.id !== questionId && nextQuestionIds.has(q.id)),
            ),
          )
        : false
      if (!stillBookmarkedInPt) nextPrepTestIds.delete(prepTestId)
    }
    setBookmarkedQuestionIds(nextQuestionIds)
    setBookmarkedPrepTestIds(nextPrepTestIds)
    persistBookmarks(nextQuestionIds, nextPrepTestIds)
    if (!explanationsApi) return
    try {
      const result = await explanationsApi.setQuestionBookmark(questionId, nextBookmarked)
      const synced = new Set(result.questionIds)
      setBookmarkedQuestionIds(synced)
      persistBookmarks(synced, nextPrepTestIds)
    } catch {
      /* Optimistic local bookmark still applies until the function is deployed. */
    }
  }

  useEffect(() => {
    if (!bookmarkedOnly) return
    for (const row of displayRows) {
      void loadPrepTestTree(row.id)
    }
  }, [bookmarkedOnly, displayRows, loadPrepTestTree])

  const secKey = (ptId: string, sId: string) => `${ptId}:${sId}`
  const passKey = (ptId: string, sId: string, pId: string) => `${ptId}:${sId}:${pId}`

  const toggleSection = (ptId: string, sec: ExplanationSectionNode) => {
    const k = secKey(ptId, sec.id)
    const willOpen = !openSection.has(k)
    setOpenSection((prev) => {
      const next = new Set(prev)
      if (willOpen) next.add(k)
      else next.delete(k)
      return next
    })
    setOpenPassage((prev) => {
      const next = new Set(prev)
      for (const pass of sec.passages) {
        const pk = passKey(ptId, sec.id, pass.id)
        if (willOpen) next.add(pk)
        else next.delete(pk)
      }
      return next
    })
  }

  const togglePrepTest = (ptId: string) => {
    setOpenPt((prev) => {
      const next = new Set(prev)
      const willOpen = !next.has(ptId)
      if (willOpen) {
        next.add(ptId)
        void loadPrepTestTree(ptId)
      } else {
        next.delete(ptId)
      }
      return next
    })
  }

  return (
    <StudentMain className="bg-[#f0f5ff]" contentClassName="flex min-h-0 flex-1 flex-col pt-6 pb-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="m-0 text-2xl font-bold leading-[1.3] text-[#062357]">LSAT Question Explanations</h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {statusStats.map((s) => (
                <StatusStat key={s.label} dot={s.dot} count={s.count} label={s.label} />
              ))}
            </div>
          </div>
          <StudentOptionMenu
            ariaLabel="Sort explanations"
            value={listMode}
            onChange={handleListModeChange}
            className="w-full max-w-[160px] shrink-0 lg:w-[160px]"
            size="lg"
            variant="surface"
            options={[
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
              { value: "bookmarked", label: "Bookmarked" },
            ]}
          />
        </div>

      {listError ? <p className="text-sm text-[#95122b]">{listError}</p> : null}

      {listLoading ? (
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading PrepTests…" />
      ) : displayRows.length === 0 ? (
        <p className="max-w-xl text-sm text-[#666d80]">
          {bookmarkedOnly
            ? "No bookmarked questions yet. Open a PrepTest and tap the bookmark icon on a question."
            : "No published explanations yet. When an admin adds written or video explanation content to PrepTest questions, they will appear here."}
        </p>
      ) : (
        <div
          className="flex flex-col overflow-hidden border border-[#dfe1e7] bg-white"
          style={{ borderRadius: S.prepTestCardRadius }}
        >
          {displayRows.map((row) => {
          const ptId = row.id
          const ptTree = getCachedExplanationPrepTestTree(ptId)
          const sectionFiltered = ptTree ? filterPrepTests([ptTree], sectionFilter)[0] : null
          const filteredTree =
            bookmarkedOnly && sectionFiltered
              ? filterPrepTestTreeToQuestionIds(sectionFiltered, bookmarkedQuestionIds)
              : sectionFiltered
          if (bookmarkedOnly && ptTree && !filteredTree) return null
          const ptIsOpen = bookmarkedOnly || openPt.has(ptId)
          const isLoadingTree = treeLoading.has(ptId)
          const treeError = treeErrors[ptId]
          const ptNum = row.prepTestNumber
          const ptStatus = derivePrepTestStatus(ptTree)
          const ptBadgeColors = prepTestBadgeColors(ptStatus)
          const statusTag = ptTree ? prepTestStatusTag(ptStatus) : row.rowSubtitle

          return (
            <div key={ptId} className="contents">
              <button
                type="button"
                className={PREP_TEST_ROW_CLASS}
                style={{ borderColor: S.border }}
                onClick={() => togglePrepTest(ptId)}
              >
                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-6 overflow-hidden">
                  <span
                    className={`${TREE_BADGE_CLASS} flex-col border p-px`}
                    style={{
                      ...PREP_TEST_BADGE_SIZE,
                      backgroundColor: ptBadgeColors.backgroundColor,
                      borderColor: ptBadgeColors.borderColor,
                      color: ptBadgeColors.color,
                    }}
                  >
                    <span className="w-[35px] text-center text-[12px] font-semibold leading-[1.35]">PT</span>
                    <span className="text-[24px] font-bold leading-[1.3] tabular-nums">{ptNum}</span>
                  </span>
                  <div className="flex min-w-0 flex-col items-start justify-center gap-2 overflow-hidden">
                    <span className="text-[20px] font-bold leading-[1.35] whitespace-nowrap text-[#062357]">
                      PT - {ptNum}
                    </span>
                    <span className="truncate text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#666d80]">
                      {statusTag}
                    </span>
                  </div>
                  {isLoadingTree ? <StudentPageLoader size="sm" /> : null}
                  {ptIsOpen ? (
                    <ChevronDown className="size-6 shrink-0 text-[#062357]" aria-hidden />
                  ) : (
                    <ChevronRight className="size-6 shrink-0 text-[#062357]" aria-hidden />
                  )}
                </div>
              </button>

              {ptIsOpen ? (
                <>
                  {treeError ? <p className="border-b border-[#dfe1e7] px-6 py-3 text-sm text-[#95122b]">{treeError}</p> : null}
                  {isLoadingTree && !filteredTree ? (
                    <div className="border-b border-[#dfe1e7] px-6 py-4">
                      <StudentPageLoader label="Loading sections…" />
                    </div>
                  ) : null}
                  {filteredTree?.sections.map((sec) => {
                    const sOpen = bookmarkedOnly || openSection.has(secKey(ptId, sec.id))
                    const secHeaderBg = sOpen ? S.listRowAlt : S.surface
                    return (
                      <div key={sec.id} className="contents">
                        <button
                          type="button"
                          className={TREE_ROW_CLASS}
                          style={{ backgroundColor: secHeaderBg, borderColor: S.border }}
                          onClick={() => toggleSection(ptId, sec)}
                        >
                          <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-6 overflow-hidden">
                            <SectionKindBadge kind={sec.kind} />
                            <div className="flex min-w-0 flex-col items-start gap-1.5 overflow-hidden">
                              <span className="text-[20px] font-bold leading-[1.35] whitespace-nowrap text-[#062357]">
                                Section {sec.sectionNumber}
                              </span>
                              {sec.flags ? (
                                <span className="truncate text-sm font-normal leading-[1.5] tracking-[0.28px] text-[#666d80]">
                                  {sec.flags}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {sOpen ? (
                            <ChevronDown className="size-6 shrink-0 text-[#666d80]" />
                          ) : (
                            <ChevronRight className="size-6 shrink-0 text-[#666d80]" />
                          )}
                        </button>

                        {sOpen ? (
                          <>
                            {passagesInQuestionOrder(sec.passages).map((pass) => {
                              const pOpen = bookmarkedOnly || openPassage.has(passKey(ptId, sec.id, pass.id))
                              const questionCountLabel = `${pass.questions.length} Question${pass.questions.length === 1 ? "" : "s"}`
                              return (
                                <div key={pass.id} className="contents">
                                  <button
                                    type="button"
                                    className={TREE_ROW_CLASS}
                                    style={{ backgroundColor: S.listRowAlt, borderColor: S.border }}
                                    onClick={() =>
                                      setOpenPassage((prev) => {
                                        const k = passKey(ptId, sec.id, pass.id)
                                        const next = new Set(prev)
                                        if (next.has(k)) next.delete(k)
                                        else next.add(k)
                                        return next
                                      })
                                    }
                                  >
                                    <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-6 overflow-hidden">
                                      <PassageIndexBadge>{pass.label}</PassageIndexBadge>
                                      <span className="truncate text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[#062357]">
                                        {pass.title}
                                      </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-6">
                                      <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-white px-4 text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#4a5565]">
                                        {questionCountLabel}
                                      </span>
                                      {pOpen ? (
                                        <ChevronDown className="size-6 shrink-0 text-[#666d80]" aria-hidden />
                                      ) : (
                                        <ChevronRight className="size-6 shrink-0 text-[#666d80]" aria-hidden />
                                      )}
                                    </div>
                                  </button>

                                  {pOpen
                                    ? pass.questions.map((q) => {
                                        const detailHref = explanationQuestionDetailHref(q.id)
                                        return (
                                          <div
                                            key={q.id}
                                            className={QUESTION_ROW_CLASS}
                                            style={{ borderColor: S.border }}
                                          >
                                            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-6 overflow-hidden">
                                              <QuestionIndexBadge>{q.number}</QuestionIndexBadge>
                                              <Link
                                                to={detailHref}
                                                className="block w-[500px] max-w-[500px] min-w-0 shrink truncate rounded-lg text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1] outline-offset-2 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-student-accent)]"
                                              >
                                                {q.code}
                                              </Link>
                                              <div className="shrink-0 px-4">
                                                <StatusBadge status={q.status} />
                                              </div>
                                            </div>

                                            <div className="flex w-[412px] shrink-0 flex-nowrap items-center justify-end gap-6">
                                              <DifficultyMeter level={q.difficulty} />
                                              <div className="flex shrink-0 items-center gap-6">
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className="size-9 rounded-xl text-[#666d80] hover:text-[color:var(--color-student-heading)]"
                                                  asChild
                                                >
                                                  <Link to={`${detailHref}?tab=analytics`} aria-label="Open analytics tab">
                                                    <BarChart3 className="size-6" />
                                                  </Link>
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className="size-9 rounded-xl text-[#666d80] hover:text-[color:var(--color-student-heading)]"
                                                  asChild
                                                >
                                                  <Link to={detailHref} aria-label="Open question">
                                                    <PlayCircle className="size-6" />
                                                  </Link>
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className={
                                                    bookmarkedQuestionIds.has(q.id)
                                                      ? "size-9 rounded-xl text-[#0d47a1] hover:text-[#0d47a1]"
                                                      : "size-9 rounded-xl text-[#666d80] hover:text-[color:var(--color-student-heading)]"
                                                  }
                                                  aria-label={
                                                    bookmarkedQuestionIds.has(q.id)
                                                      ? `Remove bookmark from ${q.code}`
                                                      : `Bookmark ${q.code}`
                                                  }
                                                  aria-pressed={bookmarkedQuestionIds.has(q.id)}
                                                  onClick={() => void toggleQuestionBookmark(ptId, q.id)}
                                                >
                                                  <Bookmark
                                                    className="size-6"
                                                    fill={bookmarkedQuestionIds.has(q.id) ? "currentColor" : "none"}
                                                  />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })
                                    : null}
                                </div>
                              )
                            })}
                          </>
                        ) : null}
                      </div>
                    )
                  })}
                </>
              ) : null}
            </div>
          )
        })}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={listLoading || loadingMore}
            onClick={() => void loadMorePrepTests()}
            className="inline-flex h-[52px] min-w-[160px] items-center justify-center rounded-[16px] border border-[#dfe1e7] bg-white px-6 text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa] disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "See more"}
          </button>
        </div>
      ) : null}
      </div>
    </StudentMain>
  )
}

export { ExplanationsPage }
