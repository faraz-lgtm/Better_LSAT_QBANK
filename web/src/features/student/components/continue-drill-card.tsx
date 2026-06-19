import { useMemo, type ReactNode } from "react"
import { BarChart2, ChevronRight, Clock, Target } from "lucide-react"

import { DrillDifficultyStatus } from "@/features/student/components/drill-difficulty-status"
import type { ContinueDrill } from "@/features/student/drills/drill-dashboard-mappers"
import type { StudentDrill } from "@/features/student/lib/mock-drills"

export type ContinueDrillCardDrill = {
  id: string
  section: "LR" | "RC"
  title: string
  progressPct: number
  questions: string
  timeLabel: string
  lastAttempt: string
  difficultyLabel?: string
  difficultyFilledBars?: number
  difficultyColor?: string
  ringColor?: string
  barColor?: string
}

function sectionBadgeTone(section: "LR" | "RC"): string {
  return section === "LR"
    ? "border border-[#00bc54] bg-[#eafff4] text-[#00bc54]"
    : "border border-[#0bbcc9] bg-[#e5fdff] text-[#0bbcc9]"
}

function sectionRingColor(section: "LR" | "RC"): string {
  return section === "LR" ? "#00bc54" : "#0bbcc9"
}

function sectionBarColor(section: "LR" | "RC"): string {
  return section === "LR" ? "#00bc54" : "#0bbcc9"
}

function difficultyLabel(level: ContinueDrill["difficulty"]): string {
  if (level === "hardest") return "Hardest"
  if (level === "medium") return "Medium"
  return "Easy"
}

export function continueDrillToCardDrill(drill: ContinueDrill): ContinueDrillCardDrill {
  return {
    id: drill.id,
    section: drill.section,
    title: drill.title,
    progressPct: drill.progressPct,
    questions: drill.answered,
    timeLabel: drill.timeLabel,
    lastAttempt: drill.lastAttempt,
    difficultyLabel: difficultyLabel(drill.difficulty),
    difficultyFilledBars: drill.difficultyBars,
    difficultyColor: drill.difficultyColor,
    ringColor: sectionRingColor(drill.section),
    barColor: sectionBarColor(drill.section),
  }
}

export function studentDrillToContinueCard(drill: StudentDrill): ContinueDrillCardDrill {
  return {
    id: drill.id,
    section: drill.section,
    title: drill.title,
    progressPct: drill.progressPct,
    questions: drill.answered,
    timeLabel: drill.timeLabel,
    lastAttempt: drill.lastAttempt,
    ringColor: sectionRingColor(drill.section),
    barColor: sectionBarColor(drill.section),
    difficultyLabel: "Hardest",
    difficultyFilledBars: 5,
    difficultyColor: "#df1c41",
  }
}

type ContinueDrillCardProps = {
  drill: ContinueDrillCardDrill
  onContinue: () => void
  continueLabel?: string
  lastAttemptPrefix?: string
}

function StatCell({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex h-[36px] items-center gap-[8px]">
      <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#eceff3] text-[#666d80]">
        {icon}
      </span>
      <div className="h-[36px]">
        <p className="text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#666d80]">{label}</p>
        <p className="text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[#1a1b25]">{value}</p>
      </div>
    </div>
  )
}

function ContinueDrillCard({
  drill,
  onContinue,
  continueLabel = "Continue",
  lastAttemptPrefix = "Last attempt: ",
}: ContinueDrillCardProps) {
  const ringColor = drill.ringColor ?? sectionRingColor(drill.section)
  const barColor = drill.barColor ?? sectionBarColor(drill.section)
  const difficultyLabelText = drill.difficultyLabel ?? "Hardest"
  const difficultyFilledBars = drill.difficultyFilledBars ?? 5
  const difficultyColor = drill.difficultyColor ?? "#df1c41"

  const ringFill = useMemo(
    () => `conic-gradient(from 270deg, ${ringColor} ${drill.progressPct}%, #eceff3 ${drill.progressPct}% 100%)`,
    [ringColor, drill.progressPct],
  )

  return (
    <article className="continue-drill-card rounded-[24px] bg-[#f6f8fa]">
      <div className="continue-drill-card__inner">
        <div className="relative h-[156px] w-[80px] shrink-0">
          <div
            className={`absolute left-[8px] top-0 flex size-[64px] items-center justify-center rounded-[16px] text-[20px] font-bold leading-[1.35] ${sectionBadgeTone(drill.section)}`}
          >
            {drill.section}
          </div>
          <div
            className="absolute left-0 top-[76px] flex size-[80px] items-center justify-center rounded-full"
            style={{ background: ringFill }}
          >
            <div className="absolute inset-[6px] rounded-full bg-[#f6f8fa]" />
            <span className="relative text-[14px] font-bold leading-[20px] text-[#364153]">{drill.progressPct}%</span>
          </div>
        </div>

        <div className="min-h-[156px] min-w-0 flex-1">
          <div className="flex min-h-[52px] flex-wrap items-center gap-[24px]">
            <h3 className="min-w-0 text-[20px] font-bold leading-[1.35] text-[#062357]">{drill.title}</h3>
            <DrillDifficultyStatus
              label={difficultyLabelText}
              filledBars={difficultyFilledBars}
              color={difficultyColor}
            />
          </div>

          <div className="continue-drill-card__stats mt-[16px]">
            <StatCell icon={<Target className="size-[16px]" />} label="Progress" value={`${drill.progressPct}%`} />
            <StatCell icon={<BarChart2 className="size-[16px]" />} label="Questions" value={drill.questions} />
            <StatCell icon={<Clock className="size-[16px]" />} label="Time" value={drill.timeLabel} />
            <p className="text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#6a7282]">
              {lastAttemptPrefix}
              {drill.lastAttempt}
            </p>
          </div>

          <div className="mt-[16px] h-[8px] overflow-hidden rounded-full bg-[#eceff3]">
            <div
              className="h-[8px] rounded-full"
              style={{ width: `${drill.progressPct}%`, backgroundColor: barColor }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="continue-drill-card__action inline-flex h-[48px] shrink-0 items-center justify-center gap-[8px] rounded-[16px] border border-[#0b4e6e] bg-[#0d47a1] px-[16px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
        >
          {continueLabel}
          <ChevronRight className="size-[20px]" aria-hidden />
        </button>
      </div>
    </article>
  )
}

export { ContinueDrillCard }
