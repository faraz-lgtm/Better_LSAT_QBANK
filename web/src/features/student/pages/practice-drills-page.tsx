import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink, LineChart } from "lucide-react"

import {
  ContinueDrillCard,
  continueDrillToCardDrill,
} from "@/features/student/components/continue-drill-card"
import { DrillDifficultyStatus } from "@/features/student/components/drill-difficulty-status"
import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
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

function difficultyVisual(difficulty: PriorityRow["difficulty"]) {
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
    <StudentMain className="drills-page flex flex-col gap-[24px]">
      <section className="flex flex-col gap-[16px] rounded-[24px] border border-[#dfe1e7] bg-white p-[24px]">
        <div className="flex items-center gap-[8px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#0d47a1]">
          <button
            type="button"
            className="inline-flex items-center gap-[8px] hover:underline"
            onClick={() => navigate("/app/analytics/drills")}
          >
            Drills History
            <ExternalLink className="size-[20px]" />
          </button>
          <span className="mx-1 h-[14px] w-px bg-[#dfe1e7]" />
          <span>In Process</span>
          <span className="inline-flex size-[20px] items-center justify-center rounded-[12px] bg-[#eceff3] text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-[#0d47a1]">
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

      <section className="rounded-[24px] border border-[#dfe1e7] bg-white p-[24px]">
        <div className="mb-[24px] flex flex-wrap items-center justify-between gap-[12px]">
          <h2 className="text-[24px] font-bold leading-[1.3] text-[#062357]">Continue Drills</h2>
          <div className="flex flex-wrap items-center gap-[8px]">
            <button
              type="button"
              onClick={() => setContinueFilter("all")}
              className={drillFilterPillClass(continueFilter === "all")}
            >
              All Drills
            </button>
            <button
              type="button"
              onClick={() => setContinueFilter("lr")}
              className={drillFilterPillClass(continueFilter === "lr")}
            >
              Logical Reasoning
            </button>
            <button
              type="button"
              onClick={() => setContinueFilter("rc")}
              className={drillFilterPillClass(continueFilter === "rc")}
            >
              Reading Comprehension
            </button>
          </div>
        </div>
        {loading ? (
          <StudentPageLoader label="Loading drills…" />
        ) : filteredContinue.length === 0 ? (
          <p className="text-[14px] text-[#666d80]">No drills in progress. Start a new LR or RC drill above.</p>
        ) : (
          <div className="flex flex-col gap-[24px]">
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

      <section className="rounded-[24px] border border-[#dfe1e7] bg-white p-[24px]">
        <div className="mb-[24px] flex flex-wrap items-center justify-between gap-[12px]">
          <h2 className="text-[24px] font-bold leading-[1.3] text-[#062357]">Drills by Tags</h2>
          <div className="flex flex-wrap items-center gap-[8px]">
            <button
              type="button"
              onClick={() => setSectionFilter("all")}
              className={drillFilterPillClass(sectionFilter === "all")}
            >
              All Drills
            </button>
            <button
              type="button"
              onClick={() => setSectionFilter("lr")}
              className={drillFilterPillClass(sectionFilter === "lr")}
            >
              Logical Reasoning
            </button>
            <button
              type="button"
              onClick={() => setSectionFilter("rc")}
              className={drillFilterPillClass(sectionFilter === "rc")}
            >
              Reading Comprehension
            </button>
          </div>
        </div>

        <div className="mb-[24px] flex flex-wrap items-center justify-between gap-[12px]">
          <p className="inline-flex items-center gap-[8px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1]">
            <LineChart className="size-[24px] shrink-0" />
            Priority ratings are assigned to tags based on your past performance and potential impact on your score.
          </p>
          <button
            type="button"
            className="inline-flex h-[32px] items-center gap-[8px] text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-[#0d47a1] hover:underline"
            onClick={() => navigate("/app/analytics")}
          >
            View all priorities
            <ExternalLink className="size-[16px]" />
          </button>
        </div>

        {loading ? (
          <StudentPageLoader label="Loading tag drills…" />
        ) : filteredTags.length === 0 ? (
          <p className="text-[14px] text-[#666d80]">Answer more questions to unlock priority tag drills.</p>
        ) : (
          <div className="flex gap-[24px] overflow-x-auto pb-[8px]">
            {filteredTags.map((drill) => (
              <article
                key={drill.id}
                className="w-[290px] shrink-0 overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
              >
                <div className="flex h-[48px] items-center justify-center bg-[#f6f8fa] text-[18px] font-bold leading-[1.35] text-[#062357]">
                  {drill.sectionLabel}
                </div>
                <div className="flex flex-col gap-[24px] p-[24px]">
                  <div className="flex items-start justify-between gap-[12px]">
                    <h3 className="max-w-[151px] text-[18px] font-bold leading-[1.35] text-[#062357]">{drill.title}</h3>
                    <DrillDifficultyStatus
                      label={drill.difficultyLabel}
                      filledBars={drill.filledBars}
                      color={drill.difficultyColor}
                      layout="stacked"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-[40px] w-[242px] items-center justify-center rounded-[16px] border border-[#0b4e6e] bg-[#0d47a1] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
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
