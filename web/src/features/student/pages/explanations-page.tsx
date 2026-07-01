import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  BarChart3,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
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
import { plainTextFromHtml } from "@/lib/html/plain-text-from-html"
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
  width: "56px",
  height: "56px",
  borderRadius: "14px",
} as const

const TREE_BADGE_SIZE = {
  width: "40px",
  height: "40px",
  borderRadius: "14px",
} as const

const TREE_BADGE_CLASS = "flex shrink-0 items-center justify-center"

const GREEN = "var(--explanation-answered)"
const SEEN_GRAY = "#9CA3AF"

function StatusStat({ dot, count, label }: { dot: string; count: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} aria-hidden />
      <span className="text-sm tabular-nums" style={{ color: S.heading }}>
        <span className="font-semibold">{count}</span>
        <span className="font-medium"> {label}</span>
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
      return { backgroundColor: "#f3f4f6", color: "#666d80", dotColor: "#666d80" }
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
      className="inline-flex h-7 shrink-0 items-center gap-2 rounded-[10px] px-4 text-xs font-semibold leading-none tracking-[0.02em] whitespace-nowrap"
      style={{ backgroundColor: style.backgroundColor, color: style.color }}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: style.dotColor }} aria-hidden />
      {statusLabel(status)}
    </span>
  )
}

function sectionMetaLine(sec: ExplanationSectionNode): string {
  return [sec.sectionTitle, sec.flags].filter(Boolean).join(" • ")
}

