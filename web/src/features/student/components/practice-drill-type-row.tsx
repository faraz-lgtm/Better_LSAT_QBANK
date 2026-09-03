import { ChevronRight } from "lucide-react"

import { DrillDifficultyStatus } from "@/features/student/components/drill-difficulty-status"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"

type PracticeDrillTypeRowProps = {
  section: "LR" | "RC"
  title: string
  difficultyLabel: string
  difficultyFilledBars: number
  difficultyColor: string
  onStart: () => void
}

function PracticeDrillTypeRow({
  section,
  title,
  difficultyLabel,
  difficultyFilledBars,
  difficultyColor,
  onStart,
}: PracticeDrillTypeRowProps) {
  const startLabel = section === "LR" ? "Start LR Drill" : "Start RC Drill"

  return (
    <div className="border-b border-[#dfe1e7]">
      <div className="flex flex-col gap-[16px] p-[16px] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-[12px]">
          <SectionInitialBadge section={section} variant="compact" />
          <h3 className="min-w-0 truncate text-[16px] font-semibold leading-[1.35] text-[#041a44]">
            {title}
          </h3>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-[24px] pl-[44px] sm:justify-end sm:pl-0">
          <DrillDifficultyStatus
            label={difficultyLabel}
            filledBars={difficultyFilledBars}
            color={difficultyColor}
            surface="muted"
          />
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-[40px] w-[148px] items-center justify-center gap-[8px] rounded-[12px] border border-[#dfe1e7] bg-white px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)] hover:bg-[#f6f8fa]"
          >
            {startLabel}
            <ChevronRight className="size-[16px]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

export { PracticeDrillTypeRow }
