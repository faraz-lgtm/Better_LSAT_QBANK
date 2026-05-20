import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import { createAnalyticsApi, type PriorityRow } from "@/lib/api/analytics"
import type { PracticeSessionSummary } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ExternalLink, LineChart, ListChecks, Timer } from "lucide-react"

type ContinueDrill = {
  id: string
  section: "LR" | "RC"
  title: string
  progressPct: number
  questions: string
  timeLabel: string
  lastAttempt: string
  progressColor: string
}

type TagDrill = {
  id: string
  questionTypeId: string
  sectionLabel: string
  sectionTone: "lr" | "rc"
  title: string
  difficultyLabel: string
  filledBars: number
  difficultyColor: string
  configPath: string
}

function sectionBadgeTone(section: "LR" | "RC"): string {
  return section === "LR" ? "bg-[#fffbeb] text-[#ae8b00]" : "bg-[#fff3ea] text-[#ff9d51]"
}

function filterPill(active: boolean): string {
  if (active) return "border-[#0b4e6e] bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
  return "border-[#dfe1e7] bg-white text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)]"
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = Math.max(0, now - then)
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return hours === 1 ? "1 hour ago" : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "1 day ago" : `${days} days ago`
}

function priorityVisual(priority: PriorityRow["priorityLevel"]) {
  if (priority === "high") {
    return { label: "Hardest", filledBars: 5, color: "#df1c41" }
  }
  if (priority === "medium") {
    return { label: "Medium", filledBars: 3, color: "#ff6f00" }
  }
  return { label: "Easy", filledBars: 2, color: "#ffbd4c" }
}

function sessionSectionType(session: PracticeSessionSummary): "LR" | "RC" | null {
  const meta = session.metadata
  if (meta.sectionType === "LR" || meta.sectionType === "RC") return meta.sectionType
  if (session.sectionType === "LR" || session.sectionType === "RC") return session.sectionType
  return null
}

function mapSessionToContinueDrill(session: PracticeSessionSummary): ContinueDrill | null {
  const section = sessionSectionType(session)
  if (!section) return null

  const meta = session.metadata
  const questionIds = Array.isArray(meta.questionIds) ? meta.questionIds.length : 0
  const total = typeof meta.questionCount === "number" ? meta.questionCount : questionIds
  const answeredIds = Array.isArray(meta.answeredQuestionIds) ? meta.answeredQuestionIds.length : 0
  const progressPct = total > 0 ? Math.round((100 * answeredIds) / total) : 0

  const title =
    (typeof meta.title === "string" && meta.title) ||
    (typeof meta.tagLabel === "string" && meta.tagLabel) ||
    `${section} drill`

  return {
    id: session.id,
    section,
    title,
    progressPct,
    questions: `${answeredIds}/${total || "—"}`,
    timeLabel: typeof meta.timing === "string" ? meta.timing : "—",
    lastAttempt: formatRelativeTime(session.startedAt),
    progressColor: section === "LR" ? "#9d1be8" : "#ff9d51",
  }
}

function mapPriorityToTagDrill(row: PriorityRow): TagDrill | null {
  const section = row.sectionType === "LR" || row.sectionType === "RC" ? row.sectionType : "LR"
  const visual = priorityVisual(row.priorityLevel)
  const configPath =
    section === "LR"
      ? `/app/practice/drills/lr/new?questionTypeId=${encodeURIComponent(row.questionTypeId)}&tag=${encodeURIComponent(row.name)}`
      : `/app/practice/drills/rc/new?questionTypeId=${encodeURIComponent(row.questionTypeId)}&tag=${encodeURIComponent(row.name)}`

  return {
    id: row.questionTypeId,
    questionTypeId: row.questionTypeId,
    sectionLabel: section === "LR" ? "Logical Reasoning" : "Reading Comprehension",
    sectionTone: section === "LR" ? "lr" : "rc",
    title: row.name,
    difficultyLabel: visual.label,
    filledBars: visual.filledBars,
    difficultyColor: visual.color,
    configPath,
  }
}

