import type { ReactNode } from "react"
import { Bookmark, BookOpen, ChevronDown, Clock, FileText, Layers } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import type { PrepCourseCurriculumStats } from "@/features/prep-course/lib/prep-course-format"

type PrepCourseContentHeaderProps = {
  stats: PrepCourseCurriculumStats
  expandAll: boolean
  showBookmarksOnly: boolean
  onToggleExpandAll: () => void
  onToggleShowBookmarksOnly: (next: boolean) => void
}

function StatChip({ icon, value, label }: { icon: ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex h-[42px] items-center gap-2">
      <span className="text-[#666d80]" aria-hidden>
        {icon}
      </span>
      <div className="leading-[1.5]">
        <p className="text-base font-semibold tracking-[0.32px] text-[#062357]">{value}</p>
        <p className="text-xs font-medium tracking-[0.24px] text-[#666d80]">{label}</p>
      </div>
    </div>
  )
}

function PrepCourseExpandButton({
  label,
  onClick,
  expanded = false,
}: {
  label: string
  onClick: () => void
  expanded?: boolean
}) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-2 rounded-xl border border-[#dfe1e7] bg-white px-4 text-xs font-semibold tracking-[0.24px] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"
      aria-expanded={expanded}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <span
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-[#0d47a1]"
        aria-hidden
      >
        <ChevronDown className="size-2.5" strokeWidth={2.5} />
      </span>
      {label}
    </button>
  )
}

function PrepCourseContentHeader({
  stats,
  expandAll,
  showBookmarksOnly,
  onToggleExpandAll,
  onToggleShowBookmarksOnly,
}: PrepCourseContentHeaderProps) {
  return (
    <div className="rounded-t-2xl border-b border-[#dfe1e7] bg-[#f6f8fa] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">Course Content</h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <StatChip icon={<Layers className="size-4" />} value={stats.moduleCount} label="Modules" />
            <span className="h-5 w-px bg-[#dfe1e7]" aria-hidden />
            <StatChip icon={<FileText className="size-4" />} value={stats.sectionCount} label="Sections" />
            <span className="h-5 w-px bg-[#dfe1e7]" aria-hidden />
            <StatChip icon={<BookOpen className="size-4" />} value={stats.lessonCount} label="Lessons" />
            <span className="h-5 w-px bg-[#dfe1e7]" aria-hidden />
            <StatChip
              icon={<Clock className="size-4" />}
              value={stats.totalMinutes < 60 ? stats.totalMinutes : Math.floor(stats.totalMinutes / 60)}
              label="Hours total length"
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-center gap-2">
          <div className="flex items-center gap-2">
            <Bookmark className="size-4 shrink-0 text-[#666d80]" strokeWidth={2} aria-hidden />
            <span className="text-xs font-medium tracking-[0.24px] text-[#666d80]">Show All Bookmark</span>
            <Switch
              size="sm"
              checked={showBookmarksOnly}
              onChange={(e) => onToggleShowBookmarksOnly(e.target.checked)}
              className={showBookmarksOnly ? "bg-[#0d47a1]!" : undefined}
              aria-label="Show all bookmark"
            />
          </div>
          <PrepCourseExpandButton label="Expand All" expanded={expandAll} onClick={onToggleExpandAll} />
        </div>
      </div>
    </div>
  )
}

export { PrepCourseContentHeader, PrepCourseExpandButton }
