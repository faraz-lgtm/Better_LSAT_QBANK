import { Check, Circle } from "lucide-react"

import {
  formatCourseHoursLabel,
  formatDurationShort,
  totalDurationMinutes,
} from "@/features/prep-course/lib/prep-course-format"
import type { PrepCourse, PrepLesson } from "@/lib/api/prep-course"

type PrepCourseLessonSidebarProps = {
  course: PrepCourse
  lessons: PrepLesson[]
  activeLessonSlug?: string
  completedLessonSlugs: Set<string>
  progressPercent: number
  onSelectLesson: (slug: string) => void
}

function ProgressRing({ value, size = "md" }: { value: number; size?: "md" | "sm" }) {
  const pct = Math.max(0, Math.min(100, value))
  const angle = (pct / 100) * 360
  const dim = size === "sm" ? "size-9" : "size-12"
  const text = size === "sm" ? "text-[10px]" : "text-xs"
  return (
    <div
      className={`relative flex ${dim} shrink-0 items-center justify-center rounded-full bg-white`}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#0d47a1 ${angle}deg, #dfe1e7 ${angle}deg)`,
        }}
      />
      <div className="absolute inset-[3px] rounded-full bg-white" />
      <span className={`relative font-bold leading-none tracking-[0.02em] text-[#666d80] ${text}`}>{pct}%</span>
    </div>
  )
}

function PrepCourseLessonSidebar({
  course,
  lessons,
  activeLessonSlug,
  completedLessonSlugs,
  progressPercent,
  onSelectLesson,
}: PrepCourseLessonSidebarProps) {
  const totalMinutes = totalDurationMinutes(lessons)

  return (
    <aside
      className="flex flex-col rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]"
      aria-label="Course lessons"
    >
      <div className="border-b border-[#dfe1e7] p-4">
        <h2 className="text-lg font-bold tracking-[0.02em] text-[#062357]">All Lessons</h2>
        <div className="mt-4 flex items-start gap-3">
          <ProgressRing value={progressPercent} />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#062357]">{course.title}</p>
            <p className="mt-1 text-xs text-[#666d80]">{formatCourseHoursLabel(totalMinutes)}</p>
          </div>
        </div>
      </div>

      <div className="max-h-[min(60vh,520px)] flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {lessons.map((lesson) => {
            const isActive = lesson.slug === activeLessonSlug
            const isComplete = completedLessonSlugs.has(lesson.slug)
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => onSelectLesson(lesson.slug)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-[#0d47a1] font-semibold text-white shadow-sm"
                      : "text-[#062357] hover:bg-[#f3f7ff]"
                  }`}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    {isComplete && !isActive ? (
                      <Check className="size-4 text-[#0d47a1]" strokeWidth={2.5} />
                    ) : (
                      <Circle
                        className={`size-2.5 fill-current ${isActive ? "text-white" : "text-[#c5cee0]"}`}
                        strokeWidth={0}
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                  <span className={`shrink-0 text-xs ${isActive ? "text-white/85" : "text-[#666d80]"}`}>
                    {formatDurationShort(lesson.duration_minutes)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

export { PrepCourseLessonSidebar, ProgressRing }
