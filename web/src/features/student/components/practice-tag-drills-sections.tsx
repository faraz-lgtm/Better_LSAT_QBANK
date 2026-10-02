import { useEffect, useState } from "react"

import { PracticeDrillTypeRow } from "@/features/student/components/practice-drill-type-row"
import { PracticeListFooter } from "@/features/student/components/practice-list-footer"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import {
  TAG_DRILLS_PER_SECTION_EXPANDED,
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
  onStart: (configPath: string) => void
  loading: boolean
}

function TagDrillsSectionCard({
  section,
  drills,
  onStart,
}: {
  section: "LR" | "RC"
  drills: TagDrill[]
  onStart: (configPath: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const drillIds = drills.map((drill) => drill.id).join("|")

  useEffect(() => {
    setExpanded(false)
  }, [drillIds])

  if (drills.length === 0) return null

  const cappedTotal = Math.min(drills.length, TAG_DRILLS_PER_SECTION_EXPANDED)
  const canExpand = cappedTotal > TAG_DRILLS_PER_SECTION_INITIAL
  const visibleCount = visibleTagDrillCount(
    drills.length,
    expanded,
    TAG_DRILLS_PER_SECTION_INITIAL,
    TAG_DRILLS_PER_SECTION_EXPANDED,
  )
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
          {expanded && canExpand
            ? "Your top priority types in this section"
            : "Your top 3 weakest types in this section"}
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
        onShowMore={() => setExpanded(true)}
        onShowLess={() => setExpanded(false)}
      />
    </section>
  )
}

function PracticeTagDrillsSections({
  lr,
  rc,
  visibleSections,
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
      {showLr ? <TagDrillsSectionCard section="LR" drills={lrDrills} onStart={onStart} /> : null}
      {showRc ? <TagDrillsSectionCard section="RC" drills={rcDrills} onStart={onStart} /> : null}
    </div>
  )
}

export { PracticeTagDrillsSections }
