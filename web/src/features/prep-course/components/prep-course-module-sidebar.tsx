import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  lessonProgressPercent,
  moduleLessonCount,
  moduleStatusLabel,
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
      className="flex w-full shrink-0 flex-col bg-[#F3F7FF] lg:w-[300px]"
      aria-label="Course modules"
    >
      <div className="px-5 py-4">
        <h2 className="text-lg font-bold tracking-[0.02em] text-[#062357]">Course Modules</h2>
      </div>
      <ul className="practice-session-scroll-hidden flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {modules.map((mod) => {
          const isActive = mod.id === selectedModuleId
          const lessons = moduleLessons(mod)
          const lessonCount = moduleLessonCount(mod)
          const completedCount = countCompletedLessons(lessons, completedLessonSlugs)
          const progressPercent = lessonProgressPercent(completedCount, lessonCount)
          const statusLabel = moduleStatusLabel(completedCount, lessonCount)

          return (
            <li key={mod.id}>
              <button
                type="button"
                onClick={() => onSelectModule(mod.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                  isActive ? "bg-white shadow-[0px_1px_2px_rgba(13,13,18,0.06)]" : "hover:bg-white/70"
                }`}
              >
                <ProgressRing value={progressPercent} size="sm" ringBg={isActive ? "#ffffff" : "#F3F7FF"} />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-semibold leading-snug tracking-[0.02em] text-[#062357]"
                    title={mod.title}
                  >
                    {mod.title}
                  </p>
                  <p className="mt-0.5 text-xs font-medium tracking-[0.02em] text-[#666d80]">
                    {lessonCount} {lessonCount === 1 ? "Lesson" : "Lessons"}
                  </p>
                </div>
                {statusLabel && !isActive ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a4acb9]">
                    {statusLabel}
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
