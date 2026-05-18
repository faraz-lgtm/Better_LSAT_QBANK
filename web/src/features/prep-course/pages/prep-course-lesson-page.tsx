import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { PrepCourseLessonFooter } from "@/features/prep-course/components/prep-course-lesson-footer"
import { PrepCourseLessonPanel } from "@/features/prep-course/components/prep-course-lesson-panel"
import { PrepCourseLessonSidebar } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import { nextLessonSlug } from "@/features/prep-course/lib/prep-course-format"
import { StudentMain } from "@/features/student/components/student-main"
import {
  createPrepCourseApi,
  type PrepCourse,
  type PrepLesson,
  type PrepLessonLinkedQuestionRef,
} from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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
  const [lesson, setLesson] = useState<PrepLesson | null>(null)
  const [linkedQuestionRefs, setLinkedQuestionRefs] = useState<PrepLessonLinkedQuestionRef[]>([])
  const [lessons, setLessons] = useState<PrepLesson[]>([])
  const [completedLessonSlugs, setCompletedLessonSlugs] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)

  const prepCourseApi = useMemo(() => {
    try {
      return createPrepCourseApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const progressPercent = useMemo(() => {
    if (lessons.length === 0) return 0
    return Math.round((completedLessonSlugs.size / lessons.length) * 100)
  }, [completedLessonSlugs.size, lessons.length])

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
        setLesson(lessonData.lesson)
        setLinkedQuestionRefs(lessonData.linkedQuestionRefs)
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

  if (!paramsValid) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">Invalid lesson link. A course and lesson slug are required in the URL.</p>
      </StudentMain>
    )
  }

  function handleMarkComplete() {
    if (!lesson) return
    setCompletedLessonSlugs((prev) => {
      const next = new Set(prev)
      next.add(lesson.slug)
      return next
    })
    const nextSlug = nextLessonSlug(lessons, lesson.slug)
    if (nextSlug && course) {
      navigate(`/app/prep-course/${course.slug}/${nextSlug}`)
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

        <section className={`grid gap-6 ${showSidebar ? "lg:grid-cols-[300px_1fr]" : "grid-cols-1"}`}>
          {showSidebar ? (
            <PrepCourseLessonSidebar
              course={course}
              lessons={lessons}
              activeLessonSlug={lesson.slug}
              completedLessonSlugs={completedLessonSlugs}
              progressPercent={progressPercent}
              onSelectLesson={(slug) => navigate(`/app/prep-course/${course.slug}/${slug}`)}
            />
          ) : null}

          <PrepCourseLessonPanel
            course={course}
            lesson={lesson}
            linkedQuestionRefs={linkedQuestionRefs}
            courseContentHref={courseContentHref}
          />
        </section>
      </StudentMain>

      <PrepCourseLessonFooter
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar((v) => !v)}
        onMarkComplete={handleMarkComplete}
      />
    </>
  )
}

export { PrepCourseLessonPage }
