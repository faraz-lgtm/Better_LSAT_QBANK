import { Check, Circle, X } from "lucide-react"

import {
  formatDurationShort,
} from "@/features/prep-course/lib/prep-course-format"
import type { PrepLesson } from "@/lib/api/prep-course"

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
  ringBg = "#F3F7FF",
}: {
  value: number
  size?: "md" | "sm"
  ringBg?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  const angle = (pct / 100) * 360
  const dim = size === "sm" ? "size-9" : "size-12"
  const text = size === "sm" ? "text-[10px]" : "text-xs"
  return (
    <div className={`relative flex ${dim} shrink-0 items-center justify-center rounded-full`} aria-hidden>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#0d47a1 ${angle}deg, #dfe1e7 ${angle}deg)`,
        }}
      />
      <div className="absolute inset-[3px] rounded-full" style={{ backgroundColor: ringBg }} />
      <span className={`relative font-bold leading-none tracking-[0.02em] text-[#666d80] ${text}`}>{pct}%</span>
    </div>
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
    <aside className="flex min-h-0 w-full shrink-0 flex-col bg-[#F3F7FF] lg:w-[300px]" aria-label="Course lessons">
      <div className="shrink-0 flex items-center justify-between border-b border-[#dfe1e7]/80 px-4 py-4">
        <h2 className="text-lg font-bold tracking-[0.02em] text-[#062357]">All Lessons</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-8 items-center justify-center rounded-lg text-[#666d80] transition hover:bg-white/80 hover:text-[#062357]"
          aria-label="Close lesson sidebar"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div className="shrink-0 border-b border-[#dfe1e7]/80 px-4 py-4">
        <div className="flex items-start gap-3">
          <ProgressRing value={progressPercent} />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold leading-snug tracking-[0.02em] text-[#062357]" title={sectionTitle}>
              {sectionTitle}
            </p>
            <p className="mt-1 text-xs font-medium tracking-[0.02em] text-[#666d80]">{sectionSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="practice-session-scroll-hidden min-h-0 flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {lessons.map((lesson) => {
            const isActive = lesson.slug === activeLessonSlug
            const isComplete = completedLessonSlugs.has(lesson.slug)
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => onSelectLesson(lesson.slug)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-[#0d47a1] font-semibold text-white shadow-sm"
                      : "text-[#062357] hover:bg-white/70"
                  }`}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    {isComplete && !isActive ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#0d47a1]">
                        <Check className="size-3 text-white" strokeWidth={2.5} aria-hidden />
                      </span>
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
