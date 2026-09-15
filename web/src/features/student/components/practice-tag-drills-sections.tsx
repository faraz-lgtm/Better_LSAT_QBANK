import { PracticeDrillTypeRow } from "@/features/student/components/practice-drill-type-row"
import { PracticeListFooter } from "@/features/student/components/practice-list-footer"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import {
  TAG_DRILLS_PER_SECTION_INITIAL,
  visibleTagDrillCount,
} from "@/features/student/drills/tag-drills-priority"

export type TagDrill = {
  id: string
  questionTypeId: string
  section: "LR" | "RC"
  title: string
  difficultyLabel: string
  filledBars: number
  difficultyColor: string
  configPath: string
}

type PracticeTagDrillsSectionsProps = {
  lr: TagDrill[]
  rc: TagDrill[]
  visibleSections: Array<"lr" | "rc">
  lrExpanded: boolean
  rcExpanded: boolean
  onExpandLr: () => void
  onCollapseLr: () => void
  onExpandRc: () => void
  onCollapseRc: () => void
  onStart: (configPath: string) => void
  loading: boolean
}

function TagDrillsSectionCard({
  section,
  drills,
  expanded,
  onExpand,
  onCollapse,
  onStart,
}: {
  section: "LR" | "RC"
  drills: TagDrill[]
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onStart: (configPath: string) => void
}) {
  if (drills.length === 0) return null

  const canExpand = drills.length > TAG_DRILLS_PER_SECTION_INITIAL
  const visibleCount = visibleTagDrillCount(drills.length, expanded, TAG_DRILLS_PER_SECTION_INITIAL)
  const visible = drills.slice(0, visibleCount)

  return (
    <section className="flex flex-col gap-[24px] rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[12px]">
          <SectionInitialBadge section={section} variant="compact" />
          <h2 className="text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)]">
            Drill by Types ({section})
          </h2>
        </div>
        <p className="pl-[44px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
          Highest-priority types for you in this section
        </p>
      </div>
      <div className="flex flex-col">
        {visible.map((drill) => (
          <PracticeDrillTypeRow
            key={drill.id}
            section={drill.section}
            title={drill.title}
            difficultyLabel={drill.difficultyLabel}
            difficultyFilledBars={drill.filledBars}
            difficultyColor={drill.difficultyColor}
            showSectionBadge={false}
            onStart={() => onStart(drill.configPath)}
          />
        ))}
      </div>
      <PracticeListFooter
        hasMore={canExpand && !expanded}
        expanded={expanded && canExpand}
        onShowMore={onExpand}
        onShowLess={onCollapse}
      />
    </section>
  )
}

function PracticeTagDrillsSections({
  lr,
  rc,
  visibleSections,
  lrExpanded,
  rcExpanded,
  onExpandLr,
  onCollapseLr,
  onExpandRc,
  onCollapseRc,
  onStart,
  loading,
}: PracticeTagDrillsSectionsProps) {
  const showLr = visibleSections.includes("lr")
  const showRc = visibleSections.includes("rc")
  const lrDrills = showLr ? lr : []
  const rcDrills = showRc ? rc : []
  const empty = lrDrills.length === 0 && rcDrills.length === 0

  if (loading) {
    return (
      <section className="flex flex-col gap-[24px] rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
        <StudentPageLoader label="Loading tag drills…" />
      </section>
    )
  }

  if (empty) {
    return (
      <section className="flex flex-col gap-[24px] rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
        <p className="text-[14px] text-[var(--greyscale-500)]">Answer more questions to unlock priority tag drills.</p>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-[24px]">
      {showLr ? (
        <TagDrillsSectionCard
          section="LR"
          drills={lrDrills}
          expanded={lrExpanded}
          onExpand={onExpandLr}
          onCollapse={onCollapseLr}
          onStart={onStart}
        />
      ) : null}
      {showRc ? (
        <TagDrillsSectionCard
          section="RC"
          drills={rcDrills}
          expanded={rcExpanded}
          onExpand={onExpandRc}
          onCollapse={onCollapseRc}
          onStart={onStart}
        />
      ) : null}
    </div>
  )
}

export { PracticeTagDrillsSections }
