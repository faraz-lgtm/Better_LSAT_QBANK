import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  lessonProgressPercent,
  moduleLessonCount,
  moduleStatusLabel,
} from "@/features/prep-course/lib/prep-course-format"
import type { PrepCourseModule, PrepLesson } from "@/lib/api/prep-course"
import { cn } from "@/lib/utils"

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
      className="flex min-h-0 w-full shrink-0 flex-col rounded-br-2xl rounded-tr-2xl border border-[#dfe1e7] bg-[#f3f7ff] lg:w-[272px]"
      aria-label="Course modules"
    >
      <div className="shrink-0 px-4 pt-6">
        <h2 className="text-xl font-bold leading-[1.35] text-[#082c6b]">Course Modules</h2>
      </div>
      <ul className="practice-session-scroll-hidden flex-1 space-y-2 overflow-y-auto p-4 pt-3">
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
                className={cn(
                  "flex h-[62px] w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors",
                  isActive
                    ? "bg-[#edf3ff] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
                    : "hover:bg-white/60",
                )}
              >
                <ProgressRing value={progressPercent} size="sm" ringBg={isActive ? "#edf3ff" : "#f3f7ff"} />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-xs font-semibold leading-[1.5] tracking-[0.24px]",
                      isActive ? "text-[#062357]" : "text-[#082c6b]",
                    )}
                    title={mod.title}
                  >
                    {mod.title}
                  </p>
                  <p className="text-xs font-normal leading-[1.5] tracking-[0.24px] text-[#6d78b6]">
                    {lessonCount} {lessonCount === 1 ? "Lesson" : "Lessons"}
                  </p>
                </div>
                {statusLabel && !isActive ? (
                  <span className="shrink-0 text-center text-xs font-normal leading-[1.5] tracking-[0.24px] text-[#6d78b6]">
                    {statusLabel === "Not Started" ? (
                      <>
                        Not
                        <br />
                        Started
                      </>
                    ) : (
                      statusLabel
                    )}
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