function ContinueDrillCard({ drill, onContinue }: { drill: ContinueDrill; onContinue: () => void }) {
  const ringFill = useMemo(
    () => `conic-gradient(from 270deg, ${drill.progressColor} ${drill.progressPct}%, #dfe1e7 ${drill.progressPct}% 100%)`,
    [drill.progressColor, drill.progressPct],
  )

  return (
    <article className="rounded-3xl bg-[#f6f8fa] p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex gap-4">
          <div className="w-12 shrink-0">
            <div className={`flex h-16 w-12 items-center justify-center rounded-2xl text-xl font-bold ${sectionBadgeTone(drill.section)}`}>
              {drill.section}
            </div>
            <div className="relative mt-3 flex size-11 items-center justify-center rounded-full" style={{ background: ringFill }}>
              <div className="absolute inset-[4px] rounded-full bg-[#f6f8fa]" />
              <span className="relative text-xs font-semibold text-[#4b5565]">{drill.progressPct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[28px] font-bold leading-[1.2] text-[#062357]">{drill.title}</h3>

            <div className="mt-3 flex flex-wrap items-center gap-5">
              <div className="flex min-w-[180px] items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#eceff3] text-[#9ca3af]">
                  <LineChart className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-[#666d80]">Progress</p>
                  <p className="text-sm font-semibold tracking-[0.28px] text-[#1a1b25]">{drill.progressPct}%</p>
                </div>
              </div>
              <div className="flex min-w-[180px] items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#eceff3] text-[#9ca3af]">
                  <ListChecks className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-[#666d80]">Questions</p>
                  <p className="text-sm font-semibold tracking-[0.28px] text-[#1a1b25]">{drill.questions}</p>
                </div>
              </div>
              <div className="flex min-w-[160px] items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#eceff3] text-[#9ca3af]">
                  <Timer className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-[#666d80]">Timing</p>
                  <p className="text-sm font-semibold tracking-[0.28px] text-[#1a1b25]">{drill.timeLabel}</p>
                </div>
              </div>
              <p className="ml-auto text-xs tracking-[0.24px] text-[#6a7282]">Started {drill.lastAttempt}</p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eceff3]">
              <div className="h-full rounded-full" style={{ width: `${drill.progressPct}%`, backgroundColor: drill.progressColor }} />
            </div>
          </div>
        </div>
        <div className="lg:ml-auto">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] px-4 text-base font-semibold tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#0d47a1]/90"
          >
            Continue
            <span aria-hidden>›</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function PracticeDrillsPage() {
  const navigate = useNavigate()
  const analyticsApi = useMemo(() => createAnalyticsApi(getSupabaseBrowserClient()), [])

  const [continueFilter, setContinueFilter] = useState<"all" | "lr" | "rc">("all")
  const [sectionFilter, setSectionFilter] = useState<"all" | "lr" | "rc">("all")
  const [continueDrills, setContinueDrills] = useState<ContinueDrill[]>([])
  const [tagDrills, setTagDrills] = useState<TagDrill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const [sessionsResult, priorities] = await Promise.all([
          analyticsApi.getSessions({ kind: "DRILL", limit: 50 }),
          analyticsApi.getPriorities(),
        ])
        if (cancelled) return
        const inProgress = sessionsResult.sessions
          .filter((s) => !s.completedAt)
          .map(mapSessionToContinueDrill)
          .filter((d): d is ContinueDrill => d != null)
        setContinueDrills(inProgress)
        setTagDrills(
          priorities
            .filter((p) => p.sectionType === "LR" || p.sectionType === "RC" || p.sectionType === null)
            .map(mapPriorityToTagDrill)
            .filter((d): d is TagDrill => d != null)
            .slice(0, 12),
        )
      } catch {
        if (!cancelled) {
          setContinueDrills([])
          setTagDrills([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [analyticsApi])

  const filteredContinue = continueDrills.filter((drill) => {
    if (continueFilter === "all") return true
    return continueFilter === "lr" ? drill.section === "LR" : drill.section === "RC"
  })
  const filteredTags = tagDrills.filter((drill) => {
    if (sectionFilter === "all") return true
    return sectionFilter === "lr" ? drill.sectionTone === "lr" : drill.sectionTone === "rc"
  })

  return (
    <>
      <section className="border-b border-[#dfe1e7] bg-[#f3f7ff]">
        <div className="mx-auto flex h-12 w-full max-w-[1280px] items-center justify-between px-4 md:px-6">
          <h1 className="text-[20px] font-bold leading-[1.35] text-[#062357]">Drills</h1>
          <div className="flex items-center gap-1 text-xs tracking-[0.24px]">
            <span className="text-[#666d80]">Practice</span>
            <span className="text-[#666d80]">/</span>
            <span className="font-semibold text-[#0d47a1]">Drills</span>
          </div>
        </div>
      </section>

      <StudentMain className="space-y-6">
        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-6">
          <div className="flex items-center gap-2 text-base font-semibold tracking-[0.32px] text-[#0d47a1]">
            <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => navigate("/app/analytics/drills")}>
              Drills History
              <ExternalLink className="size-4" />
            </button>
            <span className="mx-1 h-3.5 w-px bg-[#dfe1e7]" />
            <span>In Process</span>
            <span className="inline-flex size-5 items-center justify-center rounded-xl bg-[#eceff3] text-xs font-semibold text-[#0d47a1]">
              {continueDrills.length}
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#dfe1e7] bg-[#f6f8fa] px-6 py-9 shadow-[0px_5px_10px_rgba(13,13,18,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#fffbeb] text-xl font-black text-[#ae8b00]">LR</span>
                  <div>
                    <h2 className="text-[28px] font-bold leading-[1.2] text-[#062357]">Logical Reasoning</h2>
                    <p className="text-xs tracking-[0.24px] text-[#062357]">Master argument analysis and critical thinking skills</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="h-[52px] rounded-2xl border border-[#7f0ac2] bg-[#fffbeb] px-4 text-base font-semibold tracking-[0.32px] text-[#ae8b00]"
                  onClick={() => navigate("/app/practice/drills/lr/new")}
                >
                  New Drill
                </button>
              </div>
            </article>

            <article className="rounded-3xl border border-[#dfe1e7] bg-[#f6f8fa] px-6 py-9 shadow-[0px_5px_10px_rgba(13,13,18,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#ff9d51] text-xl font-black text-white">RC</span>
                  <div>
                    <h2 className="text-[28px] font-bold leading-[1.2] text-[#062357]">Reading Comprehension</h2>
                    <p className="text-xs tracking-[0.24px] text-[#062357]">Improve passage analysis and comprehension strategies</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="h-[52px] rounded-2xl border border-[#40c4aa] bg-[#fff3ea] px-4 text-base font-semibold tracking-[0.32px] text-[#ff9d51]"
                  onClick={() => navigate("/app/practice/drills/rc/new")}
                >
                  Start Drill
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[34px] font-bold leading-[1.2] text-[#062357]">Continue Drills</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setContinueFilter("all")} className={`h-10 rounded-2xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(continueFilter === "all")}`}>
                All Drills
              </button>
              <button type="button" onClick={() => setContinueFilter("lr")} className={`h-10 rounded-xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(continueFilter === "lr")}`}>
                Logical Reasoning
              </button>
              <button type="button" onClick={() => setContinueFilter("rc")} className={`h-10 rounded-xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(continueFilter === "rc")}`}>
                Reading Comprehension
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-[#666d80]">Loading drills…</p>
          ) : filteredContinue.length === 0 ? (
            <p className="text-sm text-[#666d80]">No drills in progress. Start a new LR or RC drill above.</p>
          ) : (
            <div className="space-y-4">
              {filteredContinue.map((drill) => (
                <ContinueDrillCard
                  key={drill.id}
                  drill={drill}
                  onContinue={() => navigate(`/app/practice/drills/session/${drill.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[34px] font-bold leading-[1.2] text-[#062357]">Drills by Tags</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setSectionFilter("all")} className={`h-10 rounded-2xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(sectionFilter === "all")}`}>
                All Drills
              </button>
              <button type="button" onClick={() => setSectionFilter("lr")} className={`h-10 rounded-xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(sectionFilter === "lr")}`}>
                Logical Reasoning
              </button>
              <button type="button" onClick={() => setSectionFilter("rc")} className={`h-10 rounded-xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(sectionFilter === "rc")}`}>
                Reading Comprehension
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.28px] text-[#0d47a1]">
              <LineChart className="size-4" />
              Priority ratings are assigned to tags based on your past performance and potential impact on your score.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold tracking-[0.24px] text-[#0d47a1] hover:underline"
              onClick={() => navigate("/app/analytics")}
            >
              View all priorities
              <ExternalLink className="size-3.5" />
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#666d80]">Loading tag drills…</p>
          ) : filteredTags.length === 0 ? (
            <p className="text-sm text-[#666d80]">Answer more questions to unlock priority tag drills.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {filteredTags.map((drill) => (
                <article key={drill.id} className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_5px_10px_rgba(13,13,18,0.06)]">
                  <div
                    className={`flex h-12 items-center justify-center text-lg font-bold leading-[1.35] ${
                      drill.sectionTone === "lr" ? "bg-[#fffbeb] text-[#ae8b00]" : "bg-[#fff3ea] text-[#ff9d51]"
                    }`}
                  >
                    {drill.sectionLabel}
                  </div>
                  <div className="space-y-5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="max-w-[150px] text-[28px] font-bold leading-[1.2] text-[#062357]">{drill.title}</h3>
                      <div className="rounded-[10px] bg-[#f3f7ff] px-2.5 py-2">
                        <p className="text-right text-[10px] font-semibold tracking-[0.24px]" style={{ color: drill.difficultyColor }}>
                          {drill.difficultyLabel}
                        </p>
                        <div className="mt-1 flex gap-1.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span
                              key={index}
                              className="h-4 w-1.5 rounded-full"
                              style={{ backgroundColor: index < drill.filledBars ? drill.difficultyColor : "#ced0e7" }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="h-10 w-full rounded-2xl bg-[#0d47a1] text-sm font-semibold tracking-[0.28px] text-white shadow-[0px_5px_10px_rgba(13,13,18,0.06)] hover:bg-[#0d47a1]/90"
                      onClick={() => navigate(drill.configPath)}
                    >
                      Start Drill
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </StudentMain>
    </>
  )
}

export { PracticeDrillsPage }
