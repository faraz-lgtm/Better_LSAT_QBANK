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
  shouldFlattenModuleSections,
} from "@/features/prep-course/lib/prep-course-format"
import { mergeActiveDrillAttemptBlindReview } from "@/features/prep-course/lib/merge-drill-blind-review-attempt"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { createPracticeApi } from "@/lib/api/practice"
import {
  createPrepCourseApi,
  type PrepCourse,
  type PrepCourseCurriculum,
  type PrepLesson,
  type PrepLessonActiveDrillAttempt,
  type PrepLessonLinkedQuestionRef,
} from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

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

  const prepCourseApi = useMemo(() => {
    try {
      return createPrepCourseApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

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
        questionId: linkedQuestionId,
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

  const isAdaptiveDrillLesson = lesson?.lesson_type === "adaptive_drill"
  const drillCompleted = Boolean(activeDrillAttempt)

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

  return (
    <StudentMain layout="locked">
      <div className="prep-course-lesson-shell flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-clip overflow-y-hidden">
        {error ? <p className="mb-4 shrink-0 text-xs text-[#95122b]">{error}</p> : null}

        <section className="prep-course-shell-card practice-session-card flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-clip overflow-y-hidden rounded-[16px] border border-[color:var(--greyscale-100)] bg-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
          <div
            className={`practice-session-body flex h-0 min-h-0 min-w-0 max-w-full flex-1 overflow-x-clip overflow-y-hidden ${showSidebar ? "lg:flex-row" : "flex-col"}`}
          >
            <div
              className={`flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-clip overflow-y-hidden ${
                lesson.lesson_type === "rep_work" ? "bg-[var(--greyscale-25)] p-0" : "p-6"
              } ${showSidebar ? "lg:border-r lg:border-[color:var(--greyscale-100)]" : ""}`}
            >
              <PrepCourseLessonPanel
                course={course}
                lesson={lesson}
                linkedQuestionRefs={linkedQuestionRefs}
                activeDrillAttempt={activeDrillAttempt}
                sectionSubtitle={sectionSubtitle}
                contentScrollRef={lessonContentRef}
                onReviewDrill={handleReviewDrill}
                onStartDrill={() => void handleStartDrill()}
                startingDrill={startingDrill}
                drillStartError={drillStartError}
              />
            </div>

            {showSidebar ? (
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
            ) : null}
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
            markCompleteDisabled={savingComplete || (isAdaptiveDrillLesson && !drillCompleted)}
            primaryAction={
              isAdaptiveDrillLesson && !drillCompleted
                ? {
                    label: startingDrill ? "Starting…" : "Start Drill",
                    onClick: () => void handleStartDrill(),
                    disabled: startingDrill,
                  }
                : null
            }
          />
        </section>
      </div>
    </StudentMain>
  )
}

export { PrepCourseLessonPage }
