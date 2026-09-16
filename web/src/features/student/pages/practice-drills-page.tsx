import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink } from "lucide-react"

import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
import {
  PracticeContinueDrillsSection,
  type ContinueSectionFilter,
} from "@/features/student/components/practice-continue-drills-section"
import { PracticeLrRcStarterCards } from "@/features/student/components/practice-lr-rc-starter-cards"
import { PracticeTagDrillsSections, type TagDrill } from "@/features/student/components/practice-tag-drills-sections"
import { StudentMain } from "@/features/student/components/student-main"
import {
  mapSessionToContinueDrill,
  type ContinueDrill,
} from "@/features/student/drills/drill-dashboard-mappers"
import {
  groupPriorityRowsBySection,
  priorityMeterFromRow,
} from "@/features/student/drills/tag-drills-priority"
import { createAnalyticsApi, type PriorityRow } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type SectionFilter = "all" | "lr" | "rc"

function mapPriorityToTagDrill(row: PriorityRow): TagDrill | null {
  const section = row.sectionType === "LR" || row.sectionType === "RC" ? row.sectionType : null
  if (!section) return null
  const visual = priorityMeterFromRow(row)
  const configPath =
    section === "LR"
      ? `/app/practice/drills/lr/new?questionTypeId=${encodeURIComponent(row.questionTypeId)}&tag=${encodeURIComponent(row.name)}`
      : `/app/practice/drills/rc/new?questionTypeId=${encodeURIComponent(row.questionTypeId)}&tag=${encodeURIComponent(row.name)}`

  return {
    id: row.questionTypeId,
    questionTypeId: row.questionTypeId,
    section,
    title: row.name,
    difficultyLabel: visual.label,
    filledBars: visual.filledBars,
    difficultyColor: visual.color,
    configPath,
  }
}

function difficultyLabelFromContinue(level: ContinueDrill["difficulty"]): string {
  if (level === "hardest") return "Hardest"
  if (level === "medium") return "Medium"
  return "Easy"
}

function PracticeDrillsPage() {
  const navigate = useNavigate()
  const analyticsApi = useMemo(() => createAnalyticsApi(getSupabaseBrowserClient()), [])

  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all")
  const [continueDrills, setContinueDrills] = useState<ContinueDrill[]>([])
  const [continueFilter, setContinueFilter] = useState<ContinueSectionFilter>("all")
  const [lrTagDrills, setLrTagDrills] = useState<TagDrill[]>([])
  const [rcTagDrills, setRcTagDrills] = useState<TagDrill[]>([])
  const [lrContinueExpanded, setLrContinueExpanded] = useState(false)
  const [rcContinueExpanded, setRcContinueExpanded] = useState(false)
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
        const grouped = groupPriorityRowsBySection(
          priorities.filter((p) => p.sectionType === "LR" || p.sectionType === "RC"),
        )
        setLrTagDrills(grouped.lr.map(mapPriorityToTagDrill).filter((d): d is TagDrill => d != null))
        setRcTagDrills(grouped.rc.map(mapPriorityToTagDrill).filter((d): d is TagDrill => d != null))
        setContinueFilter("all")
        setLrContinueExpanded(false)
        setRcContinueExpanded(false)
      } catch {
        if (!cancelled) {
          setContinueDrills([])
          setLrTagDrills([])
          setRcTagDrills([])
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
    if (sectionFilter === "all") return true
    return sectionFilter === "lr" ? drill.section === "LR" : drill.section === "RC"
  })

  useEffect(() => {
    setContinueFilter(sectionFilter)
    setLrContinueExpanded(false)
    setRcContinueExpanded(false)
  }, [sectionFilter])

  const starterVisible =
    sectionFilter === "all" ? (["lr", "rc"] as const) : sectionFilter === "lr" ? (["lr"] as const) : (["rc"] as const)

  return (
    <StudentMain className="drills-page bg-[var(--primary-0)]" contentClassName="flex flex-col gap-[25px] bg-[var(--primary-0)] pb-[48px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <button
            type="button"
            onClick={() => setSectionFilter("all")}
            className={drillFilterPillClass(sectionFilter === "all")}
          >
            All
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
        <button
          type="button"
          className="inline-flex h-[32px] items-center gap-[8px] pr-[16px] text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-[var(--primary)] hover:underline"
          onClick={() => navigate("/app/analytics/drills")}
        >
          Drills Insight
          <ExternalLink className="size-[16px]" aria-hidden />
        </button>
      </div>

      <section className="flex flex-col gap-[24px] rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
        <h2 className="m-0 text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)]">
          Start A New Drill
        </h2>
        <PracticeLrRcStarterCards
          layout="stacked"
          visibleSections={[...starterVisible]}
          lrButtonLabel="Start LR Drill"
          rcButtonLabel="Start RC Drill"
          lrSubtitle="Master argument analysis and critical thinking skills"
          rcSubtitle="Improve passage analysis and comprehension strategies"
          onStartLr={() => navigate("/app/practice/drills/lr/new")}
          onStartRc={() => navigate("/app/practice/drills/rc/new")}
        />
      </section>

      <PracticeContinueDrillsSection
        drills={filteredContinue}
        filter={continueFilter}
        onFilterChange={(next) => {
          setContinueFilter(next)
          setLrContinueExpanded(false)
          setRcContinueExpanded(false)
        }}
        lrExpanded={lrContinueExpanded}
        rcExpanded={rcContinueExpanded}
        onExpandLr={() => setLrContinueExpanded(true)}
        onCollapseLr={() => setLrContinueExpanded(false)}
        onExpandRc={() => setRcContinueExpanded(true)}
        onCollapseRc={() => setRcContinueExpanded(false)}
        onContinue={(path) => navigate(path)}
        loading={loading}
        difficultyLabelFromContinue={difficultyLabelFromContinue}
      />

      <PracticeTagDrillsSections
        lr={lrTagDrills}
        rc={rcTagDrills}
        visibleSections={[...starterVisible]}
        onStart={(configPath) => navigate(configPath)}
        loading={loading}
      />
    </StudentMain>
  )
}

export { PracticeDrillsPage }
