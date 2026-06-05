import { Bookmark } from "lucide-react"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import { isPrepCourseDrillLessonType, lessonMetaLine } from "@/features/prep-course/lib/prep-course-format"
import type {
  PrepCourse,
  PrepLesson,
  PrepLessonActiveDrillAttempt,
  PrepLessonLinkedQuestionRef,
} from "@/lib/api/prep-course"

type PrepCourseLessonPanelProps = {
  course: PrepCourse
  lesson: PrepLesson | null
  linkedQuestionRefs?: PrepLessonLinkedQuestionRef[]
  activeDrillAttempt?: PrepLessonActiveDrillAttempt | null
  loading?: boolean
  sectionSubtitle?: string | null
  onReviewDrill?: () => void
  onStartDrill?: () => void
  startingDrill?: boolean
  drillStartError?: string | null
}

function PrepCourseLessonPanel({
  course: _course,
  lesson,
  linkedQuestionRefs = [],
  activeDrillAttempt = null,
  loading = false,
  sectionSubtitle = null,
  onReviewDrill,
  onStartDrill,
  startingDrill = false,
  drillStartError = null,
}: PrepCourseLessonPanelProps) {
  const isPrepCourseDrill = lesson ? isPrepCourseDrillLessonType(lesson.lesson_type) : false
  const headerMeta =
    lesson && !loading
      ? lessonMetaLine(lesson, {
          activeDrillAttempted: isPrepCourseDrill ? Boolean(activeDrillAttempt) : true,
        })
      : null
  const subtitle = sectionSubtitle ?? headerMeta
  const hasVideo =
    Boolean(lesson?.video_url?.trim()) &&
    lesson != null &&
    (lesson.lesson_type === "video" ||
      lesson.lesson_type === "video_text" ||
      lesson.lesson_type === "active_drill" ||
      lesson.lesson_type === "adaptive_drill")

  const titleBlock =
    lesson && !loading ? (
      <header className="flex items-start justify-between gap-4 border-b border-[#dfe1e7] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight tracking-[0.02em] text-[#062357] md:text-[28px]">
            {lesson.title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm font-medium tracking-[0.02em] text-[#666d80]">{subtitle}</p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Bookmark lesson"
          className="shrink-0 rounded-lg border border-[#dfe1e7] bg-white p-2 text-[#666d80] transition-colors hover:border-[#0d47a1] hover:text-[#0d47a1]"
        >
          <Bookmark className="size-5" strokeWidth={2} />
        </button>
      </header>
    ) : null

  return (
    <div className="min-w-0">
      {loading && !lesson ? (
        <p className="ds-body-sm ds-text-muted">Loading lesson...</p>
      ) : lesson ? (
        <>
          {!hasVideo ? titleBlock : null}
          <div className={!hasVideo ? "mt-8" : undefined}>
          <LessonContentRenderer
            lesson={lesson}
            linkedQuestionRefs={linkedQuestionRefs}
            activeDrillAttempt={activeDrillAttempt}
            hideTitle
            belowVideo={hasVideo ? titleBlock : undefined}
            onReviewDrill={onReviewDrill}
            onStartDrill={onStartDrill}
            startingDrill={startingDrill}
            drillStartError={drillStartError}
          />
          </div>
        </>
      ) : (
        <p className="ds-body-sm ds-text-muted">Select a lesson to view its content.</p>
      )}
    </div>
  )
}

export { PrepCourseLessonPanel }
