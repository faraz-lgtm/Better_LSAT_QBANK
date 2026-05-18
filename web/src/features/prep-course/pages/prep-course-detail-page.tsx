import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"

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

function PrepCourseDetailPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>()
  const [course, setCourse] = useState<PrepCourse | null>(null)
  const [lessons, setLessons] = useState<PrepLesson[]>([])
  const [selectedLessonSlug, setSelectedLessonSlug] = useState<string | null>(null)
  const [completedLessonSlugs, setCompletedLessonSlugs] = useState<Set<string>>(() => new Set())
  const [activeLesson, setActiveLesson] = useState<PrepLesson | null>(null)
  const [linkedQuestionRefs, setLinkedQuestionRefs] = useState<PrepLessonLinkedQuestionRef[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lessonLoading, setLessonLoading] = useState(false)
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
    if (!courseSlug) return
    let alive = true
    async function load() {
      if (!prepCourseApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setLoading(false)
        }
        return
      }
      try {
        const data = await prepCourseApi.getCourse(courseSlug)
        if (!alive) return
        setCourse(data.course)
        setLessons(data.lessons)
        setSelectedLessonSlug(data.lessons[0]?.slug ?? null)
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load prep course")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [prepCourseApi, courseSlug])

  useEffect(() => {
    if (!courseSlug || !selectedLessonSlug || !prepCourseApi) return
    let alive = true
    async function loadLesson() {
      setLessonLoading(true)
      try {
        const data = await prepCourseApi.getLesson(courseSlug, selectedLessonSlug)
        if (!alive) return
        setActiveLesson(data.lesson)
        setLinkedQuestionRefs(data.linkedQuestionRefs)
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load lesson")
        setActiveLesson(null)
        setLinkedQuestionRefs([])
      } finally {
        if (alive) setLessonLoading(false)
      }
    }
    void loadLesson()
    return () => {
      alive = false
    }
  }, [prepCourseApi, courseSlug, selectedLessonSlug])

  function handleMarkComplete() {
    if (!selectedLessonSlug) return
    setCompletedLessonSlugs((prev) => {
      const next = new Set(prev)
      next.add(selectedLessonSlug)
      return next
    })
    const nextSlug = nextLessonSlug(lessons, selectedLessonSlug)
    if (nextSlug) setSelectedLessonSlug(nextSlug)
  }

  if (!courseSlug) {
    return <Navigate to="/app/prep-course" replace />
  }

  if (loading) {
    return (
      <StudentMain>
        <p className="ds-body-sm ds-text-muted">Loading prep course...</p>
      </StudentMain>
    )
  }

  if (!course || lessons.length === 0) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">{error ?? "No prep course content found."}</p>
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

        <section
          className={`grid gap-6 ${showSidebar ? "lg:grid-cols-[300px_1fr]" : "grid-cols-1"}`}
        >
          {showSidebar ? (
            <PrepCourseLessonSidebar
              course={course}
              lessons={lessons}
              activeLessonSlug={selectedLessonSlug ?? undefined}
              completedLessonSlugs={completedLessonSlugs}
              progressPercent={progressPercent}
              onSelectLesson={setSelectedLessonSlug}
            />
          ) : null}

          <PrepCourseLessonPanel
            course={course}
            lesson={activeLesson}
            linkedQuestionRefs={linkedQuestionRefs}
            loading={lessonLoading}
            courseContentHref={courseContentHref}
          />
        </section>
      </StudentMain>

      <PrepCourseLessonFooter
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar((v) => !v)}
        onMarkComplete={handleMarkComplete}
        markCompleteDisabled={!activeLesson || lessonLoading}
      />
    </>
  )
}

export { PrepCourseDetailPage }
