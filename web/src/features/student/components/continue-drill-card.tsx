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
    ? "border border-[var(--explanation-answered)] bg-[var(--explanation-answered-bg)] text-[var(--explanation-answered)]"
    : "border border-[var(--explanation-teal)] bg-[var(--explanation-rc-badge-bg-light)] text-[var(--explanation-teal)]"
}

function sectionRingColor(section: "LR" | "RC"): string {
  return section === "LR" ? "var(--explanation-answered)" : "var(--explanation-teal)"
}

function sectionBarColor(section: "LR" | "RC"): string {
  return section === "LR" ? "var(--explanation-answered)" : "var(--explanation-teal)"
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
    difficultyColor: "var(--destructive)",
  }
}

type ContinueDrillCardProps = {
  drill: ContinueDrillCardDrill
  onContinue: () => void
  continueLabel?: string
  lastAttemptPrefix?: string
  onMore?: () => void
  moreLabel?: string
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
    <div className="flex min-h-[36px] min-w-0 items-start gap-[8px]">
      <span className="mt-[2px] flex size-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--greyscale-100)] text-[var(--greyscale-500)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">{label}</p>
        <p className="whitespace-nowrap text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
          {value}
        </p>
      </div>
    </div>
  )
}

function ContinueDrillCard({
  drill,
  onContinue,
  continueLabel = "Continue",
  lastAttemptPrefix = "Last attempt: ",
  onMore,
  moreLabel = "See more",
}: ContinueDrillCardProps) {
  const ringColor = drill.ringColor ?? sectionRingColor(drill.section)
  const barColor = drill.barColor ?? sectionBarColor(drill.section)
  const difficultyLabelText = drill.difficultyLabel ?? "Hardest"
  const difficultyFilledBars = drill.difficultyFilledBars ?? 5
  const difficultyColor = drill.difficultyColor ?? "var(--destructive)"

  const ringFill = useMemo(
    () => `conic-gradient(from 270deg, ${ringColor} ${drill.progressPct}%, var(--greyscale-100) ${drill.progressPct}% 100%)`,
    [ringColor, drill.progressPct],
  )

  return (
    <article className="continue-drill-card min-w-0 w-full rounded-[24px] bg-[var(--greyscale-25)]">
      <div className="continue-drill-card__inner">
        <div className="continue-drill-card__media">
          <div
            className={`continue-drill-card__badge flex items-center justify-center rounded-[16px] font-bold leading-[1.35] ${sectionBadgeTone(drill.section)}`}
          >
            {drill.section}
          </div>
          <div className="continue-drill-card__ring flex items-center justify-center rounded-full" style={{ background: ringFill }}>
            <div className="continue-drill-card__ring-hole absolute rounded-full bg-[var(--greyscale-25)]" />
            <span className="continue-drill-card__ring-label relative font-bold text-[var(--color-student-heading)]">
              {drill.progressPct}%
            </span>
          </div>
        </div>

        <div className="continue-drill-card__body min-w-0 flex-1">
          <div className="continue-drill-card__title-row">
            <div className="continue-drill-card__title-heading">
              <div
                className={`continue-drill-card__badge continue-drill-card__badge--inline flex items-center justify-center rounded-[12px] font-bold leading-[1.35] ${sectionBadgeTone(drill.section)}`}
              >
                {drill.section}
              </div>
              <h3 className="continue-drill-card__title min-w-0 text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)] sm:text-[20px]">
                {drill.title}
              </h3>
            </div>
            <DrillDifficultyStatus
              label={difficultyLabelText}
              filledBars={difficultyFilledBars}
              color={difficultyColor}
              tourTarget="dashboard-drill-difficulty"
            />
          </div>

          <div className="continue-drill-card__stats mt-[12px]">
            <div className="continue-drill-card__metrics">
              <StatCell icon={<Target className="size-[16px]" />} label="Progress" value={`${drill.progressPct}%`} />
              <StatCell icon={<BarChart2 className="size-[16px]" />} label="Questions" value={drill.questions} />
              <StatCell icon={<Clock className="size-[16px]" />} label="Time" value={drill.timeLabel} />
            </div>
            <p className="continue-drill-card__last-attempt text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
              {lastAttemptPrefix}
              {drill.lastAttempt}
            </p>
          </div>

          <div className="mt-[12px] h-[8px] overflow-hidden rounded-full bg-[var(--greyscale-100)]">
            <div
              className="h-[8px] rounded-full"
              style={{ width: `${drill.progressPct}%`, backgroundColor: barColor }}
            />
          </div>
        </div>

        <div className="continue-drill-card__actions">
          <button
            type="button"
            onClick={onContinue}
            className="continue-drill-card__action inline-flex h-[48px] shrink-0 items-center justify-center gap-[8px] rounded-[16px] border border-[var(--primary-border)] bg-[var(--primary)] px-[16px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
          >
            {continueLabel}
            <ChevronRight className="size-[20px]" aria-hidden />
          </button>
          {onMore ? (
            <button
              type="button"
              onClick={onMore}
              className="continue-drill-card__more inline-flex h-[40px] shrink-0 items-center justify-center gap-[8px] rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--primary)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[var(--greyscale-25)]"
            >
              {moreLabel}
              <ChevronRight className="size-[16px]" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export { ContinueDrillCard }
