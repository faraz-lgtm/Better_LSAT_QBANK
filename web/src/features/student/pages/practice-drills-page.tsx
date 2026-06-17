import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink, LineChart } from "lucide-react"

import {
  ContinueDrillCard,
  continueDrillToCardDrill,
} from "@/features/student/components/continue-drill-card"
import { PracticeLrRcStarterCards } from "@/features/student/components/practice-lr-rc-starter-cards"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import {
  mapSessionToContinueDrill,
  type ContinueDrill,
} from "@/features/student/drills/drill-dashboard-mappers"
import { createAnalyticsApi, type PriorityRow } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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

function filterPill(active: boolean): string {
  if (active) return "rounded-xl border border-[#0d47a1] bg-[#0d47a1] px-4 py-2 text-sm font-semibold tracking-[0.28px] text-white"
  return "rounded-xl border border-[#dfe1e7] bg-white px-4 py-2 text-sm font-semibold tracking-[0.28px] text-[#0d47a1]"
}

function difficultyVisual(difficulty: PriorityRow["difficulty"]) {
  // Matches the Figma Drills tags difficulty dots.
  // 1 => Easiest, 2 => Easy, 3 => Medium, 4 => Hard, 5 => Hardest (and anything above).
  if (difficulty == null || difficulty <= 1) {
    return { label: "Easiest", filledBars: 1, color: "#0bbcc9" }
  }
  if (difficulty === 2) {
    return { label: "Easy", filledBars: 2, color: "#ffbd4c" }
  }
  if (difficulty === 3) {
    return { label: "Medium", filledBars: 3, color: "#0bbcc9" }
  }
  if (difficulty === 4) {
    return { label: "Hard", filledBars: 4, color: "#df1c41" }
  }
  return { label: "Hardest", filledBars: 5, color: "#df1c41" }
}

function mapPriorityToTagDrill(row: PriorityRow): TagDrill | null {
  const section = row.sectionType === "LR" || row.sectionType === "RC" ? row.sectionType : "LR"
  const visual = difficultyVisual(row.difficulty)
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
    <StudentMain className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-3xl border border-[#dfe1e7] bg-white p-6">
          <div className="flex items-center gap-2 text-[14px] font-semibold leading-none tracking-[0.1px] text-[#0d47a1]">
            <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => navigate("/app/analytics/drills")}>
              Drills History
              <ExternalLink className="size-3.5" />
            </button>
            <span className="mx-1 h-3.5 w-px bg-[#dfe1e7]" />
            <span>In Process</span>
            <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-[#eceff3] text-[10px] font-semibold text-[#0d47a1]">
              {continueDrills.length}
            </span>
          </div>

          <PracticeLrRcStarterCards
            lrButtonLabel="New Drill"
            rcButtonLabel="Start Drill"
            lrSubtitle="Master argument analysis and critical thinking skills"
            rcSubtitle="Improve passage analysis and comprehension strategies"
            onStartLr={() => navigate("/app/practice/drills/lr/new")}
            onStartRc={() => navigate("/app/practice/drills/rc/new")}
          />
        </section>

        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-6 mt-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[24px] font-bold leading-[1.2]" style={{ color: "#062357" }}>
              Continue Drills
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setContinueFilter("all")} className={filterPill(continueFilter === "all")}>
                All Drills
              </button>
              <button type="button" onClick={() => setContinueFilter("lr")} className={filterPill(continueFilter === "lr")}>
                Logical Reasoning
              </button>
              <button type="button" onClick={() => setContinueFilter("rc")} className={filterPill(continueFilter === "rc")}>
                Reading Comprehension
              </button>
            </div>
          </div>
          {loading ? (
            <StudentPageLoader label="Loading drills…" />
          ) : filteredContinue.length === 0 ? (
            <p className="text-sm text-[#666d80]">No drills in progress. Start a new LR or RC drill above.</p>
          ) : (
            <div className="space-y-4">
              {filteredContinue.map((drill) => (
                <ContinueDrillCard
                  key={drill.id}
                  drill={continueDrillToCardDrill(drill)}
                  onContinue={() => navigate(drill.continuePath)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[24px] font-bold leading-[1.2]" style={{ color: "#062357" }}>
              Drills by Tags
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setSectionFilter("all")} className={filterPill(sectionFilter === "all")}>
                All Drills
              </button>
              <button type="button" onClick={() => setSectionFilter("lr")} className={filterPill(sectionFilter === "lr")}>
                Logical Reasoning
              </button>
              <button type="button" onClick={() => setSectionFilter("rc")} className={filterPill(sectionFilter === "rc")}>
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
            <StudentPageLoader label="Loading tag drills…" />
          ) : filteredTags.length === 0 ? (
            <p className="text-sm text-[#666d80]">Answer more questions to unlock priority tag drills.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {filteredTags.map((drill) => (
                <article
                  key={drill.id}
                  className="w-[290px] shrink-0 overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_5px_10px_rgba(13,13,18,0.06)]"
                >
                  <div
                    className="flex h-12 items-center justify-center bg-[#f6f8fa] text-[18px] font-bold leading-[1.35] text-[#062357]"
                  >
                    {drill.sectionLabel}
                  </div>
                  <div className="space-y-5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="max-w-[150px] text-[18px] font-bold leading-[1.2] text-[#062357]">{drill.title}</h3>
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
                      className="ds-btn-sm w-full rounded-3xl text-sm tracking-[0.28px]"
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
  )
}

export { PracticeDrillsPage }
