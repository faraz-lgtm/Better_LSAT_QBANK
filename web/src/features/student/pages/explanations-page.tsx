import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  BarChart3,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Play,
  PlayCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
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
  rowOpen: "var(--student-expanded-row)",
  muted: "var(--text)",
  surface: "var(--background)",
  listRowAlt: "var(--explanation-list-row-alt)",
  ptBadgeBg: "var(--explanation-pt-badge-bg)",
  ptBadgeBorder: "var(--explanation-pt-badge-border)",
  ptBadgeText: "var(--explanation-pt-badge-text)",
  passagePanel: "var(--explanation-passage-panel-bg)",
  badgeRadius: "14px",
  prepTestCardRadius: "var(--explanation-prep-test-card-radius)",
} as const

const TREE_BADGE_STYLE = {
  width: "40px",
  height: "40px",
  borderRadius: "14px",
} as const

const TREE_BADGE_CLASS = "flex shrink-0 items-center justify-center"

const GREEN = "#2E8B57"
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

function statusBadgeClass(status: ExplanationQuestionStatus): string {
  switch (status) {
    case "in_process":
      return "border-amber-200 bg-amber-50 text-amber-800"
    case "not_started":
      return "border-slate-200 bg-slate-50 text-slate-600"
    case "answered":
      return "border-emerald-200 bg-emerald-50 text-emerald-800"
    case "fresh":
      return "border-sky-200 bg-sky-50 text-sky-900"
    case "seen":
      return "border-slate-200 bg-slate-100 text-slate-600"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function statusDotColor(status: ExplanationQuestionStatus): string {
  switch (status) {
    case "in_process":
      return "#f59e0b"
    case "not_started":
      return "#9ca3af"
    case "answered":
      return GREEN
    case "fresh":
      return "#0d47a1"
    case "seen":
      return SEEN_GRAY
    default:
      return SEEN_GRAY
  }
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

const PASSAGE_PREVIEW_MAX = 56
const QUESTION_PREVIEW_MAX = 52

function SectionKindBadge({ kind }: { kind: ExplanationSectionNode["kind"] }) {
  const isRc = kind === "RC"
  return (
    <span
      className={`${TREE_BADGE_CLASS} text-sm font-black leading-none text-white`}
      style={{ ...TREE_BADGE_STYLE, backgroundColor: isRc ? "#f28c33" : "var(--lr-badge-text)" }}
      aria-hidden
    >
      {kind}
    </span>
  )
}

function OutlinedTreeBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className={`${TREE_BADGE_CLASS} border-2 bg-white text-xs font-bold`}
      style={{ ...TREE_BADGE_STYLE, borderColor: S.accent, color: S.accent }}
    >
      {children}
    </span>
  )
}

const DIFFICULTY_METER_COLORS: Record<PracticeDifficultyLabel, string> = {
  Easiest: "#40c4aa",
  Easy: "#ffbd4c",
  Medium: "#ff6f00",
  Hard: "#df1c41",
  Hardest: "#df1c41",
}

function DifficultyMeter({ level }: { level: ExplanationQuestionNode["difficulty"] }) {
  const label = difficultyLabelFromLevel(level)
  const activeColor = DIFFICULTY_METER_COLORS[label]
  return (
    <div className="flex items-center gap-2" title={`Difficulty ${level} of 5`}>
      <div className="flex items-end gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="h-4 w-1.5 shrink-0 rounded-sm"
            style={{ backgroundColor: i < level ? activeColor : "var(--slate-bar-empty)" }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: activeColor }}>
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
    <StudentMain className="bg-[var(--greyscale-25)] pt-6 pb-8 md:pb-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-[24px] font-bold leading-tight tracking-tight" style={{ color: S.heading }}>
          LSAT Question Explanations
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:gap-x-6">
            {statusStats.map((s) => (
              <StatusStat key={s.label} dot={s.dot} count={s.count} label={s.label} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full shrink-0 sm:w-[140px]">
              <Select
                aria-label="Sort explanations"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as "newest" | "oldest")}
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "oldest", label: "Oldest" },
                ]}
                className="h-9 rounded-lg border bg-white text-sm font-medium shadow-none"
                style={{ borderColor: "var(--border)", color: S.heading }}
              />
            </div>
          </div>
        </div>
      </div>

      {listError ? <p className="mt-4 text-sm text-[#95122b]">{listError}</p> : null}

      {listLoading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-[#666d80]">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading PrepTests…
        </p>
      ) : null}

      {!listLoading && displayRows.length === 0 ? (
        <p className="mt-6 max-w-xl text-sm text-[#666d80]">
          No published explanations yet. When an admin adds written or video explanation content to PrepTest questions, they will
          appear here.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        {displayRows.map((row, ptIndex) => {
          const ptId = row.id
          const ptIsOpen = openPt.has(ptId)
          const ptTree = getCachedExplanationPrepTestTree(ptId)
          const filteredTree = ptTree ? filterPrepTests([ptTree], sectionFilter)[0] : null
          const isLoadingTree = treeLoading.has(ptId)
          const treeError = treeErrors[ptId]
          const ptHeaderBg = ptIsOpen ? S.rowOpen : ptIndex % 2 === 0 ? S.surface : S.listRowAlt
          const ptNum = row.prepTestNumber

          return (
            <section
              key={ptId}
              className="overflow-hidden border shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]"
              style={{ borderColor: S.border, backgroundColor: S.surface, borderRadius: S.prepTestCardRadius }}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 border-b px-4 py-4 text-left transition-colors last:border-b-0"
                style={{
                  backgroundColor: ptHeaderBg,
                  borderColor: S.border,
                }}
                onClick={() => togglePrepTest(ptId)}
              >
                <span
                  className={`${TREE_BADGE_CLASS} flex-col border px-1`}
                  style={{
                    ...TREE_BADGE_STYLE,
                    backgroundColor: S.ptBadgeBg,
                    borderColor: S.ptBadgeBorder,
                    color: S.ptBadgeText,
                  }}
                >
                  <span className="text-[9px] font-bold uppercase leading-none tracking-wide">PT</span>
                  <span className="mt-0.5 text-[15px] font-black leading-none tabular-nums">{ptNum}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold" style={{ color: S.heading }}>
                    PT - {ptNum}
                  </div>
                  <div className="text-sm font-medium" style={{ color: S.muted }}>
                    {row.rowSubtitle}
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[#666d80]">
                  {isLoadingTree ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
                  {ptIsOpen ? <ChevronDown className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-[#666d80] hover:text-[color:var(--color-student-heading)]"
                  aria-label="PrepTest options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-5" />
                </Button>
              </button>

              {ptIsOpen ? (
                <div className="border-t" style={{ borderColor: S.border }}>
                  {treeError ? <p className="px-4 py-3 text-sm text-[#95122b]">{treeError}</p> : null}
                  {isLoadingTree && !filteredTree ? (
                    <p className="flex items-center gap-2 px-4 py-4 text-sm text-[#666d80]">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Loading sections…
                    </p>
                  ) : null}
                  {filteredTree?.sections.map((sec, secIndex) => {
                    const sOpen = openSection.has(secKey(ptId, sec.id))
                    const secHeaderBg = secIndex % 2 === 0 ? S.surface : S.listRowAlt
                    return (
                      <div key={sec.id} className="border-b last:border-b-0" style={{ borderColor: S.border }}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-3 pl-5 text-left md:pl-8"
                          style={{ backgroundColor: secHeaderBg }}
                          onClick={() =>
                            setOpenSection((prev) => {
                              const k = secKey(ptId, sec.id)
                              const next = new Set(prev)
                              if (next.has(k)) next.delete(k)
                              else next.add(k)
                              return next
                            })
                          }
                        >
                          <SectionKindBadge kind={sec.kind} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold" style={{ color: S.heading }}>
                              Section {sec.sectionNumber}
                            </div>
                            <div className="text-xs font-medium md:text-sm" style={{ color: S.muted }}>
                              {sectionMetaLine(sec)}
                            </div>
                          </div>
                          {sOpen ? (
                            <ChevronDown className="size-5 shrink-0 text-[#666d80]" />
                          ) : (
                            <ChevronRight className="size-5 shrink-0 text-[#666d80]" />
                          )}
                        </button>

                        {sOpen ? (
                          <div style={{ backgroundColor: S.passagePanel }}>
                            {sec.passages.map((pass) => {
                              const pOpen = openPassage.has(passKey(ptId, sec.id, pass.id))
                              const passagePreviewSource =
                                pass.snippet.trim() || pass.questions[0]?.snippet?.trim() || ""
                              return (
                                <div key={pass.id} className="border-t" style={{ borderColor: S.border }}>
                                  <button
                                    type="button"
                                    className="flex w-full items-start gap-3 px-4 py-3 pl-6 text-left md:pl-12"
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
                                    <OutlinedTreeBadge>{pass.label}</OutlinedTreeBadge>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-bold" style={{ color: S.accent }}>
                                        {pass.title}
                                      </div>
                                      {passagePreviewSource ? (
                                        <p
                                          className="mt-0.5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-relaxed md:text-sm"
                                          style={{ color: S.muted }}
                                          title={plainTextFromHtml(passagePreviewSource)}
                                        >
                                          {previewLine(passagePreviewSource, PASSAGE_PREVIEW_MAX)}
                                        </p>
                                      ) : null}
                                    </div>
                                    {pOpen ? (
                                      <ChevronDown className="mt-1 size-5 shrink-0 text-[#666d80]" />
                                    ) : (
                                      <ChevronRight className="mt-1 size-5 shrink-0 text-[#666d80]" />
                                    )}
                                  </button>

                                  {pOpen ? (
                                    <ul className="border-t pb-2" style={{ borderColor: S.border }}>
                                      {pass.questions.map((q) => {
                                        const detailHref = explanationQuestionDetailHref(q.id)
                                        return (
                                          <li
                                            key={q.id}
                                            className="grid grid-cols-1 gap-3 border-b px-4 py-4 last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_auto] md:items-center md:gap-4 md:pl-16 md:pr-4"
                                            style={{ borderColor: S.border }}
                                          >
                                            <div className="flex items-start gap-3 md:contents">
                                              <OutlinedTreeBadge>{q.number}</OutlinedTreeBadge>

                                              <Link
                                                to={detailHref}
                                                className="min-w-0 flex-1 rounded-lg outline-offset-2 hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-student-accent)] md:flex-none"
                                              >
                                              <div className="text-sm font-semibold" style={{ color: S.accent }}>
                                                {q.code}
                                              </div>
                                              <p
                                                className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-snug"
                                                style={{ color: S.muted }}
                                                title={plainTextFromHtml(q.snippet)}
                                              >
                                                {previewLine(q.snippet, QUESTION_PREVIEW_MAX)}
                                              </p>
                                              <p className="mt-2 text-xs leading-relaxed md:hidden" style={{ color: S.muted }}>
                                                {q.source}
                                              </p>
                                            </Link>
                                            </div>

                                            <span
                                              className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(q.status)}`}
                                            >
                                              <span
                                                className="size-2 shrink-0 rounded-full"
                                                style={{ backgroundColor: statusDotColor(q.status) }}
                                                aria-hidden
                                              />
                                              {statusLabel(q.status)}
                                            </span>

                                            <p className="hidden max-w-[11rem] text-xs leading-relaxed md:block" style={{ color: S.muted }}>
                                              {q.source}
                                            </p>

                                            <DifficultyMeter level={q.difficulty} />

                                            <div className="flex items-center gap-1">
                                              <Button type="button" variant="ghost" size="icon" className="size-9 text-[#666d80] hover:text-[color:var(--color-student-heading)]" asChild>
                                                <Link to={`${detailHref}?tab=analytics`} aria-label="Open analytics tab">
                                                  <BarChart3 className="size-4" />
                                                </Link>
                                              </Button>
                                              <Button type="button" variant="ghost" size="icon" className="size-9 text-[#666d80] hover:text-[color:var(--color-student-heading)]" asChild>
                                                <Link to={`${detailHref}?tab=explanation`} aria-label={q.hasVideo ? "Watch explanation" : "Open explanation tab"}>
                                                  <PlayCircle className="size-4" />
                                                </Link>
                                              </Button>
                                              <Button type="button" variant="ghost" size="icon" className="size-9 text-[#666d80] hover:text-[color:var(--color-student-heading)]" asChild>
                                                <Link to={detailHref} aria-label="Open question">
                                                  <Play className="size-4 fill-current" />
                                                </Link>
                                              </Button>
                                              <Button type="button" variant="ghost" size="icon" className="size-9 text-[#666d80] hover:text-[color:var(--color-student-heading)]" aria-label="Bookmark">
                                                <Bookmark className="size-4" />
                                              </Button>
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

      {!listLoading && totalPrepTests > PAGE_SIZE ? (
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
              disabled={page <= 1}
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
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </nav>
      ) : null}

      <p className="mt-4 flex items-center gap-2 text-xs text-[#666d80]">
        <PlayCircle className="size-4 shrink-0 text-[color:var(--color-student-accent)]" />
        {useMock
          ? "Showing sample data (Supabase not configured). Sign in and connect the API to load your PrepTests."
          : "Expand a PrepTest to browse sections and open question explanations."}
      </p>
    </StudentMain>
  )
}

export { ExplanationsPage }
