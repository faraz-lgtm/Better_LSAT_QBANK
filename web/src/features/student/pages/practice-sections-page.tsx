import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink } from "lucide-react"

import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
import { PracticeListFooter } from "@/features/student/components/practice-list-footer"
import { PracticeSectionContinueRow } from "@/features/student/components/practice-section-continue-row"
import { PracticeSectionStartCard } from "@/features/student/components/practice-section-start-card"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { visibleTagDrillCount } from "@/features/student/drills/tag-drills-priority"
import {
  mapSessionToContinueSection,
  type ContinueSection,
} from "@/features/student/sections/section-dashboard-mappers"
import { createAnalyticsApi } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type SectionFilter = "all" | "lr" | "rc"

function padInProcessCount(count: number): string {
  return `${String(count).padStart(2, "0")} In process`
}

function PracticeSectionsPage() {
  const navigate = useNavigate()
  const analyticsApi = useMemo(() => createAnalyticsApi(getSupabaseBrowserClient()), [])

  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all")
  const [continueSections, setContinueSections] = useState<ContinueSection[]>([])
  const [continueExpanded, setContinueExpanded] = useState(false)
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
        setContinueExpanded(false)
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

  const visibleCount = visibleTagDrillCount(filteredContinue.length, continueExpanded)
  const visibleContinue = filteredContinue.slice(0, visibleCount)
  const canShowMore =
    !continueExpanded && filteredContinue.length > visibleTagDrillCount(filteredContinue.length, false)

  useEffect(() => {
    setContinueExpanded(false)
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

      <section className="flex flex-col gap-[24px] rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
        <div className="flex flex-wrap items-center justify-between gap-[12px]">
          <h2 className="text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)]">
            Pick Up Where You Left Off
          </h2>
          <p className="text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
            {padInProcessCount(filteredContinue.length)}
          </p>
        </div>

        {loading ? (
          <StudentPageLoader label="Loading sections…" />
        ) : filteredContinue.length === 0 ? (
          <p className="text-[14px] text-[var(--greyscale-500)]">
            No sections in progress. Start a new LR or RC section above.
          </p>
        ) : (
          <>
            <div className="flex flex-col">
              {visibleContinue.map((row) => (
                <PracticeSectionContinueRow
                  key={row.id}
                  section={row.section}
                  title={row.title}
                  timeLeftLabel={row.timeLeftLabel}
                  onContinue={() => navigate(row.continuePath)}
                />
              ))}
            </div>
            <PracticeListFooter
              hasMore={canShowMore}
              onShowMore={() => setContinueExpanded(true)}
              showMoreLabel="Show more"
            />
          </>
        )}
      </section>
    </StudentMain>
  )
}

export { PracticeSectionsPage }
