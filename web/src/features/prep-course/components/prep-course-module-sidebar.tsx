import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  lessonProgressPercent,
  moduleLessonCount,
} from "@/features/prep-course/lib/prep-course-format"
import type { PrepCourseModule, PrepLesson } from "@/lib/api/prep-course"

type PrepCourseModuleSidebarProps = {
  modules: PrepCourseModule[]
  selectedModuleId: string | null
  completedLessonSlugs: Set<string>
  onSelectModule: (moduleId: string) => void
}

function moduleLessons(mod: PrepCourseModule): PrepLesson[] {
  return mod.sections.flatMap((section) => section.lessons)
}

function PrepCourseModuleSidebar({
  modules,
  selectedModuleId,
  completedLessonSlugs,
  onSelectModule,
}: PrepCourseModuleSidebarProps) {
  return (
    <aside
      className="flex w-full shrink-0 flex-col rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] lg:w-[320px]"
      aria-label="Course modules"
    >
      <div className="border-b border-[#dfe1e7] px-4 py-4">
        <h2 className="text-lg font-bold tracking-[0.02em] text-[#062357]">Course Modules</h2>
      </div>
      <ul className="max-h-[min(70vh,640px)] flex-1 space-y-1 overflow-y-auto p-2">
        {modules.map((mod) => {
          const isActive = mod.id === selectedModuleId
          const lessons = moduleLessons(mod)
          const lessonCount = moduleLessonCount(mod)
          const completedCount = countCompletedLessons(lessons, completedLessonSlugs)
          const progressPercent = lessonProgressPercent(completedCount, lessonCount)
          return (
            <li key={mod.id}>
              <button
                type="button"
                onClick={() => onSelectModule(mod.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                  isActive
                    ? "border-[#0d47a1]/30 bg-[#f3f7ff]"
                    : "border-transparent hover:bg-[#f6f8fa]"
                }`}
              >
                <ProgressRing value={progressPercent} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-snug ${isActive ? "text-[#0d47a1]" : "text-[#062357]"}`}>
                    {mod.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#666d80]">
                    {lessonCount} {lessonCount === 1 ? "Lesson" : "Lessons"}
                  </p>
                </div>
                {!isActive && lessonCount === 0 ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#a4acb9]">
                    Not Started
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export { PrepCourseModuleSidebar }
