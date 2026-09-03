import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink } from "lucide-react"

import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
import { PracticeDrillContinueRow } from "@/features/student/components/practice-drill-continue-row"
import { PracticeDrillTypeRow } from "@/features/student/components/practice-drill-type-row"
import { PracticeLrRcStarterCards } from "@/features/student/components/practice-lr-rc-starter-cards"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import {
  mapSessionToContinueDrill,
  type ContinueDrill,
} from "@/features/student/drills/drill-dashboard-mappers"
import {
  orderPriorityRowsByWeakness,
  visibleTagDrillCount,
} from "@/features/student/drills/tag-drills-priority"
import { createAnalyticsApi, type PriorityRow } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type SectionFilter = "all" | "lr" | "rc"

type TagDrill = {
  id: string
  questionTypeId: string
  section: "LR" | "RC"
  title: string
  difficultyLabel: string
  filledBars: number
  difficultyColor: string
  configPath: string
}

function priorityVisual(priority: PriorityRow["priorityLevel"] | PriorityRow["priorityTier"]) {
  if (priority === "highest" || priority === "high") {
    return { label: "Hardest", filledBars: 5, color: "#df1c41" }
  }
  if (priority === "medium") {
    return { label: "Medium", filledBars: 3, color: "#ff6f00" }
  }
  return { label: "Easy", filledBars: 2, color: "#ffbd4c" }
}

function mapPriorityToTagDrill(row: PriorityRow): TagDrill | null {
  const section = row.sectionType === "LR" || row.sectionType === "RC" ? row.sectionType : "LR"
  const visual = priorityVisual(row.priorityTier ?? row.priorityLevel)
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

function padInProcessCount(count: number): string {
  return `${String(count).padStart(2, "0")} In process`
}

function ListFooter({
  hasMore,
  onShowMore,
}: {
  hasMore: boolean
  onShowMore: () => void
}) {
  return (
    <div className="flex h-[32px] items-center justify-center">
      {hasMore ? (
        <button
          type="button"
          className="text-[16px] font-semibold leading-[1.35] text-[#082c6b] hover:underline"
          onClick={onShowMore}
        >
          Show more
        </button>
      ) : (
        <p className="text-[16px] font-semibold leading-[1.35] text-[#082c6b]">No More</p>
      )}
    </div>
  )
}

function PracticeDrillsPage() {
  const navigate = useNavigate()
  const analyticsApi = useMemo(() => createAnalyticsApi(getSupabaseBrowserClient()), [])

  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all")
  const [continueDrills, setContinueDrills] = useState<ContinueDrill[]>([])
  const [tagDrills, setTagDrills] = useState<TagDrill[]>([])
  const [continueExpanded, setContinueExpanded] = useState(false)
  const [tagsExpanded, setTagsExpanded] = useState(false)
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
          orderPriorityRowsByWeakness(
            priorities.filter(
              (p) => p.sectionType === "LR" || p.sectionType === "RC" || p.sectionType === null,
            ),
          )
            .map(mapPriorityToTagDrill)
            .filter((d): d is TagDrill => d != null),
        )
        setContinueExpanded(false)
        setTagsExpanded(false)
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
    if (sectionFilter === "all") return true
    return sectionFilter === "lr" ? drill.section === "LR" : drill.section === "RC"
  })

  const filteredTags = useMemo(() => {
    return tagDrills.filter((drill) => {
      if (sectionFilter === "all") return true
      return sectionFilter === "lr" ? drill.section === "LR" : drill.section === "RC"
    })
  }, [sectionFilter, tagDrills])

  const visibleContinueCount = visibleTagDrillCount(filteredContinue.length, continueExpanded)
  const visibleContinue = filteredContinue.slice(0, visibleContinueCount)
  const canShowMoreContinue =
    !continueExpanded && filteredContinue.length > visibleTagDrillCount(filteredContinue.length, false)

  const visibleTagCount = visibleTagDrillCount(filteredTags.length, tagsExpanded)
  const visibleTags = filteredTags.slice(0, visibleTagCount)
  const canShowMoreTags =
    !tagsExpanded && filteredTags.length > visibleTagDrillCount(filteredTags.length, false)

  useEffect(() => {
    setContinueExpanded(false)
    setTagsExpanded(false)
  }, [sectionFilter])

  const starterVisible =
    sectionFilter === "all" ? (["lr", "rc"] as const) : sectionFilter === "lr" ? (["lr"] as const) : (["rc"] as const)

  return (
    <StudentMain className="drills-page" contentClassName="flex flex-col gap-[25px]">
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
          className="inline-flex h-[32px] items-center gap-[8px] pr-[16px] text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-[#0d47a1] hover:underline"
          onClick={() => navigate("/app/analytics/drills")}
        >
          Drills Insight
          <ExternalLink className="size-[16px]" aria-hidden />
        </button>
      </div>

      <section className="rounded-[20px] border border-[#dfe1e7] bg-white p-[24px]">
        <h2 className="mb-[24px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#041a44]">
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

      <section className="flex flex-col gap-[24px] rounded-[20px] border border-[#dfe1e7] bg-white p-[24px]">
        <div className="flex flex-wrap items-center justify-between gap-[12px]">
          <h2 className="text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#041a44]">
            Pick Up Where You Left Off
          </h2>
          <p className="text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[#666d80]">
            {padInProcessCount(filteredContinue.length)}
          </p>
        </div>

        {loading ? (
          <StudentPageLoader label="Loading drills…" />
        ) : filteredContinue.length === 0 ? (
          <p className="text-[14px] text-[#666d80]">
            No drills in progress. Start a new LR or RC drill above.
          </p>
        ) : (
          <>
            <div className="flex flex-col">
              {visibleContinue.map((drill) => (
                <PracticeDrillContinueRow
                  key={drill.id}
                  section={drill.section}
                  title={drill.title}
                  answered={drill.answered}
                  lastAttempt={drill.lastAttempt}
                  progressPct={drill.progressPct}
                  difficultyLabel={difficultyLabelFromContinue(drill.difficulty)}
                  difficultyFilledBars={drill.difficultyBars}
                  difficultyColor={drill.difficultyColor}
                  onContinue={() => navigate(drill.continuePath)}
                />
              ))}
            </div>
            <ListFooter hasMore={canShowMoreContinue} onShowMore={() => setContinueExpanded(true)} />
          </>
        )}
      </section>

      <section className="flex flex-col gap-[24px] rounded-[20px] border border-[#dfe1e7] bg-white p-[24px]">
        <div className="flex flex-col gap-[8px]">
          <h2 className="text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#041a44]">
            Drills by Types
          </h2>
          <p className="text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#666d80]">
            Ranked by your past performance and score impact
          </p>
        </div>

        {loading ? (
          <StudentPageLoader label="Loading tag drills…" />
        ) : filteredTags.length === 0 ? (
          <p className="text-[14px] text-[#666d80]">Answer more questions to unlock priority tag drills.</p>
        ) : (
          <>
            <div className="flex flex-col gap-[16px]">
              {visibleTags.map((drill) => (
                <PracticeDrillTypeRow
                  key={drill.id}
                  section={drill.section}
                  title={drill.title}
                  difficultyLabel={drill.difficultyLabel}
                  difficultyFilledBars={drill.filledBars}
                  difficultyColor={drill.difficultyColor}
                  onStart={() => navigate(drill.configPath)}
                />
              ))}
            </div>
            <ListFooter hasMore={canShowMoreTags} onShowMore={() => setTagsExpanded(true)} />
          </>
        )}
      </section>
    </StudentMain>
  )
}

export { PracticeDrillsPage }
