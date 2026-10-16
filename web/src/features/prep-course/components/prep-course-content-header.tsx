import { Bookmark } from "lucide-react"
import type { ReactNode } from "react"

import { Switch } from "@/components/ui/switch"
import {
  PREP_COURSE_FIGMA,
  PrepCourseFigmaIcon,
  PrepCourseStatClockIcon,
} from "@/features/prep-course/components/prep-course-figma-icons"
import type { PrepCourseCurriculumStats } from "@/features/prep-course/lib/prep-course-format"
import { cn } from "@/lib/utils"

type PrepCourseContentHeaderProps = {
  stats: PrepCourseCurriculumStats
  showBookmarksOnly: boolean
  onToggleShowBookmarksOnly: (next: boolean) => void
}

function StatChip({ icon, value, label }: { icon: ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex h-[42px] shrink-0 items-center gap-2">
      <span className="shrink-0 text-[color:var(--greyscale-500)]" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 leading-[1.5] tracking-[0.24px] text-[color:var(--greyscale-500)]">
        <p className="text-base font-semibold tracking-[0.32px] text-[var(--color-student-heading)]">{value}</p>
        <p className="text-xs font-medium">{label}</p>
      </div>
    </div>
  )
}

function PrepCourseExpandButton({
  expandLabel,
  collapseLabel,
  onClick,
  expanded = false,
}: {
  expandLabel: string
  collapseLabel: string
  onClick: () => void
  expanded?: boolean
}) {
  const label = expanded ? collapseLabel : expandLabel

  return (
    <button
      type="button"
      className="inline-flex h-8 max-w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 py-2 text-xs font-semibold tracking-[0.24px] text-[var(--primary)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--greyscale-25)] sm:px-4 dark:text-[var(--greyscale-900)]"
      aria-expanded={expanded}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <PrepCourseFigmaIcon
        src={`${PREP_COURSE_FIGMA}/icon-expand.svg`}
        className={cn("size-4 shrink-0", expanded && "rotate-180")}
      />
      {label}
    </button>
  )
}

function PrepCourseContentHeader({
  stats,
  showBookmarksOnly,
  onToggleShowBookmarksOnly,
}: PrepCourseContentHeaderProps) {
  const hoursValue = stats.totalMinutes < 60 ? stats.totalMinutes : Math.floor(stats.totalMinutes / 60)

  return (
    <div className="rounded-t-[16px] bg-[var(--greyscale-25)] p-4 sm:p-[24px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-h-12 items-center">
            <h2 className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">Course Content</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:flex md:flex-wrap md:items-center">
            <StatChip
              icon={<PrepCourseFigmaIcon src={`${PREP_COURSE_FIGMA}/stat-modules.svg`} />}
              value={stats.moduleCount}
              label="Modules"
            />
            <span className="hidden h-5 w-px bg-[var(--greyscale-100)] md:block" aria-hidden />
            <StatChip
              icon={<PrepCourseFigmaIcon src={`${PREP_COURSE_FIGMA}/stat-sections.svg`} />}
              value={stats.sectionCount}
              label="Sections"
            />
            <span className="hidden h-5 w-px bg-[var(--greyscale-100)] md:block" aria-hidden />
            <StatChip
              icon={<PrepCourseFigmaIcon src={`${PREP_COURSE_FIGMA}/stat-lessons.svg`} />}
              value={stats.lessonCount}
              label="Lessons"
            />
            <span className="hidden h-5 w-px bg-[var(--greyscale-100)] md:block" aria-hidden />
            <StatChip
              icon={<PrepCourseStatClockIcon />}
              value={hoursValue}
              label="Hours total length"
            />
          </div>
        </div>

        <div
          className={cn(
            "flex w-full shrink-0 items-center gap-2 md:w-auto",
            showBookmarksOnly ? "text-[var(--primary)]" : "text-[color:var(--greyscale-500)]",
          )}
        >
          <Bookmark
            className={cn("size-4 shrink-0", showBookmarksOnly && "fill-current")}
            strokeWidth={2}
            aria-hidden
          />
          <span className="min-w-0 flex-1 text-xs font-medium tracking-[0.24px] md:flex-none">
            All Modules Bookmark
          </span>
          <Switch
            size="sm"
            checked={showBookmarksOnly}
            onChange={(e) => onToggleShowBookmarksOnly(e.target.checked)}
            className={cn(
              "h-5 w-9 shrink-0 border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-0.5",
              showBookmarksOnly ? "bg-[var(--primary)]! border-[var(--primary)]!" : undefined,
            )}
            aria-label="Show all bookmark"
          />
        </div>
      </div>
    </div>
  )
}

export { PrepCourseContentHeader, PrepCourseExpandButton }
