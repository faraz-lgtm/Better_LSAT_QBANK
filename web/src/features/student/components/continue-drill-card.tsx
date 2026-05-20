import { useMemo } from "react"

import type { StudentDrill } from "@/features/student/lib/mock-drills"
import { BarChart2, ChevronRight, Clock, Target } from "lucide-react"

export type ContinueDrillCardDrill = {
  id: string
  section: "LR" | "RC"
  title: string
  progressPct: number
  questions: string
  timeLabel: string
  lastAttempt: string
  progressColor?: string
  difficultyLabel?: string
  difficultyFilledBars?: number
  difficultyColor?: string
}

function sectionBadgeTone(section: "LR" | "RC"): string {
  return section === "LR" ? "bg-[#fffbeb] text-[#ae8b00]" : "bg-[#fff3ea] text-[#ff9d51]"
}

function defaultProgressColor(section: "LR" | "RC", accent?: StudentDrill["accent"]): string {
  if (accent === "mint") return "#45bda4"
  return section === "RC" ? "#ff9d51" : "#f7994a"
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
    progressColor: defaultProgressColor(drill.section, drill.accent),
    difficultyLabel: "Hardest",
    difficultyFilledBars: 5,
    difficultyColor: "#df1c41",
  }
}

function ContinueDrillCard({ drill }: { drill: ContinueDrillCardDrill }) {
  const progressColor = drill.progressColor ?? defaultProgressColor(drill.section)
  const difficultyLabel = drill.difficultyLabel ?? "Hardest"
  const difficultyFilledBars = drill.difficultyFilledBars ?? 5
  const difficultyColor = drill.difficultyColor ?? "#df1c41"

  const ringFill = useMemo(
    () => `conic-gradient(from 270deg, ${progressColor} ${drill.progressPct}%, #dfe1e7 ${drill.progressPct}% 100%)`,
    [progressColor, drill.progressPct],
  )

  return (
    <article className="rounded-2xl border border-[#dfe1e7] bg-[#f9fbfc] p-4 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex shrink-0 flex-col items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold tracking-[0.02em] ${sectionBadgeTone(drill.section)}`}
            >
              {drill.section}
            </div>
            <div className="relative flex size-16 items-center justify-center rounded-full" style={{ background: ringFill }}>
              <div className="absolute inset-1 rounded-full bg-[#f9fbfc]" />
              <span className="relative text-sm font-bold text-[#062357]">{drill.progressPct}%</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold leading-[1.35] text-[#062357]">{drill.title}</h3>
              <div className="flex h-10 shrink-0 items-center gap-2 rounded-[10px] bg-white px-2.5">
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
                  {difficultyLabel}
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
              <div className="h-full rounded-full" style={{ width: `${drill.progressPct}%`, backgroundColor: progressColor }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 xl:shrink-0 xl:items-end">
          <button
            type="button"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] px-4 text-base font-semibold tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#0d47a1]/90 xl:w-auto"
          >
            Continue
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <p className="text-center text-xs tracking-[0.24px] text-[#6a7282] xl:text-right">
            Last attempt: {drill.lastAttempt}
          </p>
        </div>
      </div>
    </article>
  )
}

export { ContinueDrillCard }
