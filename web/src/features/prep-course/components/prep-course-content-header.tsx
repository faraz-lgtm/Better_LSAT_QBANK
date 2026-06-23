import type { ReactNode } from "react"
import { Bookmark, BookOpen, Clock, FileText, Layers } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import type { PrepCourseCurriculumStats } from "@/features/prep-course/lib/prep-course-format"
import { cn } from "@/lib/utils"

type PrepCourseContentHeaderProps = {
  stats: PrepCourseCurriculumStats
  showBookmarksOnly: boolean
  onToggleShowBookmarksOnly: (next: boolean) => void
}

function StatChip({ icon, value, label }: { icon: ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex h-[42px] items-center gap-2">
      <span className="text-[color:var(--greyscale-500)]" aria-hidden>
        {icon}
      </span>
      <div className="leading-[1.5]">
        <p className="text-base font-semibold tracking-[0.32px] text-[#062357]">{value}</p>
        <p className="text-xs font-medium tracking-[0.24px] text-[color:var(--greyscale-500)]">{label}</p>
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
      className="inline-flex h-8 items-center gap-2 rounded-xl border border-[color:var(--greyscale-100)] bg-white px-4 py-2 text-xs font-semibold tracking-[0.24px] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--greyscale-25)]"
      aria-expanded={expanded}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className={cn("size-4 shrink-0 text-[#0d47a1]", expanded && "rotate-180")}
        aria-hidden
      >
        <path
          d="M8.66667 2.66667C8.66667 2.29848 8.36819 2 8 2C7.63181 2 7.33333 2.29848 7.33333 2.66667V7.72386L6.13807 6.5286C5.87772 6.26825 5.45561 6.26825 5.19526 6.5286C4.93491 6.78895 4.93491 7.21106 5.19526 7.4714L7.52859 9.80474C7.78894 10.0651 8.21105 10.0651 8.4714 9.80474L10.8047 7.4714C11.0651 7.21106 11.0651 6.78895 10.8047 6.5286C10.5444 6.26825 10.1223 6.26825 9.86193 6.5286L8.66667 7.72386V2.66667Z"
          fill="currentColor"
        />
        <path
          d="M4.70017 4.70016C4.96052 4.43981 4.96052 4.0177 4.70017 3.75736C4.43982 3.49701 4.01771 3.49701 3.75736 3.75736C1.41421 6.1005 1.41421 9.89949 3.75736 12.2426C6.1005 14.5858 9.8995 14.5858 12.2426 12.2426C14.5858 9.89949 14.5858 6.1005 12.2426 3.75736C11.9823 3.49701 11.5602 3.49701 11.2998 3.75736C11.0395 4.0177 11.0395 4.43981 11.2998 4.70016C13.1223 6.52261 13.1223 9.47738 11.2998 11.2998C9.47738 13.1223 6.52261 13.1223 4.70017 11.2998C2.87772 9.47738 2.87772 6.52261 4.70017 4.70016Z"
          fill="currentColor"
        />
      </svg>
      {label}
    </button>
  )
}

function PrepCourseContentHeader({
  stats,
  showBookmarksOnly,
  onToggleShowBookmarksOnly,
}: PrepCourseContentHeaderProps) {
  return (
    <div className="rounded-t-[16px] border-b border-[color:var(--greyscale-100)] bg-[var(--primary-0)] p-[24px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">Course Content</h2>
          <div className="flex flex-wrap items-center gap-4">
            <StatChip icon={<Layers className="size-4" />} value={stats.moduleCount} label="Modules" />
            <span className="h-5 w-px bg-[var(--greyscale-100)]" aria-hidden />
            <StatChip icon={<FileText className="size-4" />} value={stats.sectionCount} label="Sections" />
            <span className="h-5 w-px bg-[var(--greyscale-100)]" aria-hidden />
            <StatChip icon={<BookOpen className="size-4" />} value={stats.lessonCount} label="Lessons" />
            <span className="h-5 w-px bg-[var(--greyscale-100)]" aria-hidden />
            <StatChip
              icon={<Clock className="size-4" />}
              value={stats.totalMinutes < 60 ? stats.totalMinutes : Math.floor(stats.totalMinutes / 60)}
              label="Hours total length"
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-center">
          <div className="flex items-center gap-2">
            <Bookmark className="size-4 shrink-0 text-[color:var(--greyscale-500)]" strokeWidth={2} aria-hidden />
            <span className="text-xs font-medium tracking-[0.24px] text-[color:var(--greyscale-500)]">Show All Bookmark</span>
            <Switch
              size="sm"
              checked={showBookmarksOnly}
              onChange={(e) => onToggleShowBookmarksOnly(e.target.checked)}
              className={showBookmarksOnly ? "bg-[#0d47a1]!" : undefined}
              aria-label="Show all bookmark"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export { PrepCourseContentHeader, PrepCourseExpandButton }
