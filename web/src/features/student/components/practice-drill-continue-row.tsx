import { ChevronRight } from "lucide-react"

import { DrillDifficultyStatus } from "@/features/student/components/drill-difficulty-status"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"

type PracticeDrillContinueRowProps = {
  section: "LR" | "RC"
  title: string
  /** e.g. "45/100" from ContinueDrill.answered */
  answered: string
  lastAttempt: string
  progressPct: number
  difficultyLabel: string
  difficultyFilledBars: number
  difficultyColor: string
  onContinue: () => void
}

function formatAnsweredMeta(answered: string, lastAttempt: string): string {
  const [rawDone, rawTotal] = answered.split("/")
  const done = rawDone?.trim()
  const total = rawTotal?.trim()
  if (done && total) {
    return `${done} of ${total} answered · ${lastAttempt}`
  }
  return `${answered} answered · ${lastAttempt}`
}

function PracticeDrillContinueRow({
  section,
  title,
  answered,
  lastAttempt,
  progressPct,
  difficultyLabel,
  difficultyFilledBars,
  difficultyColor,
  onContinue,
}: PracticeDrillContinueRowProps) {
  const barColor = section === "LR" ? "#00bc54" : "#0bbcc9"

  return (
    <div className="border-b border-[#dfe1e7]">
      <div className="flex flex-col gap-[16px] p-[16px] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-[6px]">
          <div className="flex min-w-0 items-center gap-[12px]">
            <SectionInitialBadge section={section} variant="compact" />
            <h3 className="truncate text-[16px] font-semibold leading-[1.35] text-[#041a44]">{title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-[12px] pl-[44px]">
            <p className="text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#666d80]">
              {formatAnsweredMeta(answered, lastAttempt)}
            </p>
            <DrillDifficultyStatus
              label={difficultyLabel}
              filledBars={difficultyFilledBars}
              color={difficultyColor}
              surface="white"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-[24px] pl-[44px] sm:pl-0">
          <div className="flex w-[145px] flex-col gap-[12px]">
            <p className="text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#666d80]">
              {progressPct}%
            </p>
            <div className="h-[8px] overflow-hidden rounded-full bg-[#eceff3]">
              <div
                className="h-[8px] rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-[40px] items-center justify-center gap-[8px] rounded-[12px] border border-[#dfe1e7] bg-white px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)] hover:bg-[#f6f8fa]"
          >
            Continue
            <ChevronRight className="size-[16px]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

export { PracticeDrillContinueRow, formatAnsweredMeta }
