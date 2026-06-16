import { useMemo } from "react"
import { BarChart2, ChevronRight, Clock, Target } from "lucide-react"

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
    () => `conic-gradient(from 270deg, ${ringColor} ${drill.progressPct}%, #dfe1e7 ${drill.progressPct}% 100%)`,
    [ringColor, drill.progressPct],
  )

  return (
    <article className="rounded-3xl bg-[#f6f8fa] p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 gap-6">
          <div className="flex w-20 shrink-0 flex-col items-center">
            <div
              className={`flex size-16 items-center justify-center rounded-[12px] text-xl font-bold leading-[1.35] ${sectionBadgeTone(drill.section)}`}
            >
              {drill.section}
            </div>
            <div className="relative mt-3 flex size-20 items-center justify-center rounded-full" style={{ background: ringFill }}>
              <div className="absolute inset-1 rounded-full bg-[#f6f8fa]" />
              <span className="relative text-sm font-bold text-[#364153]">{drill.progressPct}%</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-xl font-bold leading-[1.35] text-[#062357]">{drill.title}</h3>
              <div className="flex h-10 shrink-0 items-center gap-2.5 rounded-[10px] bg-white px-2.5">
                <div className="flex items-center gap-1.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={index}
                      className="h-4 w-1.5 rounded-full"
                      style={{ backgroundColor: index < difficultyFilledBars ? difficultyColor : "#ced0e7" }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold tracking-[0.24px]" style={{ color: difficultyColor }}>
                  {difficultyLabelText}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eceff3] text-[#9ca3af]">
                  <Target className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-[#666d80]">Progress</p>
                  <p className="text-sm font-semibold tracking-[0.28px] text-[#062357]">{drill.progressPct}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eceff3] text-[#9ca3af]">
                  <BarChart2 className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-[#666d80]">Questions</p>
                  <p className="text-sm font-semibold tracking-[0.28px] text-[#062357]">{drill.questions}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eceff3] text-[#9ca3af]">
                  <Clock className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-[#666d80]">Time</p>
                  <p className="text-sm font-semibold tracking-[0.28px] text-[#062357]">{drill.timeLabel}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eceff3]">
              <div className="h-full rounded-full" style={{ width: `${drill.progressPct}%`, backgroundColor: barColor }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 xl:shrink-0 xl:items-end">
          <button
            type="button"
            onClick={onContinue}
            className="ds-btn h-12 w-full rounded-3xl text-base tracking-[0.32px] xl:w-auto"
          >
            {continueLabel}
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <p className="text-center text-xs tracking-[0.24px] text-[#6a7282] xl:text-right">
            {lastAttemptPrefix}
            {drill.lastAttempt}
          </p>
        </div>
      </div>
    </article>
  )
}

export { ContinueDrillCard }