function previewLine(snippet: string, max: number): string {
  const text = plainTextFromHtml(snippet).replace(/\s+/g, " ").trim()
  if (!text) return ""
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}...`
}

function formatQuestionSource(source: string): { primary: string; secondary?: string } {
  const parts = source.split(" · ").map((part) => part.trim()).filter(Boolean)
  if (parts.length <= 1) return { primary: source }
  return { primary: parts[0]!, secondary: parts.slice(1).join(" · ") }
}

function QuestionSourceText({ source }: { source: string }) {
  const { primary, secondary } = formatQuestionSource(source)
  const text = secondary ? `${primary} ${secondary}` : primary
  return (
    <div className="w-[9.4375rem] shrink-0">
      <p className="truncate text-xs font-normal leading-normal tracking-[0.02em]" style={{ color: S.muted }} title={text}>
        {text}
      </p>
    </div>
  )
}

const TREE_ROW_CLASS =
  "flex w-full flex-nowrap items-center justify-between gap-6 border-b p-6 text-left last:border-b-0"

const QUESTION_ROW_CLASS =
  "flex w-full flex-nowrap items-center justify-between gap-6 border-b bg-white p-6 last:border-b-0"

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
    case "in_process":
      return { backgroundColor: "#fff6e0", borderColor: "#ffbd4c", color: "#ffbd4c" }
    case "fresh":
      return { backgroundColor: "#edf3ff", borderColor: "#0d47a1", color: "#0d47a1" }
    case "answered":
      return {
        backgroundColor: "var(--explanation-answered-bg)",
        borderColor: "var(--explanation-answered)",
        color: "var(--explanation-answered)",
      }
    case "seen":
      return { backgroundColor: "#f3f4f6", borderColor: "#9ca3af", color: "#9ca3af" }
    default: {
      const { dotColor: color, backgroundColor } = statusBadgeStyle(status)
      return { backgroundColor, borderColor: color, color }
    }
  }
}

const PASSAGE_PREVIEW_MAX = 56
const QUESTION_PREVIEW_MAX = 52

function SectionKindBadge({ kind }: { kind: ExplanationSectionNode["kind"] }) {
  const accentColor =
    kind === "RC" ? "var(--explanation-rc-badge-bg)" : "var(--explanation-lr-badge-bg)"
  return (
    <span
      className={`${TREE_BADGE_CLASS} text-lg font-black leading-none tracking-[0.02em]`}
      style={{
        ...TREE_BADGE_SIZE,
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
      className="flex shrink-0 items-center justify-center border text-lg font-semibold leading-[1.4] tracking-[0.02em]"
      style={{
        ...TREE_BADGE_SIZE,
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
      className="flex shrink-0 items-center justify-center border text-lg font-semibold leading-[1.4] tracking-[0.02em]"
      style={{
        ...TREE_BADGE_SIZE,
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
      className="flex h-10 w-[8.25rem] shrink-0 items-center gap-2.5 rounded-[10px] bg-[#f3f7ff] px-2.5"
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
      <span className="text-xs font-semibold leading-normal tracking-[0.02em] whitespace-nowrap" style={{ color: activeColor }}>
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

const PAGE_SIZE = 5

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
    rowSubtitle:
      r.explainedCount > 0
        ? `${r.explainedCount} of ${r.questionCount} questions with explanations`
        : `${r.questionCount} questions`,
  }
}

function ExplanationsPage() {
  const [sort, setSort] = useState<"newest" | "oldest">("newest")
  const [sectionFilter] = useState<"all" | "lr" | "rc">("all")
  const [page, setPage] = useState(1)
  const [totalPrepTests, setTotalPrepTests] = useState(0)
  const [prepTestRows, setPrepTestRows] = useState<PrepTestRow[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [useMock, setUseMock] = useState(false)
  const [statusCounts, setStatusCounts] = useState<ExplanationStatusCounts>(EMPTY_STATUS_COUNTS)

  const [openPt, setOpenPt] = useState(() => new Set<string>())
  const [openSection, setOpenSection] = useState(() => new Set<string>())
  const [openPassage, setOpenPassage] = useState(() => new Set<string>())
  const [treeLoading, setTreeLoading] = useState(() => new Set<string>())
  const [treeErrors, setTreeErrors] = useState<Record<string, string>>({})
  const [treeVersion, setTreeVersion] = useState(0)

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
    setOpenPt(new Set())
    setOpenSection(new Set())
    setOpenPassage(new Set())
  }, [page])

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
        const start = (page - 1) * PAGE_SIZE
        setPrepTestRows(sorted.slice(start, start + PAGE_SIZE))
        for (const pt of mockExplanationPrepTests) {
          cacheExplanationPrepTestTree(pt)
        }
        setTreeVersion((v) => v + 1)
        setStatusCounts(countByStatus(mockExplanationPrepTests))
      } else {
        setListError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      }
      setListLoading(false)
      return
    }

    let alive = true
    setListLoading(true)
    setListError(null)
    setPrepTestRows([])
    void explanationsApi
      .listPrepTests({ page, pageSize: PAGE_SIZE, sort })
      .then((result) => {
        if (!alive) return
        setPrepTestRows(result.prepTests.map(mapListItemToRow))
        setTotalPrepTests(result.total)
        setStatusCounts(result.statusCounts)
      })
      .catch((e) => {
        if (!alive) return
        setListError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to load explanations")
      })
      .finally(() => {
        if (alive) setListLoading(false)
      })
    return () => {
      alive = false
    }
  }, [explanationsApi, page, sort])

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
    { dot: "var(--drill-medium)", count: displayStatusCounts.in_process, label: "In Process" },
    { dot: "var(--color-student-heading)", count: displayStatusCounts.fresh, label: "Fresh" },
    { dot: GREEN, count: displayStatusCounts.answered, label: "Answered" },
    { dot: SEEN_GRAY, count: displayStatusCounts.seen, label: "Seen" },
  ] as const

  const displayRows = prepTestRows

  const totalPages = Math.max(1, Math.ceil(totalPrepTests / PAGE_SIZE))
  const pageStart = totalPrepTests === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(page * PAGE_SIZE, totalPrepTests)

  const handleSortChange = (next: "newest" | "oldest") => {
    setSort(next)
    setPage(1)
  }

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
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="student-page-heading">LSAT Question Explanations</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:gap-x-6">
            {statusStats.map((s) => (
              <StatusStat key={s.label} dot={s.dot} count={s.count} label={s.label} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StudentOptionMenu
              ariaLabel="Sort explanations"
              value={sort}
              onChange={handleSortChange}
              options={[
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" },
              ]}
            />
          </div>
        </div>
      </div>

      {listError ? <p className="mt-4 text-sm text-[#95122b]">{listError}</p> : null}

      {listLoading ? (
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading PrepTests…" />
      ) : displayRows.length === 0 ? (
        <p className="mt-6 max-w-xl text-sm text-[#666d80]">
          No published explanations yet. When an admin adds written or video explanation content to PrepTest questions, they will
          appear here.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {displayRows.map((row) => {
          const ptId = row.id
          const ptIsOpen = openPt.has(ptId)
          const ptTree = getCachedExplanationPrepTestTree(ptId)
          const filteredTree = ptTree ? filterPrepTests([ptTree], sectionFilter)[0] : null
          const isLoadingTree = treeLoading.has(ptId)
          const treeError = treeErrors[ptId]
          const ptNum = row.prepTestNumber
          const ptStatus = derivePrepTestStatus(ptTree)
          const ptBadgeColors = prepTestBadgeColors(ptStatus)

          return (
            <section
              key={ptId}
              className="overflow-hidden border shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]"
              style={{ borderColor: S.border, backgroundColor: S.surface, borderRadius: S.prepTestCardRadius }}
            >
              <button
                type="button"
                className="flex min-h-[5.5rem] w-full flex-nowrap items-center justify-between gap-6 bg-white px-6 py-4 text-left transition-colors hover:bg-[#f3f7ff]"
                style={{
                  borderBottom: ptIsOpen ? "1px solid var(--greyscale-100)" : undefined,
                }}
                onClick={() => togglePrepTest(ptId)}
              >
                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-6 overflow-hidden">
                  <span
                    className={`${TREE_BADGE_CLASS} flex-col border`}
                    style={{
                      ...PREP_TEST_BADGE_SIZE,
                      backgroundColor: ptBadgeColors.backgroundColor,
                      borderColor: ptBadgeColors.borderColor,
                      color: ptBadgeColors.color,
                    }}
                  >
                    <span className="text-xs font-bold leading-normal tracking-[0.02em]">PT</span>
                    <span className="text-xl font-bold leading-[1.35] tabular-nums">{ptNum}</span>
                  </span>
                  <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-hidden">
                    <span className="shrink-0 text-xl font-bold leading-[1.35]" style={{ color: S.heading }}>
                      PT - {ptNum}
                    </span>
                    <span className="truncate text-sm font-semibold leading-normal" style={{ color: S.muted }}>
                      {row.rowSubtitle}
                    </span>
                    {isLoadingTree ? <StudentPageLoader size="sm" /> : null}
                  </div>
                  {ptIsOpen ? (
                    <ChevronDown className="size-6 shrink-0" style={{ color: S.heading }} aria-hidden />
                  ) : (
                    <ChevronRight className="size-6 shrink-0" style={{ color: S.heading }} aria-hidden />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-9 shrink-0 text-[#666d80] hover:text-[color:var(--color-student-heading)]"
                  aria-label="PrepTest options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-5" />
                </Button>
              </button>

              {ptIsOpen ? (
                <div className="overflow-x-auto border-t" style={{ borderColor: S.border }}>
                  {treeError ? <p className="px-4 py-3 text-sm text-[#95122b]">{treeError}</p> : null}
                  {isLoadingTree && !filteredTree ? (
                    <div className="px-4 py-4">
                      <StudentPageLoader label="Loading sections…" />
                    </div>
                  ) : null}
                  {filteredTree?.sections.map((sec) => {
                    const sOpen = openSection.has(secKey(ptId, sec.id))
                    const secHeaderBg = sOpen ? S.listRowAlt : S.surface
                    return (
                      <div key={sec.id} style={{ borderColor: S.border }}>
                        <button
                          type="button"
                          className={TREE_ROW_CLASS}
                          style={{ backgroundColor: secHeaderBg, borderColor: S.border }}
                          onClick={() => toggleSection(ptId, sec)}
                        >
                          <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-6 overflow-hidden">
                            <SectionKindBadge kind={sec.kind} />
                            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-hidden">
                              <span className="shrink-0 text-2xl font-bold leading-[1.3]" style={{ color: S.heading }}>
                                Section {sec.sectionNumber}
                              </span>
                              <span className="truncate text-sm font-normal leading-normal" style={{ color: S.muted }}>
                                {sectionMetaLine(sec)}
                              </span>
                            </div>
                          </div>
                          {sOpen ? (
                            <ChevronDown className="size-6 shrink-0 text-[#666d80]" />
                          ) : (
                            <ChevronRight className="size-6 shrink-0 text-[#666d80]" />
                          )}
                        </button>

                        {sOpen ? (
                          <div>
                            {sec.passages.map((pass) => {
                              const pOpen = openPassage.has(passKey(ptId, sec.id, pass.id))
                              const passagePreviewSource =
                                pass.snippet.trim() || pass.questions[0]?.snippet?.trim() || ""
                              const questionCountLabel = `${pass.questions.length} Question${pass.questions.length === 1 ? "" : "s"}`
                              return (
                                <div key={pass.id}>
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
                                      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-hidden">
                                        <span className="shrink-0 text-lg font-semibold leading-[1.4]" style={{ color: S.heading }}>
                                          {pass.title}
                                        </span>
                                        {passagePreviewSource ? (
                                          <span
                                            className="truncate text-xs font-medium leading-normal"
                                            style={{ color: S.muted }}
                                            title={plainTextFromHtml(passagePreviewSource)}
                                          >
                                            {previewLine(passagePreviewSource, PASSAGE_PREVIEW_MAX)}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium leading-none text-[#4a5565]">
                                      {questionCountLabel}
                                      {pOpen ? (
                                        <ChevronDown className="size-4 shrink-0" aria-hidden />
                                      ) : (
                                        <ChevronRight className="size-4 shrink-0" aria-hidden />
                                      )}
                                    </span>
                                  </button>

                                  {pOpen ? (
                                    <ul>
                                      {pass.questions.map((q) => {
                                        const detailHref = explanationQuestionDetailHref(q.id)
                                        return (
                                          <li
                                            key={q.id}
                                            className={QUESTION_ROW_CLASS}
                                            style={{ borderColor: S.border }}
                                          >
                                            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-6 overflow-hidden">
                                              <QuestionIndexBadge>{q.number}</QuestionIndexBadge>
                                              <Link
                                                to={detailHref}
                                                className="flex w-[24.25rem] min-w-[12rem] max-w-[24.25rem] shrink flex-col gap-1.5 rounded-lg outline-offset-2 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-student-accent)]"
                                              >
                                                <span className="truncate text-sm font-semibold leading-normal tracking-[0.02em]" style={{ color: S.accent }}>
                                                  {q.code}
                                                </span>
                                                <span
                                                  className="truncate text-xs font-medium leading-normal tracking-[0.02em]"
                                                  style={{ color: S.muted }}
                                                  title={plainTextFromHtml(q.snippet)}
                                                >
                                                  {previewLine(q.snippet, QUESTION_PREVIEW_MAX)}
                                                </span>
                                              </Link>
                                              <div className="shrink-0 px-4">
                                                <StatusBadge status={q.status} />
                                              </div>
                                              <QuestionSourceText source={q.source} />
                                            </div>

                                            <div className="flex shrink-0 flex-nowrap items-center gap-6">
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
                                                  <Link
                                                    to={`${detailHref}?tab=explanation`}
                                                    aria-label={q.hasVideo ? "Watch explanation" : "Open explanation tab"}
                                                  >
                                                    <PlayCircle className="size-6" />
                                                  </Link>
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className="size-9 rounded-xl text-[#666d80] hover:text-[color:var(--color-student-heading)]"
                                                  aria-label="Bookmark"
                                                >
                                                  <Bookmark className="size-6" />
                                                </Button>
                                              </div>
                                            </div>
                                          </li>
                                        )
                                      })}
                                    </ul>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </section>
          )
        })}
        </div>
      )}

      {totalPrepTests > PAGE_SIZE ? (
        <nav
          className="mt-4 flex flex-col gap-3 border-t border-[#dfe1e7] pt-4 sm:flex-row sm:items-center sm:justify-between"
          aria-label="PrepTest pagination"
        >
          <p className="text-sm text-[#666d80]">
            Showing {pageStart}–{pageEnd} of {totalPrepTests} PrepTests
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={listLoading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Previous
            </Button>
            <span className="min-w-[4.5rem] text-center text-sm font-medium tabular-nums" style={{ color: S.heading }}>
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={listLoading || page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </nav>
      ) : null}

    
    </StudentMain>
  )
}

export { ExplanationsPage }
