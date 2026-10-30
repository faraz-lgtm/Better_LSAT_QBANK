import { useMemo, useState } from "react"
import { ExternalLink } from "lucide-react"

import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
import { PracticeDrillTypeRow } from "@/features/student/components/practice-drill-type-row"
import { PracticeListFooter } from "@/features/student/components/practice-list-footer"
import { PracticeLrRcStarterCards } from "@/features/student/components/practice-lr-rc-starter-cards"
import { FREE_DRILL_TYPE_PREVIEW } from "@/features/student/drills/drill-free-preview"

const DRILLS_FIGMA = "/figma/drills" as const

type SectionFilter = "all" | "lr" | "rc"

type PracticeDrillsFreePreviewProps = {
  onLockedAction: () => void
}

/** Figma `21587:35080` — free-plan Prep Drills browse with in-page upgrade gates. */
function DrillsLockedStatusBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-drills-locked-status
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary-0)]"
      aria-label="Locked — unlock drills"
      onClick={onClick}
    >
      <img
        src={`${DRILLS_FIGMA}/lock-sm.svg`}
        alt=""
        width={16}
        height={16}
        className="size-4 max-w-none shrink-0 object-contain"
        draggable={false}
      />
    </button>
  )
}

function PracticeDrillsFreePreview({ onLockedAction }: PracticeDrillsFreePreviewProps) {
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all")

  const starterVisible =
    sectionFilter === "all" ? (["lr", "rc"] as const) : sectionFilter === "lr" ? (["lr"] as const) : (["rc"] as const)

  const previewDrills = useMemo(() => {
    if (sectionFilter === "all") return FREE_DRILL_TYPE_PREVIEW
    const section = sectionFilter === "lr" ? "LR" : "RC"
    return FREE_DRILL_TYPE_PREVIEW.filter((drill) => drill.section === section)
  }, [sectionFilter])

  return (
    <>
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
          onClick={onLockedAction}
        >
          Drills Insight
          <ExternalLink className="size-[16px]" aria-hidden />
        </button>
      </div>

      <section className="flex flex-col gap-[24px] rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
        <div className="flex items-center justify-between gap-[12px]">
          <h2 className="m-0 text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)]">
            Start A New Drill
          </h2>
          <DrillsLockedStatusBadge onClick={onLockedAction} />
        </div>
        <PracticeLrRcStarterCards
          layout="stacked"
          cardTone="plain"
          visibleSections={[...starterVisible]}
          lrButtonLabel="Start LR Drill"
          rcButtonLabel="Start RC Drill"
          lrSubtitle="Master argument analysis and critical thinking skills"
          rcSubtitle="Improve passage analysis and comprehension strategies"
          onStartLr={onLockedAction}
          onStartRc={onLockedAction}
        />
      </section>

      <section className="flex flex-col gap-[24px] rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
        <div className="flex items-start justify-between gap-[24px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <h2 className="m-0 text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)]">
              Drills by Types
            </h2>
            <p className="m-0 text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
              Ranked by your past performance and score impact
            </p>
          </div>
          <DrillsLockedStatusBadge onClick={onLockedAction} />
        </div>

        <div className="flex w-full flex-col gap-[16px]">
          {previewDrills.map((drill) => (
            <PracticeDrillTypeRow
              key={drill.id}
              section={drill.section}
              title={drill.title}
              difficultyLabel={drill.difficultyLabel}
              difficultyFilledBars={drill.filledBars}
              difficultyColor={drill.difficultyColor}
              difficultySurface="muted"
              showSectionBadge
              onStart={onLockedAction}
            />
          ))}
        </div>

        <PracticeListFooter
          hasMore
          onShowMore={onLockedAction}
          showMoreLabel="Show All Drills"
          labelClassName="text-[var(--field-focus)]"
        />
      </section>
    </>
  )
}

export { PracticeDrillsFreePreview }
