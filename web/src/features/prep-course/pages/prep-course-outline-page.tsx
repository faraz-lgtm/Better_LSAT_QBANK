import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PrepCourseLessonList } from "@/features/prep-course/components/prep-course-lesson-list"
import { StudentMain } from "@/features/student/components/student-main"
import { createPrepCourseApi, type PrepCourse, type PrepLesson } from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"

function PrepCourseOutlinePage() {
  const { courseSlug: courseSlugParam } = useParams<{ courseSlug: string }>()
  const courseSlug = courseSlugParam?.trim() ?? ""

  const [course, setCourse] = useState<PrepCourse | null>(null)
  const [lessons, setLessons] = useState<PrepLesson[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const prepCourseApi = useMemo(() => {
    try {
      return createPrepCourseApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!courseSlug) {
        if (alive) {
          setError("Missing course.")
          setLoading(false)
        }
        return
      }
      if (!prepCourseApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setLoading(false)
        }
        return
      }
      if (alive) {
        setLoading(true)
        setError(null)
      }
      try {
        const data = await prepCourseApi.getCourse(courseSlug)
        if (!alive) return
        setCourse(data.course)
        setLessons(data.lessons)
      } catch (e) {
        if (!alive) return
        setCourse(null)
        setLessons([])
        setError(e instanceof Error ? e.message : "Failed to load course")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [courseSlug, prepCourseApi])

  if (!courseSlug) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">Missing course.</p>
      </StudentMain>
    )
  }

  if (loading) {
    return (
      <StudentMain>
        <p className="ds-body-sm ds-text-muted">Loading course...</p>
      </StudentMain>
    )
  }

  if (error || !course) {
    return (
      <StudentMain>
        <Link
          to="/app/prep-course"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0d47a1] hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All courses
        </Link>
        <p className="text-sm text-[#95122b]">{error ?? "Course not found."}</p>
      </StudentMain>
    )
  }

  const firstLesson = lessons[0]

  return (
    <StudentMain className="max-w-[1280px]">
      <div className="mb-6">
        <Link
          to="/app/prep-course"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0d47a1] hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All courses
        </Link>
        <h1 className="text-[28px] font-bold leading-[1.3] text-[#062357]">{course.title}</h1>
        {course.description ? <p className="mt-3 max-w-3xl ds-body-sm text-[#666d80]">{course.description}</p> : null}
        {firstLesson ? (
          <div className="mt-6">
            <Button asChild className="rounded-xl bg-[#0d47a1]">
              <Link to={`/app/prep-course/${course.slug}/${firstLesson.slug}`}>Start first lesson</Link>
            </Button>
          </div>
        ) : null}
      </div>

      {lessons.length === 0 ? (
        <p className="ds-body-sm ds-text-muted">This course has no lessons yet.</p>
      ) : (
        <PrepCourseLessonList course={course} lessons={lessons} />
      )}
    </StudentMain>
  )
}

export { PrepCourseOutlinePage }
