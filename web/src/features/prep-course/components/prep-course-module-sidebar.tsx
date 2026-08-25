import {
  PREP_COURSE_FIGMA,
  PrepCourseFigmaIcon,
} from "@/features/prep-course/components/prep-course-figma-icons"
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
  lockedModuleIds?: ReadonlySet<string>
  onSelectModule: (moduleId: string) => void
  onLockedModuleClick?: (moduleId: string) => void
}

function moduleLessons(mod: PrepCourseModule): PrepLesson[] {
  return mod.sections.flatMap((section) => section.lessons)
}

function PrepCourseModuleSidebar({
  modules,
  selectedModuleId,
  completedLessonSlugs,
  lockedModuleIds,
  onSelectModule,
  onLockedModuleClick,
}: PrepCourseModuleSidebarProps) {
  return (
    <aside
      className="flex min-h-0 w-full shrink-0 flex-col border-t border-[#dfe1e7] bg-[var(--primary-0)] pl-4 lg:w-[288px] lg:border-t-0 lg:border-l"
      aria-label="Course modules"
    >
      <div className="shrink-0 pt-6 pr-3">
        <h2 className="text-xl font-bold leading-[1.35] text-[#082c6b]">Course Modules</h2>
      </div>
      <ul className="practice-session-pane--scroll-visible min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden py-3 pr-3">
        {modules.map((mod) => {
          const isActive = mod.id === selectedModuleId
          const isLocked = lockedModuleIds?.has(mod.id) ?? false
          const lessons = moduleLessons(mod)
          const lessonCount = moduleLessonCount(mod)
          const completedCount = countCompletedLessons(lessons, completedLessonSlugs)
          const progressPercent = lessonProgressPercent(completedCount, lessonCount)
          const statusLabel = moduleStatusLabel(completedCount, lessonCount)

          return (
            <li key={mod.id}>
              <button
                type="button"
                onClick={() => {
                  if (isLocked) {
                    onLockedModuleClick?.(mod.id)
                    return
                  }
                  onSelectModule(mod.id)
                }}
                aria-label={isLocked ? `${mod.title} (locked)` : undefined}
                className={cn(
                  "flex h-[62px] w-full items-center gap-3 rounded-[16px] p-3 text-left transition-colors",
                  isActive
                    ? "max-w-[256px] bg-[var(--primary-25)] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
                    : "hover:bg-white/60",
                )}
              >
                {isLocked ? (
                  <span className="flex size-9 shrink-0 items-center justify-center" aria-hidden>
                    <PrepCourseFigmaIcon src={`${PREP_COURSE_FIGMA}/icon-lock.svg`} className="size-6" />
                  </span>
                ) : (
                  <ProgressRing
                    value={progressPercent}
                    size="sm"
                    ringBg={isActive ? "var(--primary-25)" : "var(--primary-0)"}
                  />
                )}
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
                  <p className="text-xs font-normal leading-[1.5] tracking-[0.24px] text-[color:var(--primary-100)]">
                    {lessonCount} {lessonCount === 1 ? "Lesson" : "Lessons"}
                  </p>
                </div>
                {statusLabel && !isActive && !isLocked ? (
                  <span className="w-[46px] shrink-0 text-center text-xs font-normal leading-[1.5] tracking-[0.24px] text-[color:var(--primary-100)]">
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
