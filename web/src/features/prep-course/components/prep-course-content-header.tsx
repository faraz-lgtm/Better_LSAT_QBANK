import type { ReactNode } from "react"
import { Bookmark, BookOpen, Clock, FileText, Layers, Power } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { PrepCourseCurriculumStats } from "@/features/prep-course/lib/prep-course-format"
import { formatTotalHoursLabel } from "@/features/prep-course/lib/prep-course-format"

type PrepCourseContentHeaderProps = {
  stats: PrepCourseCurriculumStats
  expandAll: boolean
  showBookmarksOnly: boolean
  onToggleExpandAll: () => void
  onToggleShowBookmarksOnly: (next: boolean) => void
}

function StatChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex h-6 items-center gap-2">
      <span className="text-[#666d80]" aria-hidden>
        {icon}
      </span>
      <span className="text-xs font-medium tracking-[0.02em] text-[#666d80]">{label}</span>
    </div>
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
    <div className="border-b border-[#dfe1e7] bg-white px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-[1.3] tracking-[0.02em] text-[#062357]">Course Content</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <StatChip icon={<Layers className="size-4" />} label={`${stats.moduleCount} Modules`} />
            <StatChip icon={<FileText className="size-4" />} label={`${stats.sectionCount} Sections`} />
            <StatChip icon={<BookOpen className="size-4" />} label={`${stats.lessonCount} Lessons`} />
            <StatChip
              icon={<Clock className="size-4" />}
              label={`${formatTotalHoursLabel(stats.totalMinutes)} total length`}
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <div className="flex items-center gap-2.5">
            <Bookmark className="size-4 shrink-0 text-[#666d80]" strokeWidth={2} aria-hidden />
            <span className="text-sm font-medium tracking-[0.02em] text-[#666d80]">Show All Bookmark</span>
            <Switch
              size="sm"
              checked={showBookmarksOnly}
              onChange={(e) => onToggleShowBookmarksOnly(e.target.checked)}
              className={showBookmarksOnly ? "bg-[#0d47a1]!" : undefined}
              aria-label="Show all bookmark"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-xl border-[#dfe1e7] bg-white px-4 text-sm font-semibold text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
            onClick={onToggleExpandAll}
          >
            <span className="flex size-6 items-center justify-center rounded-full border border-[#0d47a1]">
              <Power className="size-3" strokeWidth={2} aria-hidden />
            </span>
            {expandAll ? "Collapse All" : "Expand All"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { PrepCourseContentHeader }
