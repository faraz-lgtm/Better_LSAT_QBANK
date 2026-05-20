import type { ReactNode } from "react"
import { BookOpen, Clock, FileText, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PrepCourseCurriculumStats } from "@/features/prep-course/lib/prep-course-format"
import { formatTotalHoursLabel } from "@/features/prep-course/lib/prep-course-format"

type PrepCourseContentHeaderProps = {
  stats: PrepCourseCurriculumStats
  expandAll: boolean
  onToggleExpandAll: () => void
}

function StatChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex h-6 items-center gap-2 rounded-2xl py-2">
      <span className="text-[#666d80]" aria-hidden>
        {icon}
      </span>
      <span className="text-xs font-medium tracking-[0.02em] text-[#666d80]">{label}</span>
    </div>
  )
}

function PrepCourseContentHeader({ stats, expandAll, onToggleExpandAll }: PrepCourseContentHeaderProps) {
  return (
    <div className="rounded-t-2xl border border-b-0 border-[#dfe1e7] bg-[#f6f8fa] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold leading-[1.3] text-[#062357]">Course Content</h1>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl border-[#dfe1e7] bg-white text-sm font-semibold text-[#0d47a1]"
          onClick={onToggleExpandAll}
        >
          {expandAll ? "Collapse All" : "Expand All"}
        </Button>
      </div>
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
  )
}

export { PrepCourseContentHeader }
