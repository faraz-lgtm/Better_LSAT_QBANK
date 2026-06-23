import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"

import { PrepCourseLessonFooter } from "@/features/prep-course/components/prep-course-lesson-footer"
import { PrepCourseLessonPanel } from "@/features/prep-course/components/prep-course-lesson-panel"
import { PrepCourseLessonSidebar } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  findLessonSectionContext,
  formatDurationShort,
  formatRemainingHoursLabel,
  incompleteDurationMinutes,
  lessonProgressPercent,
  nextLessonSlug,
  normalizeCurriculum,
  prevLessonSlug,
  resolveDrillLessonType,
  shouldFlattenModuleSections,
  isResolvedPrepCourseDrillLesson,
} from "@/features/prep-course/lib/prep-course-format"
import { mergeActiveDrillAttemptBlindReview } from "@/features/prep-course/lib/merge-drill-blind-review-attempt"
import { usePrepCourseBookmarks } from "@/features/prep-course/lib/use-prep-course-bookmarks"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { createPracticeApi } from "@/lib/api/practice"
import {
  createPrepCourseApi,
  type PrepCourse,
  type PrepCourseBookmarks,
  type PrepCourseCurriculum,
  type PrepLesson,
  type PrepLessonActiveDrillAttempt,
  type PrepLessonLinkedQuestionRef,
} from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"
import { cn } from "@/lib/utils"

function PrepCourseLessonPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { courseSlug: courseSlugParam, lessonSlug: lessonSlugParam } = useParams<{
    courseSlug: string
    lessonSlug: string
  }>()
  const courseSlug = courseSlugParam?.trim() ?? ""
  const lessonSlug = lessonSlugParam?.trim() ?? ""
  const paramsValid = courseSlug.length > 0 && lessonSlug.length > 0
  const [course, setCourse] = useState<PrepCourse | null>(null)
  const [curriculum, setCurriculum] = useState<PrepCourseCurriculum>({ modules: [] })
  const [lesson, setLesson] = useState<PrepLesson | null>(null)
  const [linkedQuestionRefs, setLinkedQuestionRefs] = useState<PrepLessonLinkedQuestionRef[]>([])
  const [activeDrillAttempt, setActiveDrillAttempt] = useState<PrepLessonActiveDrillAttempt | null>(null)
  const [lessons, setLessons] = useState<PrepLesson[]>([])
  const [completedLessonSlugs, setCompletedLessonSlugs] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingComplete, setSavingComplete] = useState(false)
  const [startingDrill, setStartingDrill] = useState(false)
  const [drillStartError, setDrillStartError] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const lessonContentRef = useRef<HTMLDivElement>(null)
  const [initialBookmarks, setInitialBookmarks] = useState<PrepCourseBookmarks | null>(null)

  const prepCourseApi = useMemo(() => {
    try {
      return createPrepCourseApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const { isLessonBookmarked, setLessonBookmarked } = usePrepCourseBookmarks({
    courseId: course?.id,
    courseSlug,
    prepCourseApi,
    initialBookmarks,
  })

  const practiceApi = useMemo(() => {
    try {
      return createPracticeApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const lessonContext = useMemo(
    () => (lesson ? findLessonSectionContext(curriculum, lesson.slug) : null),
    [curriculum, lesson],
  )

  const sidebarLessons = useMemo(
    () => lessonContext?.section.lessons ?? lessons,
    [lessonContext, lessons],
  )

  const sectionProgressPercent = useMemo(() => {
    const total = sidebarLessons.length
    const completed = countCompletedLessons(sidebarLessons, completedLessonSlugs)
    return lessonProgressPercent(completed, total)
  }, [completedLessonSlugs, sidebarLessons])

  const sectionTitle = useMemo(() => {
    if (lessonContext) {
      const { module, section } = lessonContext
      if (shouldFlattenModuleSections(module) && section.title === "General") {
        return module.title
      }
      return section.title
    }
    return course?.title ?? "Lessons"
  }, [course?.title, lessonContext])

  const sectionRemainingLabel = useMemo(() => {
    const remaining = incompleteDurationMinutes(sidebarLessons, completedLessonSlugs)
    return formatRemainingHoursLabel(remaining).replace(" left", " left in section")
  }, [completedLessonSlugs, sidebarLessons])

  const sectionSubtitle = useMemo(() => {
    if (!lesson) return null
    const duration = formatDurationShort(lesson.duration_minutes)
    return `${sectionTitle} • ${duration}`
  }, [lesson, sectionTitle])

  const prevSlug = useMemo(
    () => (lesson ? prevLessonSlug(sidebarLessons, lesson.slug) : null),
    [lesson, sidebarLessons],
  )

  const nextSlug = useMemo(
    () => (lesson ? nextLessonSlug(sidebarLessons, lesson.slug) : null),
    [lesson, sidebarLessons],
  )

  useEffect(() => {
    let alive = true
    async function load() {
      if (!paramsValid) return
      if (!prepCourseApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setLoading(false)
        }
        return
      }
      if (!lessonSlug) {
        if (alive) setLoading(false)
        return
      }
      if (alive) {
        setLoading(true)
        setError(null)
        setCourse(null)
        setLessons([])
        setLesson(null)
      }
      try {
        const [courseData, lessonData] = await Promise.all([
          prepCourseApi.getCourse(courseSlug),
          prepCourseApi.getLesson(courseSlug, lessonSlug),
        ])
        if (!alive) return
        setCourse(courseData.course)
        setLessons(courseData.lessons)
        setCurriculum(
          normalizeCurriculum(courseData.curriculum, courseData.lessons, courseData.course.id),
        )
        setCompletedLessonSlugs(new Set(courseData.completedLessonSlugs ?? []))
        setInitialBookmarks(lessonData.bookmarks ?? courseData.bookmarks ?? { moduleIds: [], lessonSlugs: [] })
        setLesson(lessonData.lesson)
        setLinkedQuestionRefs(lessonData.linkedQuestionRefs ?? [])
        const mergedAttempt = await mergeActiveDrillAttemptBlindReview(lessonData.activeDrillAttempt ?? null, {
          lessonId: lessonData.lesson.id,
          getDrillSession: practiceApi
            ? (id) => practiceApi.getDrillSession(id).then((data) => ({ session: data.session }))
            : undefined,
        })
        setActiveDrillAttempt(mergedAttempt)
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load lesson")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [paramsValid, courseSlug, lessonSlug, prepCourseApi, practiceApi, location.key])

  useEffect(() => {
    setDrillStartError(null)
  }, [lessonSlug])

  const handleReviewDrill = useCallback(() => {
    lessonContentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const handleStartDrill = useCallback(async () => {
    if (!lesson || !course || startingDrill) return
    if (!practiceApi) {
      const msg = "Practice API is unavailable. Check Supabase env configuration."
      setDrillStartError(msg)
      setError(msg)
      return
    }
    setStartingDrill(true)
    setDrillStartError(null)
    setError(null)
    try {
      const linkedQuestionId = linkedQuestionRefs[0]?.question_id ?? null
      const { session } = await practiceApi.startLessonDrill({
        lessonId: lesson.id,
        ...(resolveDrillLessonType(lesson) === "active_drill" && linkedQuestionId
          ? { questionId: linkedQuestionId }
          : {}),
      })
      const returnTo = `/app/prep-course/${course.slug}/${lesson.slug}`
      navigate(`/app/practice/drills/session/${session.id}?returnTo=${encodeURIComponent(returnTo)}`)
    } catch (e) {
      const msg = e instanceof Error ? formatSupabaseCallError(e) : "Failed to start drill"
      setDrillStartError(msg)
      setError(msg)
    } finally {
      setStartingDrill(false)
    }
  }, [course, lesson, linkedQuestionRefs, navigate, practiceApi, startingDrill])

  if (!paramsValid) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">Invalid lesson link. A course and lesson slug are required in the URL.</p>
      </StudentMain>
    )
  }

  async function handleMarkComplete() {
    if (!lesson || !course || !prepCourseApi || savingComplete) return
    setSavingComplete(true)
    setError(null)
    try {
      const { completedLessonSlugs: slugs } = await prepCourseApi.completeLesson(course.slug, lesson.slug)
      setCompletedLessonSlugs(new Set(slugs))
      const nextSlug = nextLessonSlug(lessons, lesson.slug)
      if (nextSlug) {
        navigate(`/app/prep-course/${course.slug}/${nextSlug}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save lesson progress")
    } finally {
      setSavingComplete(false)
    }
  }

  if (loading) {
    return (
      <StudentMain>
        <StudentPageLoader centered label="Loading lesson…" />
      </StudentMain>
    )
  }

  if (!course || !lesson) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">{error ?? "Lesson not found."}</p>
        <Link to="/app/prep-course" className="mt-3 inline-block text-sm font-medium text-[#0d47a1]">
          Back to courses
        </Link>
      </StudentMain>
    )
  }

  const useSplitDrillLayout = Boolean(
    activeDrillAttempt && showSidebar && isResolvedPrepCourseDrillLesson(lesson),
  )

  const lessonPanelProps = {
    course,
    lesson,
    linkedQuestionRefs,
    activeDrillAttempt,
    sectionSubtitle,
    onReviewDrill: handleReviewDrill,
    onStartDrill: () => void handleStartDrill(),
    startingDrill,
    drillStartError,
    lessonBookmarked: isLessonBookmarked(lesson.slug),
    onToggleLessonBookmark: (next: boolean) => setLessonBookmarked(lesson.slug, next),
  }

  return (
    <StudentMain layout="locked" contentClassName="pt-0 pb-[24px]">
      <div className="prep-course-lesson-shell flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-clip overflow-y-hidden">
        {error ? <p className="mb-4 shrink-0 text-xs text-[#95122b]">{error}</p> : null}

        <section className="prep-course-shell-card practice-session-card flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              "practice-session-body flex h-0 min-h-0 min-w-0 max-w-full flex-1 overflow-hidden",
              useSplitDrillLayout
                ? "flex-col"
                : showSidebar
                  ? "practice-session-body--with-sidebar flex-row items-stretch gap-6"
                  : "flex-col",
            )}
          >
            {useSplitDrillLayout ? (
              <div
                ref={lessonContentRef}
                className="practice-session-pane practice-session-scroll-hidden flex min-h-0 flex-1 flex-col gap-6 overflow-x-clip overflow-y-auto overscroll-contain bg-[var(--primary-0)] [overflow-anchor:none]"
              >
                <PrepCourseLessonPanel {...lessonPanelProps} drillResultsPart="cards" sidebarAdjacent={false} />
                <div className="flex min-w-0 gap-6 px-6 pb-6">
                  <div className="min-w-0 flex-1">
                    <PrepCourseLessonPanel
                      {...lessonPanelProps}
                      drillResultsPart="below"
                      sidebarAdjacent
                    />
                  </div>
                  <div className="sticky top-6 flex w-[320px] shrink-0 self-start flex-col overflow-hidden">
                    <div className="flex max-h-[calc(100svh-var(--nav-shell-height)-180px)] min-h-0 flex-col overflow-hidden">
                      <PrepCourseLessonSidebar
                        lessons={sidebarLessons}
                        activeLessonSlug={lesson.slug}
                        completedLessonSlugs={completedLessonSlugs}
                        progressPercent={sectionProgressPercent}
                        sectionTitle={sectionTitle}
                        sectionSubtitle={sectionRemainingLabel}
                        onSelectLesson={(slug) => navigate(`/app/prep-course/${course.slug}/${slug}`)}
                        onClose={() => setShowSidebar(false)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex h-full min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden">
                  <PrepCourseLessonPanel
                    {...lessonPanelProps}
                    contentScrollRef={lessonContentRef}
                    sidebarAdjacent={showSidebar}
                  />
                </div>

                {showSidebar ? (
                  <div className="flex h-full min-h-0 w-[320px] shrink-0 flex-col self-stretch overflow-hidden">
                    <div className="practice-session-pane practice-session-scroll-hidden flex h-full min-h-0 flex-1 flex-col overflow-hidden pt-6 pb-6 pr-6 pl-0">
                      <PrepCourseLessonSidebar
                        lessons={sidebarLessons}
                        activeLessonSlug={lesson.slug}
                        completedLessonSlugs={completedLessonSlugs}
                        progressPercent={sectionProgressPercent}
                        sectionTitle={sectionTitle}
                        sectionSubtitle={sectionRemainingLabel}
                        onSelectLesson={(slug) => navigate(`/app/prep-course/${course.slug}/${slug}`)}
                        onClose={() => setShowSidebar(false)}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <PrepCourseLessonFooter
            showSidebar={showSidebar}
            onToggleSidebar={() => setShowSidebar((v) => !v)}
            onPrev={() => {
              if (prevSlug) navigate(`/app/prep-course/${course.slug}/${prevSlug}`)
            }}
            onNext={() => {
              if (nextSlug) navigate(`/app/prep-course/${course.slug}/${nextSlug}`)
            }}
            prevDisabled={!prevSlug}
            nextDisabled={!nextSlug}
            onMarkComplete={() => void handleMarkComplete()}
            markCompleteDisabled={savingComplete}
          />
        </section>
      </div>
    </StudentMain>
  )
}

export { PrepCourseLessonPage }
