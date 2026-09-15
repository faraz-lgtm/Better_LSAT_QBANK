import { Bookmark } from "lucide-react"
import type { RefObject } from "react"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import { cn } from "@/lib/utils"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import {
  isResolvedPrepCourseDrillLesson,
  lessonMetaLine,
} from "@/features/prep-course/lib/prep-course-format"
import type {
  PrepCourse,
  PrepLesson,
  PrepLessonActiveDrillAttempt,
  PrepLessonLinkedQuestionRef,
} from "@/lib/api/prep-course"

type DrillResultsPart = "cards" | "below" | "full"

const LESSON_READING_COLUMN_CLASS = "mx-auto w-full max-w-[840px]"
const LESSON_HEADER_PAD_CLASS = "px-5 md:px-8 pt-10 pb-6"
const LESSON_BODY_PAD_CLASS = "px-5 md:px-8 py-6"

type PrepCourseLessonPanelProps = {
  course: PrepCourse
  lesson: PrepLesson | null
  linkedQuestionRefs?: PrepLessonLinkedQuestionRef[]
  activeDrillAttempt?: PrepLessonActiveDrillAttempt | null
  loading?: boolean
  sectionSubtitle?: string | null
  contentScrollRef?: RefObject<HTMLDivElement | null>
  onReviewDrill?: () => void
  onStartDrill?: () => void
  startingDrill?: boolean
  drillStartError?: string | null
  lessonBookmarked?: boolean
  onToggleLessonBookmark?: (next: boolean) => void
  sidebarAdjacent?: boolean
  inLessonCard?: boolean
  drillResultsPart?: DrillResultsPart
  moduleLessonLine?: string | null
  lessonSequence?: { current: number; total: number } | null
}

