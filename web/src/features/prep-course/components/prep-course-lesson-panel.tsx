import type { RefObject } from "react"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import { PrepCourseLessonSectionHeader } from "@/features/prep-course/components/prep-course-lesson-section-header"
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
      <PrepCourseLessonSectionHeader
        title={lesson?.title ?? ""}
        moduleLessonLine={moduleLessonLine}
        subtitle={subtitle}
        rightMeta={rightMeta || null}
        lessonSequence={lessonSequence}
        lessonBookmarked={lessonBookmarked}
        onToggleLessonBookmark={onToggleLessonBookmark}
      />
    )

    if (embeddedInShell) {
      return (
        <header className={cn("flex w-full min-w-0 flex-col", LESSON_READING_COLUMN_CLASS)}>
          {headerContent}
        </header>
      )
    }

    return (
      <header className={cn("flex min-w-0 flex-col items-center", LESSON_HEADER_PAD_CLASS)}>
        <div className={cn("w-full min-w-0", LESSON_READING_COLUMN_CLASS)}>{headerContent}</div>
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
      <div className="box-border w-full shrink-0 bg-transparent">
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
        <div ref={contentScrollRef} className={cn("min-w-0 w-full bg-transparent", contentPaddingClass)}>
          {belowContent}
        </div>
      )
    }

    return (
      <div className="box-border min-w-0 bg-transparent">
        {belowContent}
      </div>
    )
  }

  if (lesson && hideHeaderForDrillResults) {
    return (
      <div
        ref={contentScrollRef}
        className="box-border min-w-0 w-full bg-transparent"
      >
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
          skipArticleShell
          sectionSubtitle={subtitle}
          lessonBookmarked={lessonBookmarked}
          onToggleLessonBookmark={onToggleLessonBookmark}
          drillResultsPart="full"
        />
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
