import { Check, X } from "lucide-react"

import { formatDurationShort } from "@/features/prep-course/lib/prep-course-format"
import type { PrepLesson } from "@/lib/api/prep-course"
import { cn } from "@/lib/utils"

type PrepCourseLessonSidebarProps = {
  lessons: PrepLesson[]
  activeLessonSlug?: string
  completedLessonSlugs: Set<string>
  progressPercent: number
  sectionTitle: string
  sectionSubtitle: string
  onSelectLesson: (slug: string) => void
  onClose: () => void
}

function ProgressRing({
  value,
  size = "md",
  ringBg = "var(--secondary-100)",
}: {
  value: number
  size?: "md" | "sm"
  ringBg?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  const angle = (pct / 100) * 360
  const dim = size === "sm" ? "size-9" : "size-12"
  const text = size === "sm" ? "text-[10px]" : "text-[10px]"
  return (
    <div className={`relative flex ${dim} shrink-0 items-center justify-center rounded-full`} aria-hidden>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(var(--primary-500) ${angle}deg, var(--greyscale-100) ${angle}deg)`,
        }}
      />
      <div className="absolute inset-[3px] rounded-full" style={{ backgroundColor: ringBg }} />
      <span className={`relative font-bold leading-none tracking-[0.02em] text-[color:var(--greyscale-500)] ${text}`}>
        {pct}%
      </span>
    </div>
  )
}

function LessonStatusMarker({ variant }: { variant: "complete" | "active" | "incomplete" }) {
  if (variant === "complete") {
    return (
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#0d47a1] bg-[#0d47a1]"
        aria-label="Completed"
      >
        <Check className="size-3.5 text-white" strokeWidth={2.5} aria-hidden />
      </span>
    )
  }

  return (
    <span
      className={cn(
        "size-6 shrink-0 rounded-full border bg-white",
        variant === "active" ? "border-white" : "border-[color:var(--greyscale-100)]",
      )}
      aria-hidden
    />
  )
}

function PrepCourseLessonSidebar({
  lessons,
  activeLessonSlug,
  completedLessonSlugs,
  progressPercent,
  sectionTitle,
  sectionSubtitle,
  onSelectLesson,
  onClose,
}: PrepCourseLessonSidebarProps) {
  return (
    <aside
      className="flex min-h-0 w-full flex-1 shrink-0 flex-col self-stretch overflow-hidden rounded-[16px] border border-[color:var(--greyscale-100)] bg-[#f3f7ff] lg:w-[320px]"
      aria-label="Course lessons"
    >
      <div className="shrink-0 border-b border-[color:var(--greyscale-100)] bg-[#f3f7ff] p-6">
        <div className="flex items-start gap-4">
          <h2 className="min-w-0 flex-1 text-2xl font-bold leading-[1.3] text-[#062357]">All Lessons</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--greyscale-100)] bg-white text-[color:var(--greyscale-500)] transition hover:text-[#062357]"
            aria-label="Close lesson sidebar"
          >
            <X className="size-6" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <ProgressRing value={progressPercent} ringBg="#f3f7ff" />
            <p
              className="min-w-0 text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[#062357]"
              title={sectionTitle}
            >
              {sectionTitle}
            </p>
          </div>
          <p className="text-xs font-normal leading-normal tracking-[0.24px] text-[color:var(--greyscale-400)]">
            {sectionSubtitle}
          </p>
        </div>
      </div>

      <div className="practice-session-scroll-hidden min-h-0 flex-1 overflow-y-auto bg-white p-6">
        <ul className="flex flex-col gap-3">
          {lessons.map((lesson, index) => {
            const isActive = lesson.slug === activeLessonSlug
            const isComplete = completedLessonSlugs.has(lesson.slug)

            const rowBg = isActive
              ? "bg-[#0d47a1]"
              : index % 2 === 0
                ? "bg-[#f3f7ff]"
                : "bg-[#f6f8fa]"

            const markerVariant = isActive ? "active" : isComplete ? "complete" : "incomplete"

            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => onSelectLesson(lesson.slug)}
                  className={cn(
                    "flex h-16 w-full items-center gap-3 rounded-[14px] px-3 text-left transition-colors",
                    rowBg,
                    !isActive && "hover:brightness-[0.98]",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <LessonStatusMarker variant={markerVariant} />
                    <span
                      className={cn(
                        "min-w-0 truncate text-xs font-medium leading-normal tracking-[0.24px]",
                        isActive ? "text-white" : "text-[#062357]",
                      )}
                      title={lesson.title}
                    >
                      {lesson.title}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "w-12 shrink-0 text-right text-xs font-medium leading-normal tracking-[0.24px]",
                      isActive ? "text-white" : "text-[color:var(--greyscale-500)]",
                    )}
                  >
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
