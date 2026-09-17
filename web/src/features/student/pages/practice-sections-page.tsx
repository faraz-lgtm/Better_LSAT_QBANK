import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink } from "lucide-react"

import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
import {
  PracticeContinueDrillsSection,
  type ContinueSectionFilter,
} from "@/features/student/components/practice-continue-drills-section"
import { PracticeSectionStartCard } from "@/features/student/components/practice-section-start-card"
import { StudentMain } from "@/features/student/components/student-main"
import type { ContinueDrill } from "@/features/student/drills/drill-dashboard-mappers"
import {
  continueSectionToDrill,
  mapSessionToContinueSection,
  type ContinueSection,
} from "@/features/student/sections/section-dashboard-mappers"
import { createAnalyticsApi } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type SectionFilter = "all" | "lr" | "rc"

function difficultyLabelFromContinue(level: ContinueDrill["difficulty"]): string {
  if (level === "hardest") return "Hardest"
  if (level === "medium") return "Medium"
  return "Easy"
}

function PracticeSectionsPage() {
  const navigate = useNavigate()
  const analyticsApi = useMemo(() => createAnalyticsApi(getSupabaseBrowserClient()), [])

  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all")
  const [continueSections, setContinueSections] = useState<ContinueSection[]>([])
  const [continueFilter, setContinueFilter] = useState<ContinueSectionFilter>("all")
  const [lrContinueExpanded, setLrContinueExpanded] = useState(false)
  const [rcContinueExpanded, setRcContinueExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const sessionsResult = await analyticsApi.getSessions({ kind: "SECTION", limit: 50 })
        if (cancelled) return
        setContinueSections(
          sessionsResult.sessions
            .filter((s) => !s.completedAt)
            .map(mapSessionToContinueSection)
            .filter((s): s is ContinueSection => s != null),
        )
        setContinueFilter("all")
        setLrContinueExpanded(false)
        setRcContinueExpanded(false)
      } catch {
        if (!cancelled) setContinueSections([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [analyticsApi])

  const filteredContinue = continueSections.filter((row) => {
    if (sectionFilter === "all") return true
    return sectionFilter === "lr" ? row.section === "LR" : row.section === "RC"
  })

  useEffect(() => {
    setContinueFilter(sectionFilter)
    setLrContinueExpanded(false)
    setRcContinueExpanded(false)
  }, [sectionFilter])

  const showLr = sectionFilter === "all" || sectionFilter === "lr"
  const showRc = sectionFilter === "all" || sectionFilter === "rc"

  return (
    <StudentMain className="practice-section-intro" contentClassName="flex flex-col gap-[25px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <button
            type="button"
            onClick={() => setSectionFilter("all")}
            className={drillFilterPillClass(sectionFilter === "all")}
          >
            All Section
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
          onClick={() => navigate("/app/analytics/sections")}
        >
          Sections Insight
          <ExternalLink className="size-[16px]" aria-hidden />
        </button>
      </div>

      {showLr ? <PracticeSectionStartCard sectionType="LR" /> : null}
      {showRc ? <PracticeSectionStartCard sectionType="RC" /> : null}

      <PracticeContinueDrillsSection
        drills={filteredContinue.map(continueSectionToDrill)}
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
        loadingLabel="Loading sections…"
        emptyLabel="No sections in progress. Start a new LR or RC section above."
      />
    </StudentMain>
  )
}

export { PracticeSectionsPage }