function PrepCourseLessonPanel({
  course: _course,
  lesson,
  linkedQuestionRefs = [],
  activeDrillAttempt = null,
  loading = false,
  sectionSubtitle = null,
  contentScrollRef,
  onReviewDrill,
  onStartDrill,
  startingDrill = false,
  drillStartError = null,
  lessonBookmarked = false,
  onToggleLessonBookmark,
  sidebarAdjacent = false,
  inLessonCard = false,
  drillResultsPart = "full",
  moduleLessonLine = null,
  lessonSequence = null,
}: PrepCourseLessonPanelProps) {
  const isPrepCourseDrill = lesson ? isResolvedPrepCourseDrillLesson(lesson) : false
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
      isResolvedPrepCourseDrillLesson(lesson))
  const hideHeaderForDrillResults =
    Boolean(activeDrillAttempt) &&
    lesson != null &&
    isResolvedPrepCourseDrillLesson(lesson)
  const useContentColumnShell = Boolean(
    lesson && !loading && !hideHeaderForDrillResults && inLessonCard && !hasVideo,
  )
  const useLessonArticleShell = Boolean(
    lesson && !loading && !hasVideo && !useContentColumnShell,
  )

  const durationReadLabel =
    lesson && (lesson.duration_minutes ?? 0) > 0 ? `${lesson.duration_minutes} min read` : null
  const rightMeta = [durationReadLabel, hasVideo ? "video" : null].filter(Boolean).join(" · ")

  const renderLessonHeader = (embeddedInShell = false) => {
    const headerContent = (
      <>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            {moduleLessonLine ? (
              <p className="m-0 text-xs font-bold leading-[1.5] tracking-[0.24px] text-[var(--primary)]">{moduleLessonLine}</p>
            ) : null}
            <h2 className="m-0 text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)]">{lesson?.title}</h2>
            {subtitle ? (
              <p className="m-0 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            <button
              type="button"
              aria-label={lessonBookmarked ? "Remove lesson bookmark" : "Save lesson"}
              aria-pressed={lessonBookmarked}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-[14px] text-xs font-medium leading-[1.5] tracking-[0.24px] transition-colors",
                lessonBookmarked ? "text-[var(--primary)]" : "text-[var(--greyscale-500)] hover:text-[var(--primary)]",
              )}
              onClick={() => onToggleLessonBookmark?.(!lessonBookmarked)}
            >
              <Bookmark className={cn("size-4", lessonBookmarked && "fill-current")} strokeWidth={2} />
              <span>Save lesson</span>
            </button>
            {rightMeta ? (
              <p className="m-0 text-xs font-normal leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">{rightMeta}</p>
            ) : null}
          </div>
        </div>
        {lessonSequence ? (
          <div className="flex items-center gap-[14px]">
            <div className="flex min-w-0 flex-1 items-start gap-[3px]">
              {Array.from({ length: lessonSequence.total }).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-[5px] min-w-0 flex-1 rounded-full ${idx < lessonSequence.current ? "bg-[var(--primary)]" : "bg-[var(--greyscale-100)] dark:bg-[var(--greyscale-50)]"}`}
                />
              ))}
            </div>
            <p className="m-0 text-xs font-bold leading-[1.5] tracking-[0.24px] text-[var(--color-student-heading)]">
              {lessonSequence.current} / {lessonSequence.total}
            </p>
          </div>
        ) : null}
      </>
    )

    if (embeddedInShell) {
      return (
        <header className={cn("flex w-full min-w-0 flex-col gap-5", LESSON_READING_COLUMN_CLASS)}>
          {headerContent}
        </header>
      )
    }

    return (
      <header className={cn("flex min-w-0 flex-col items-center", LESSON_HEADER_PAD_CLASS)}>
        <div className={cn("flex w-full min-w-0 flex-col gap-5", LESSON_READING_COLUMN_CLASS)}>{headerContent}</div>
      </header>
    )
  }

  const titleBlock =
    lesson && !loading && !hideHeaderForDrillResults ? renderLessonHeader(useContentColumnShell) : null

  const belowVideoTitleBlock =
    lesson && !loading && hasVideo ? renderLessonHeader() : null

  const renderContentColumnShell = () =>
    inLessonCard ? (
      <div className="box-border flex w-full min-w-0 flex-col">
        <div className={cn("flex w-full min-w-0 flex-col items-center", LESSON_HEADER_PAD_CLASS)}>
          {titleBlock}
        </div>
        <div className={cn("flex w-full min-w-0 flex-col items-center", LESSON_BODY_PAD_CLASS)}>
          <div className={cn("min-w-0 w-full", LESSON_READING_COLUMN_CLASS)}>{lessonBody}</div>
        </div>
      </div>
    ) : (
      <article
        className={cn(
          "box-border min-w-0 max-w-full overflow-x-clip bg-transparent",
          sidebarAdjacent && "min-h-full",
        )}
      >
        <div className={cn("flex w-full min-w-0 flex-col items-center", LESSON_HEADER_PAD_CLASS)}>
          {titleBlock}
        </div>
        <div className={cn("flex w-full min-w-0 flex-col items-center", LESSON_BODY_PAD_CLASS)}>
          <div className={cn("min-w-0 w-full", LESSON_READING_COLUMN_CLASS)}>{lessonBody}</div>
        </div>
      </article>
    )

  const lessonBody = lesson ? (
    <LessonContentRenderer
      lesson={lesson}
      linkedQuestionRefs={linkedQuestionRefs}
      activeDrillAttempt={activeDrillAttempt}
      hideTitle
      belowVideo={hasVideo ? belowVideoTitleBlock : undefined}
      onReviewDrill={onReviewDrill}
      onStartDrill={onStartDrill}
      startingDrill={startingDrill}
      drillStartError={drillStartError}
      edgeToSidebar={false}
      skipArticleShell={useLessonArticleShell || inLessonCard}
      inLessonCard={inLessonCard}
      sectionSubtitle={subtitle}
      lessonBookmarked={lessonBookmarked}
      onToggleLessonBookmark={onToggleLessonBookmark}
      drillResultsPart={drillResultsPart}
    />
  ) : null

  const contentPaddingClass = inLessonCard ? "p-0" : sidebarAdjacent ? "pt-6 pb-6 pl-6 pr-0" : "p-6"
  const paneBgClass = "bg-[var(--greyscale-0)]"
  const lessonFlowClass = cn("min-w-0 w-full", paneBgClass, contentPaddingClass)

  if (lesson && hideHeaderForDrillResults && drillResultsPart === "cards") {
    return (
      <div className="box-border w-full shrink-0 bg-[var(--greyscale-0)]">
        <LessonContentRenderer
          lesson={lesson}
          linkedQuestionRefs={linkedQuestionRefs}
          activeDrillAttempt={activeDrillAttempt}
          hideTitle
          belowVideo={hasVideo ? belowVideoTitleBlock : undefined}
          onReviewDrill={onReviewDrill}
          onStartDrill={onStartDrill}
          startingDrill={startingDrill}
          drillStartError={drillStartError}
          edgeToSidebar={false}
          skipArticleShell={false}
          sectionSubtitle={subtitle}
          lessonBookmarked={lessonBookmarked}
          onToggleLessonBookmark={onToggleLessonBookmark}
          drillResultsPart="cards"
        />
      </div>
    )
  }

  if (lesson && hideHeaderForDrillResults && drillResultsPart === "below") {
    const belowContent = (
      <LessonContentRenderer
        lesson={lesson}
        linkedQuestionRefs={linkedQuestionRefs}
        activeDrillAttempt={activeDrillAttempt}
        hideTitle
        belowVideo={hasVideo ? belowVideoTitleBlock : undefined}
        onReviewDrill={onReviewDrill}
        onStartDrill={onStartDrill}
        startingDrill={startingDrill}
        drillStartError={drillStartError}
        edgeToSidebar={false}
        skipArticleShell={false}
        sectionSubtitle={subtitle}
        lessonBookmarked={lessonBookmarked}
        onToggleLessonBookmark={onToggleLessonBookmark}
        drillResultsPart="below"
      />
    )

    if (contentScrollRef) {
      return (
        <div ref={contentScrollRef} className={lessonFlowClass}>
          {belowContent}
        </div>
      )
    }

    return (
      <div className="box-border min-w-0 bg-[var(--greyscale-0)]">
        {belowContent}
      </div>
    )
  }

  return (
    <div className="flex min-w-0 w-full flex-col">
      {loading && !lesson ? (
        <StudentPageLoader centered className="min-h-[40vh] flex-1" label="Loading lesson…" />
      ) : lesson ? (
        useContentColumnShell ? (
          <div ref={contentScrollRef} className={cn(lessonFlowClass)}>
            {renderContentColumnShell()}
          </div>
        ) : useLessonArticleShell ? (
          <div
            ref={contentScrollRef}
            className={cn(lessonFlowClass)}
          >
            <div className="box-border flex min-w-0 max-w-full flex-col gap-0 overflow-x-clip">
              {titleBlock}
              <div className={cn("flex w-full min-w-0 flex-col items-center", LESSON_BODY_PAD_CLASS)}>
                <div className={cn("min-w-0 w-full", LESSON_READING_COLUMN_CLASS)}>{lessonBody}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 w-full flex-col">
            {!hasVideo ? (
              <div className={cn("shrink-0 bg-transparent", contentPaddingClass, "pb-0")}>{titleBlock}</div>
            ) : null}
            <div
              ref={contentScrollRef}
              className={cn(
                lessonFlowClass,
                inLessonCard && hasVideo && "p-0",
                !hasVideo && "pt-0",
              )}
            >
              {lessonBody}
            </div>
          </div>
        )
      ) : (
        <p className="ds-body-sm ds-text-muted">Select a lesson to view its content.</p>
      )}
    </div>
  )
}

export { PrepCourseLessonPanel }
