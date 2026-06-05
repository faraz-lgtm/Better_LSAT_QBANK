import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

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
  shouldFlattenModuleSections,
} from "@/features/prep-course/lib/prep-course-format"
import { StudentMain } from "@/features/student/components/student-main"
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

  const breadcrumbTopic = useMemo(() => {
    if (lessonContext) {
      const { module, section } = lessonContext
      if (shouldFlattenModuleSections(module) && section.title === "General") {
        return module.title
      }
      return section.title
    }
    return lesson?.title ?? "Lesson"
  }, [lesson?.title, lessonContext])

  const sectionSubtitle = useMemo(() => {
    if (!lesson) return null
    const duration = formatDurationShort(lesson.duration_minutes)
    return `${sectionTitle} • ${duration}`
  }, [lesson, sectionTitle])

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
        setActiveDrillAttempt(lessonData.activeDrillAttempt ?? null)
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
  }, [paramsValid, courseSlug, lessonSlug, prepCourseApi])

  useEffect(() => {
    setDrillStartError(null)
  }, [lessonSlug])

  const handleReviewDrill = useCallback(() => {
    lessonContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  if (!paramsValid) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">Invalid lesson link. A course and lesson slug are required in the URL.</p>
      </StudentMain>
    )
  }

  const isAdaptiveDrillLesson = lesson?.lesson_type === "adaptive_drill"
  const drillCompleted = Boolean(activeDrillAttempt)

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
        <p className="ds-body-sm ds-text-muted">Loading lesson...</p>
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

  const courseContentHref = `/app/prep-course/${course.slug}`

  return (
    <>
      <StudentMain className="max-w-[1280px] pb-24 pt-0">
        {error ? <p className="mb-4 text-xs text-[#95122b]">{error}</p> : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe1e7] pb-4">
          <h1 className="text-xl font-bold tracking-[0.02em] text-[#062357]">{course.title}</h1>
          <nav
            className="flex flex-wrap items-center gap-1.5 text-sm font-medium tracking-[0.02em] text-[#666d80]"
            aria-label="Breadcrumb"
          >
            <span>Learn</span>
            <span className="text-[#c5cee0]">/</span>
            <Link to="/app/prep-course" className="font-semibold text-[#0d47a1] hover:underline">
              Prep Course
            </Link>
            <span className="text-[#c5cee0]">/</span>
            <Link
              to={courseContentHref}
              state={{ activeLessonSlug: lesson.slug }}
              className="font-semibold text-[#0d47a1] hover:underline"
            >
              Course Content
            </Link>
            <span className="text-[#c5cee0]">/</span>
            <span className="font-semibold text-[#062357]">{breadcrumbTopic}</span>
          </nav>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
          <div className={`flex flex-col ${showSidebar ? "lg:flex-row" : ""}`}>
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

            <div ref={lessonContentRef} className="min-w-0 flex-1 border-[#dfe1e7] p-6 lg:border-l">
              <PrepCourseLessonPanel
                course={course}
                lesson={lesson}
                linkedQuestionRefs={linkedQuestionRefs}
                activeDrillAttempt={activeDrillAttempt}
                sectionSubtitle={sectionSubtitle}
                onReviewDrill={handleReviewDrill}
                onStartDrill={() => void handleStartDrill()}
                startingDrill={startingDrill}
                drillStartError={drillStartError}
              />
            </div>
          </div>
        </section>
      </StudentMain>

      <PrepCourseLessonFooter
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar((v) => !v)}
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
    </>
  )
}

export { PrepCourseLessonPage }
