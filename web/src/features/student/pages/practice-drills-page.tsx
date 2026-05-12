import { useMemo, useState, type CSSProperties } from "react"
import { LineChart, ListChecks, RefreshCw, Timer } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { drillSurfaceCard } from "@/features/student/drills/drill-surface-style"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import { StudentMain } from "@/features/student/components/student-main"

type ContinueDrill = {
  id: string
  section: "LR" | "RC"
  title: string
  progressPct: number
  questions: string
  timeLabel: string
  lastAttempt: string
  barColor: string
  difficultyLabel: string
  difficultyFilled: number
  difficultyColor: string
}

type TagDrill = {
  id: string
  sectionLabel: string
  sectionTone: "lr" | "rc"
  title: string
  difficultyLabel: string
  filledBars: number
  difficultyColor: string
}

const continueDrills: ContinueDrill[] = [
  {
    id: "cd-1",
    section: "LR",
    title: "Causal reasoning drill",
    progressPct: 45,
    questions: "45/100",
    timeLabel: "15 min",
    lastAttempt: "2 days ago",
    barColor: "var(--drill-progress-lr)",
    difficultyLabel: "Hardest",
    difficultyFilled: 5,
    difficultyColor: "var(--drill-danger)",
  },
  {
    id: "cd-2",
    section: "RC",
    title: "Comparative drill",
    progressPct: 45,
    questions: "45/100",
    timeLabel: "15 min",
    lastAttempt: "2 days ago",
    barColor: "var(--rc-progress)",
    difficultyLabel: "Hardest",
    difficultyFilled: 5,
    difficultyColor: "var(--drill-danger)",
  },
]

const tagDrills: TagDrill[] = [
  {
    id: "tag-1",
    sectionLabel: "Logical Reasoning",
    sectionTone: "lr",
    title: "Causal reasoning drill",
    difficultyLabel: "Hardest",
    filledBars: 5,
    difficultyColor: "var(--drill-danger)",
  },
  {
    id: "tag-2",
    sectionLabel: "Reading Comprehension",
    sectionTone: "rc",
    title: "Critique or debate drill",
    difficultyLabel: "Easy",
    filledBars: 2,
    difficultyColor: "var(--drill-easy)",
  },
  {
    id: "tag-3",
    sectionLabel: "Logical Reasoning",
    sectionTone: "lr",
    title: "Causal reasoning drill",
    difficultyLabel: "Medium",
    filledBars: 3,
    difficultyColor: "var(--drill-medium)",
  },
  {
    id: "tag-4",
    sectionLabel: "Reading Comprehension",
    sectionTone: "rc",
    title: "Critique or debate drill",
    difficultyLabel: "Easiest",
    filledBars: 1,
    difficultyColor: "var(--rc-progress)",
  },
]

function filterPillClass(active: boolean): string {
  if (active) {
    return "border text-white shadow-sm"
  }
  return "border border-solid shadow-sm"
}

function filterPillStyle(active: boolean): CSSProperties {
  if (active) {
    return { borderColor: "var(--color-student-cta)", backgroundColor: "var(--color-student-cta)" }
  }
  return {
    borderColor: "var(--color-student-cta)",
    color: "var(--color-student-cta)",
    backgroundColor: "var(--greyscale-25)",
  }
}

