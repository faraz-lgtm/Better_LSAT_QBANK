import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BarChart3, Bookmark, ChevronDown, ChevronRight, MoreVertical, Play, PlayCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { StudentMain } from "@/features/student/components/student-main"
import { explanationQuestionDetailHref } from "@/features/student/explanation-detail/explanation-question-index"
import {
  mockExplanationPrepTests,
  type ExplanationPrepTestNode,
  type ExplanationQuestionNode,
  type ExplanationQuestionStatus,
} from "@/features/student/lib/mock-explanations-tree"

/** Student chrome colors — all from `index.css` :root. */
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
  badgeRadius: "var(--explanation-badge-radius)",
  prepTestCardRadius: "var(--explanation-prep-test-card-radius)",
} as const

const GREEN = "#2E8B57"
const SEEN_GRAY = "#9CA3AF"

const STATUS_STATS = [
  { dot: "var(--drill-medium)", count: 12, label: "In Process" },
  { dot: "var(--color-student-heading)", count: 121, label: "Fresh" },
  { dot: GREEN, count: 45, label: "Answered" },
  { dot: SEEN_GRAY, count: 150, label: "Seen" },
] as const

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

function DifficultyMeter({ level }: { level: ExplanationQuestionNode["difficulty"] }) {
  const colors = ["var(--student-red)", "var(--student-red)", "var(--drill-medium)", "var(--student-meter-light)", "var(--student-meter-light)"] as const
  return (
    <div className="flex items-end gap-0.5" title={`Difficulty ${level} of 5`}>
      {colors.map((c, i) => (
        <span
          key={i}
          className="h-4 w-1.5 shrink-0 rounded-sm"
          style={{ backgroundColor: i < level ? c : "var(--slate-bar-empty)" }}
        />
      ))}
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

function ExplanationsPage() {
  const [sort, setSort] = useState<"newest" | "oldest">("newest")
  const [openPt, setOpenPt] = useState(() => new Set<string>(["pt-160"]))
  const [openSection, setOpenSection] = useState(() => new Set<string>(["pt-160:s1"]))
  const [openPassage, setOpenPassage] = useState(() => new Set<string>(["pt-160:s1:p1"]))

  const prepTests = useMemo(() => {
    const f = filterPrepTests(mockExplanationPrepTests, "all")
    return sortPrepTests(f, sort)
  }, [sort])

  const secKey = (ptId: string, sId: string) => `${ptId}:${sId}`
  const passKey = (ptId: string, sId: string, pId: string) => `${ptId}:${sId}:${pId}`

  return (
    <StudentMain className="bg-[var(--greyscale-25)] py-4 pb-8 md:py-4 md:pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold tracking-tight md:text-xl" style={{ color: S.heading }}>
          Explanations
        </h1>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumb">
          <Link to="/app/prep-course" className="font-medium hover:underline" style={{ color: S.muted }}>
            Learn
          </Link>
          <span className="px-0.5 font-normal" style={{ color: "var(--border)" }}>
            /
          </span>
          <Link to="/app/prep-course" className="font-medium hover:underline" style={{ color: S.muted }}>
            Foundations
          </Link>
          <span className="px-0.5 font-normal" style={{ color: "var(--border)" }}>
            /
          </span>
          <span className="font-semibold" style={{ color: S.heading }}>
            Explanations
          </span>
        </nav>
      </header>

      <div className="h-6 shrink-0" aria-hidden />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl md:leading-tight" style={{ color: S.heading }}>
          LSAT Question Explanations
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:gap-x-6">
            {STATUS_STATS.map((s) => (
              <StatusStat key={s.label} dot={s.dot} count={s.count} label={s.label} />
            ))}
          </div>
          <div className="w-full shrink-0 sm:w-[140px]">
            <Select
              aria-label="Sort explanations"
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
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

      <div className="mt-6 flex flex-col gap-3">
        {prepTests.map((pt, ptIndex) => {
          const ptIsOpen = openPt.has(pt.id)
          const ptHeaderBg = ptIsOpen ? S.rowOpen : ptIndex % 2 === 0 ? S.surface : S.listRowAlt
          return (
            <section
              key={pt.id}
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
                onClick={() =>
                  setOpenPt((prev) => {
                    const next = new Set(prev)
                    if (next.has(pt.id)) next.delete(pt.id)
                    else next.add(pt.id)
                    return next
                  })
                }
              >
                <span
                  className="flex size-[52px] shrink-0 flex-col items-center justify-center border px-1"
                  style={{
                    backgroundColor: S.ptBadgeBg,
                    borderColor: S.ptBadgeBorder,
                    color: S.ptBadgeText,
                    borderRadius: S.badgeRadius,
                  }}
                >
                  <span className="text-[10px] font-bold uppercase leading-none tracking-wide">PT</span>
                  <span className="mt-1 text-[17px] font-black leading-none tabular-nums">{pt.prepTestNumber}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold" style={{ color: S.heading }}>
                    PT - {pt.prepTestNumber}
                  </div>
                  <div className="text-sm font-medium" style={{ color: S.muted }}>
                    {pt.rowSubtitle}
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[#666d80]">
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
                  {pt.sections.map((sec, secIndex) => {
                    const sOpen = openSection.has(secKey(pt.id, sec.id))
                    const isRc = sec.kind === "RC"
                    const secHeaderBg = secIndex % 2 === 0 ? S.surface : S.listRowAlt
                    return (
                      <div key={sec.id} className="border-b last:border-b-0" style={{ borderColor: S.border }}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-3 pl-5 text-left md:pl-8"
                          style={{ backgroundColor: secHeaderBg }}
                          onClick={() =>
                            setOpenSection((prev) => {
                              const k = secKey(pt.id, sec.id)
                              const next = new Set(prev)
                              if (next.has(k)) next.delete(k)
                              else next.add(k)
                              return next
                            })
                          }
                        >
                          <span
                            className="flex size-[52px] shrink-0 flex-col items-center justify-center border px-1"
                            style={
                              isRc
                                ? {
                                    backgroundColor: S.ptBadgeBg,
                                    borderColor: S.ptBadgeBorder,
                                    color: S.ptBadgeText,
                                    borderRadius: S.badgeRadius,
                                  }
                                : {
                                    backgroundColor: "var(--lr-row)",
                                    borderColor: "var(--lr-badge-text)",
                                    color: "var(--lr-badge-text)",
                                    borderRadius: S.badgeRadius,
                                  }
                            }
                          >
                            <span className="text-[10px] font-bold uppercase leading-none tracking-wide">{sec.kind}</span>
                            <span className="mt-1 text-[17px] font-black leading-none tabular-nums">{sec.sectionNumber}</span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold" style={{ color: S.heading }}>
                              Section {sec.sectionNumber}
                            </div>
                            <div className="text-xs font-medium md:text-sm" style={{ color: S.muted }}>
                              {sec.sectionTitle}
                              {sec.flags ? ` · ${sec.flags}` : ""}
                            </div>
                          </div>
                          {sOpen ? <ChevronDown className="size-5 shrink-0 text-[#666d80]" /> : <ChevronRight className="size-5 shrink-0 text-[#666d80]" />}
                        </button>

                        {sOpen ? (
                          <div style={{ backgroundColor: S.passagePanel }}>
                            {sec.passages.map((pass) => {
                              const pOpen = openPassage.has(passKey(pt.id, sec.id, pass.id))
                              return (
                                <div key={pass.id} className="border-t" style={{ borderColor: S.border }}>
                                  <button
                                    type="button"
                                    className="flex w-full items-start gap-3 px-4 py-3 pl-6 text-left md:pl-12"
                                    onClick={() =>
                                      setOpenPassage((prev) => {
                                        const k = passKey(pt.id, sec.id, pass.id)
                                        const next = new Set(prev)
                                        if (next.has(k)) next.delete(k)
                                        else next.add(k)
                                        return next
                                      })
                                    }
                                  >
                                    <span
                                      className="mt-0.5 flex size-9 shrink-0 items-center justify-center text-xs font-bold text-white"
                                      style={{ backgroundColor: S.accent, borderRadius: S.badgeRadius }}
                                    >
                                      {pass.label}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-bold" style={{ color: S.heading }}>
                                        {pass.title}
                                      </div>
                                      {pass.snippet ? (
                                        <div className="mt-0.5 line-clamp-2 text-xs leading-relaxed md:text-sm" style={{ color: S.muted }}>
                                          {pass.snippet}
                                        </div>
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
                                        const detailHref = explanationQuestionDetailHref(pt.id, sec.id, pass.id, q.id)
                                        return (
                                          <li
                                            key={q.id}
                                            className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 md:flex-row md:items-center md:gap-4 md:pl-16 md:pr-4"
                                            style={{ borderColor: S.border }}
                                          >
                                            <Link
                                              to={detailHref}
                                              className="flex min-w-0 flex-1 items-start gap-3 rounded-lg outline-offset-2 hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-student-accent)]"
                                            >
                                              <span
                                                className="mt-0.5 flex size-8 shrink-0 items-center justify-center border-2 bg-white text-sm font-semibold"
                                                style={{ borderColor: S.accent, color: S.accent, borderRadius: S.badgeRadius }}
                                              >
                                                {q.number}
                                              </span>
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold" style={{ color: S.accent }}>
                                                  {q.code}
                                                </div>
                                                <p className="mt-1 text-sm leading-snug" style={{ color: S.heading }}>
                                                  {q.snippet}
                                                </p>
                                                <p className="mt-2 text-xs leading-relaxed" style={{ color: S.muted }}>
                                                  {q.source}
                                                </p>
                                                <div className="mt-3 flex flex-wrap items-center gap-3 md:hidden">
                                                  <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(q.status)}`}
                                                  >
                                                    {statusLabel(q.status)}
                                                  </span>
                                                  <DifficultyMeter level={q.difficulty} />
                                                </div>
                                              </div>
                                            </Link>

                                            <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end md:gap-2">
                                              <span
                                                className={`hidden md:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(q.status)}`}
                                              >
                                                {statusLabel(q.status)}
                                              </span>
                                              <span className="hidden md:block">
                                                <DifficultyMeter level={q.difficulty} />
                                              </span>
                                              <div className="flex items-center gap-1 md:ml-0">
                                                <Button type="button" variant="ghost" size="icon" className="size-9 text-[#666d80] hover:text-[color:var(--color-student-heading)]" asChild>
                                                  <Link to={`${detailHref}?tab=analytics`} aria-label="Open analytics tab">
                                                    <BarChart3 className="size-4" />
                                                  </Link>
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="size-9 text-[#666d80] hover:text-[color:var(--color-student-heading)]" asChild>
                                                  <Link to={`${detailHref}?tab=explanation`} aria-label={q.hasVideo ? "Watch explanation" : "Open explanation tab"}>
                                                    {q.hasVideo ? <Play className="size-4 fill-current" /> : <Play className="size-4" />}
                                                  </Link>
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="size-9 text-[#666d80] hover:text-[color:var(--color-student-heading)]" aria-label="Bookmark">
                                                  <Bookmark className="size-4" />
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

      <p className="mt-4 flex items-center gap-2 text-xs text-[#666d80]">
        <PlayCircle className="size-4 shrink-0 text-[color:var(--color-student-accent)]" />
        Explanations unlock as you work questions in drills and PrepTests. This list uses sample data until your history syncs.
      </p>
    </StudentMain>
  )
}

export { ExplanationsPage }
