import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
import { PracticeDrillContinueRow } from "@/features/student/components/practice-drill-continue-row"
import { PracticeListFooter } from "@/features/student/components/practice-list-footer"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import type { ContinueDrill } from "@/features/student/drills/drill-dashboard-mappers"
import {
  CONTINUE_DRILLS_PER_SECTION_INITIAL,
  visibleTagDrillCount,
} from "@/features/student/drills/tag-drills-priority"

type ContinueSectionFilter = "all" | "lr" | "rc"

type PracticeContinueDrillsSectionProps = {
  drills: ContinueDrill[]
  filter: ContinueSectionFilter
  onFilterChange: (filter: ContinueSectionFilter) => void
  lrExpanded: boolean
  rcExpanded: boolean
  onExpandLr: () => void
  onCollapseLr: () => void
  onExpandRc: () => void
  onCollapseRc: () => void
  onContinue: (path: string) => void
  loading: boolean
  difficultyLabelFromContinue: (level: ContinueDrill["difficulty"]) => string
}

function padInProcessCount(count: number): string {
  return `${String(count).padStart(2, "0")} In process`
}

function ContinueSectionList({
  section,
  drills,
  expanded,
  onExpand,
  onCollapse,
  onContinue,
  difficultyLabelFromContinue,
}: {
  section: "LR" | "RC"
  drills: ContinueDrill[]
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onContinue: (path: string) => void
  difficultyLabelFromContinue: (level: ContinueDrill["difficulty"]) => string
}) {
  if (drills.length === 0) return null

  const visibleCount = visibleTagDrillCount(drills.length, expanded, CONTINUE_DRILLS_PER_SECTION_INITIAL)
  const visible = drills.slice(0, visibleCount)
  const canExpand = drills.length > CONTINUE_DRILLS_PER_SECTION_INITIAL

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center gap-[12px]">
        <SectionInitialBadge section={section} variant="compact" />
        <h3 className="text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)]">
          {section === "LR" ? "Logical Reasoning" : "Reading Comprehension"}
        </h3>
      </div>
      <div className="flex flex-col">
        {visible.map((drill) => (
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
            onContinue={() => onContinue(drill.continuePath)}
            showSectionBadge={false}
          />
        ))}
      </div>
      <PracticeListFooter
        hasMore={canExpand && !expanded}
        expanded={expanded && canExpand}
        onShowMore={onExpand}
        onShowLess={onCollapse}
      />
    </div>
  )
}

function PracticeContinueDrillsSection({
  drills,
  filter,
  onFilterChange,
  lrExpanded,
  rcExpanded,
  onExpandLr,
  onCollapseLr,
  onExpandRc,
  onCollapseRc,
  onContinue,
  loading,
  difficultyLabelFromContinue,
}: PracticeContinueDrillsSectionProps) {
  const lr = drills.filter((drill) => drill.section === "LR")
  const rc = drills.filter((drill) => drill.section === "RC")
  const showLr = filter !== "rc"
  const showRc = filter !== "lr"
  const visibleLr = showLr ? lr : []
  const visibleRc = showRc ? rc : []
  const inProcessCount = visibleLr.length + visibleRc.length

  return (
    <section className="flex flex-col gap-[24px] rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <h2 className="text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)]">
          Pick Up Where You Left Off
        </h2>
        <div className="flex flex-wrap items-center gap-[12px]">
          <div className="flex items-center gap-[8px]" role="tablist" aria-label="In-progress section">
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              onClick={() => onFilterChange("all")}
              className={drillFilterPillClass(filter === "all", "compact")}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "lr"}
              onClick={() => onFilterChange("lr")}
              className={drillFilterPillClass(filter === "lr", "compact")}
            >
              LR
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "rc"}
              onClick={() => onFilterChange("rc")}
              className={drillFilterPillClass(filter === "rc", "compact")}
            >
              RC
            </button>
          </div>
          <p className="text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
            {padInProcessCount(inProcessCount)}
          </p>
        </div>
      </div>

      {loading ? (
        <StudentPageLoader label="Loading drills…" />
      ) : inProcessCount === 0 ? (
        <p className="text-[14px] text-[var(--greyscale-500)]">
          No drills in progress. Start a new LR or RC drill above.
        </p>
      ) : (
        <div className="flex flex-col gap-[24px]">
          {showLr ? (
            <ContinueSectionList
              section="LR"
              drills={visibleLr}
              expanded={lrExpanded}
              onExpand={onExpandLr}
              onCollapse={onCollapseLr}
              onContinue={onContinue}
              difficultyLabelFromContinue={difficultyLabelFromContinue}
            />
          ) : null}
          {showRc ? (
            <ContinueSectionList
              section="RC"
              drills={visibleRc}
              expanded={rcExpanded}
              onExpand={onExpandRc}
              onCollapse={onCollapseRc}
              onContinue={onContinue}
              difficultyLabelFromContinue={difficultyLabelFromContinue}
            />
          ) : null}
        </div>
      )}
    </section>
  )
}

export { PracticeContinueDrillsSection, type ContinueSectionFilter }