function ContinueDrillCard({ drill }: { drill: ContinueDrill }) {
  const ringFill = useMemo(
    () => `conic-gradient(from 270deg, ${drill.barColor} ${drill.progressPct}%, var(--greyscale-100) ${drill.progressPct}% 100%)`,
    [drill.barColor, drill.progressPct],
  )

  return (
    <article className="rounded-2xl border border-solid p-6 md:p-6"  style={{
      ...drillSurfaceCard,
      backgroundColor: "#F5F9FF",
    }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <SectionInitialBadge section={drill.section} />
          <h3
            className="min-w-0 pt-0.5 text-xl font-bold leading-snug tracking-tight md:text-2xl"
            style={{ color: "var(--color-student-heading)" }}
          >
            {drill.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className="h-4 w-1 rounded-full"
                  style={{
                    backgroundColor: index < drill.difficultyFilled ? drill.difficultyColor : "var(--slate-bar-empty)",
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-semibold" style={{ color: drill.difficultyColor }}>
              {drill.difficultyLabel}
            </span>
          </div>
          <button
            type="button"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-95"
            style={{ backgroundColor: "var(--color-student-accent)", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}
          >
            Continue
            <span aria-hidden className="text-base leading-none">
              ›
            </span>
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full" style={{ background: ringFill }}>
          <div className="absolute inset-[5px] rounded-full bg-background" />
          <span className="relative text-xs font-semibold text-muted-foreground">
            {drill.progressPct}%
          </span>
        </div>
        <div className="flex flex-1 flex-wrap items-stretch gap-6 sm:gap-8">
          <div className="flex min-w-[100px] items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <LineChart className="size-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-student-heading)" }}>
                {drill.progressPct}%
              </p>
            </div>
          </div>
          <div className="flex min-w-[100px] items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <ListChecks className="size-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-student-heading)" }}>
                {drill.questions}
              </p>
            </div>
          </div>
          <div className="flex min-w-[100px] items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Timer className="size-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-student-heading)" }}>
                {drill.timeLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${drill.progressPct}%`, backgroundColor: drill.barColor }} />
      </div>

      <p className="text-muted-foreground mt-3 text-right text-xs">Last attempt: {drill.lastAttempt}</p>
    </article>
  )
}

function PracticeDrillsPage() {
  const navigate = useNavigate()
  const [continueFilter, setContinueFilter] = useState<"all" | "lr" | "rc">("all")
  const [sectionFilter, setSectionFilter] = useState<"all" | "lr" | "rc">("all")

  const filteredContinue = continueDrills.filter((drill) => {
    if (continueFilter === "all") return true
    return continueFilter === "lr" ? drill.section === "LR" : drill.section === "RC"
  })
  const filteredTags = tagDrills.filter((drill) => {
    if (sectionFilter === "all") return true
    return sectionFilter === "lr" ? drill.sectionTone === "lr" : drill.sectionTone === "rc"
  })

  return (
    <StudentMain className="max-w-none bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] py-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <section className="rounded-2xl border border-solid p-6 md:p-6" style={drillSurfaceCard}>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <button type="button" className="inline-flex items-center gap-1.5 hover:opacity-80" style={{ color: "var(--color-student-cta)" }}>
              Drills History
              <RefreshCw className="size-4 shrink-0" strokeWidth={2} />
            </button>
            <span className="mx-1 h-3 w-px bg-slate-200" aria-hidden />
            <span style={{ color: "var(--color-student-cta)" }}>In Process</span>
            <span
              className="inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-student-cta)" }}
            >
              0
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="flex flex-col justify-between gap-4 rounded-xl border border-solid p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4" style={{
  ...drillSurfaceCard,
  backgroundColor: "#F5F9FF",
}}>
              <div className="flex min-w-0 items-center gap-3">
                <SectionInitialBadge section="LR" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-tight md:text-xl" style={{ color: "var(--color-student-heading)" }}>
                    Logical Reasoning
                  </h3>
                  <p className="mt-1 text-xs leading-snug md:text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Master argument analysis and critical thinking skills
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="h-10 shrink-0 rounded-lg border-1 bg-background px-4 text-sm font-semibold transition hover:bg-slate-50"
                style={{ borderColor: "var(--lr-outline-purple)", color: "var(--lr-badge-text)" }}
                onClick={() => navigate("/app/practice/drills/lr/new")}
              >
                New Drill
              </button>
            </article>

            <article className="flex flex-col justify-between gap-4 rounded-xl border border-solid p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4" style={{
  ...drillSurfaceCard,
  backgroundColor: "#F5F9FF",
}}>
              <div className="flex min-w-0 items-center gap-3">
                <SectionInitialBadge section="RC" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-tight md:text-xl" style={{ color: "var(--color-student-heading)" }}>
                    Reading Comprehension
                  </h3>
                  <p className="mt-1 text-xs leading-snug md:text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Improve passage analysis and comprehension strategies
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="h-10 shrink-0 rounded-lg border-1 bg-background px-4 text-sm font-semibold transition hover:bg-slate-50"
                style={{ borderColor: "var(--rc-outline-mint)", color: "var(--rc-progress)" }}
              >
                Start Drill
              </button>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-solid p-6 md:p-6" style={drillSurfaceCard}>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-2xl font-bold tracking-tight md:text-[28px] md:leading-tight" style={{ color: "var(--color-student-heading)" }}>
              Continue Drills
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: "all" as const, label: "All Drills" },
                  { key: "lr" as const, label: "Logical Reasoning" },
                  { key: "rc" as const, label: "Reading Comprehension" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setContinueFilter(key)}
                  className={`h-9 rounded-lg border px-3.5 text-xs font-semibold sm:text-sm ${filterPillClass(continueFilter === key)}`}
                  style={filterPillStyle(continueFilter === key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {filteredContinue.map((drill) => (
              <ContinueDrillCard key={drill.id} drill={drill} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-solid p-6 md:p-6" style={drillSurfaceCard}>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-2xl font-bold tracking-tight md:text-[28px] md:leading-tight" style={{ color: "var(--color-student-heading)" }}>
              Drills by Tags
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: "all" as const, label: "All Drills" },
                  { key: "lr" as const, label: "Logical Reasoning" },
                  { key: "rc" as const, label: "Reading Comprehension" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSectionFilter(key)}
                  className={`h-9 rounded-lg border px-3.5 text-xs font-semibold sm:text-sm ${filterPillClass(sectionFilter === key)}`}
                  style={filterPillStyle(sectionFilter === key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <p className="inline-flex max-w-[720px] items-start gap-2 text-sm leading-snug" style={{ color: "var(--color-student-cta)" }}>
              <LineChart className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              <span>Priority ratings are assigned to tags based on your past performance and potential impact on your score.</span>
            </p>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline sm:text-sm"
              style={{ color: "var(--color-student-cta)" }}
            >
              View all priorities
              <RefreshCw className="size-3.5 shrink-0" strokeWidth={2} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredTags.map((drill) => {
              const headerBg = drill.sectionTone === "lr" ? "var(--lr-row)" : "var(--rc-row)"
              const headerText = drill.sectionTone === "lr" ? "var(--lr-badge-text)" : "var(--rc-header-text)"
              return (
                <article key={drill.id} className="flex flex-col overflow-hidden rounded-2xl border border-solid" style={drillSurfaceCard}>
                  <div
                    className="flex h-11 items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: headerBg, color: headerText }}
                  >
                    {drill.sectionLabel}
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 flex-1 text-lg font-bold leading-snug md:text-xl" style={{ color: "var(--color-student-heading)" }}>
                        {drill.title}
                      </h3>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: drill.difficultyColor }}>
                          {drill.difficultyLabel}
                        </p>
                        <div className="mt-1 flex justify-end gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span
                              key={index}
                              className="h-4 w-1 rounded-full"
                              style={{
                                backgroundColor: index < drill.filledBars ? drill.difficultyColor : "var(--slate-bar-empty)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-auto h-10 w-full rounded-xl text-sm font-semibold text-white transition hover:opacity-95"
                      style={{ backgroundColor: "var(--color-student-accent)" }}
                    >
                      Start Drill
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </StudentMain>
  )
}

export { PracticeDrillsPage }
