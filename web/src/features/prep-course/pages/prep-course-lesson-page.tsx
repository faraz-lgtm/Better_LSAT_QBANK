import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import { PrepCourseLessonList } from "@/features/prep-course/components/prep-course-lesson-list"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { createPrepCourseApi, type PrepCourse, type PrepLesson } from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function PrepCourseLessonPage() {
  const { courseSlug = "prep-course", lessonSlug = "" } = useParams()
  const [course, setCourse] = useState<PrepCourse | null>(null)
  const [lesson, setLesson] = useState<PrepLesson | null>(null)
  const [lessons, setLessons] = useState<PrepLesson[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showLessons, setShowLessons] = useState(true)

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
      if (!prepCourseApi) {
        if (alive) setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
        return
      }
      try {
        const [courseData, lessonData] = await Promise.all([
          prepCourseApi.getCourse(courseSlug),
          prepCourseApi.getLesson(courseSlug, lessonSlug || "intro-logical-reasoning"),
        ])
        if (!alive) return
        setCourse(courseData.course)
        setLessons(courseData.lessons)
        setLesson(lessonData.lesson)
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load lesson")
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [courseSlug, lessonSlug, prepCourseApi])

  return (
    <>
      <StudentSubnavStrip
        crumbs={[
          { label: "Learn", href: "/app/prep-course" },
          { label: course?.title ?? "Prep Course", href: "/app/prep-course" },
          { label: lesson?.title ?? "Lesson" },
        ]}
      />
      <StudentMain>
        {error && <p className="mb-4 text-xs text-[#95122b]">{error}</p>}
        <section className="grid gap-4 lg:grid-cols-[288px_1fr]">
          {showLessons && course ? (
            <PrepCourseLessonList course={course} lessons={lessons} activeLessonSlug={lesson?.slug} />
          ) : (
            <div />
          )}

          <div className="space-y-4">
            {lesson ? <LessonContentRenderer lesson={lesson} /> : <div className="ds-body-sm ds-text-muted">Loading lesson...</div>}

            {lesson ? (
              <article className="rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between">
                  <h2 className="ds-heading-4 ds-text-heading">{lesson.title}</h2>
                  <button className="rounded-lg border border-[#dfe1e7] px-3 py-1 ds-body-xs font-semibold ds-text-accent">
                    Bookmark
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-4 ds-body-sm ds-text-muted">
                  <span>{course?.title}</span>
                  <span>{lesson.duration_minutes ?? 0} mins</span>
                  <span>
                    Lesson {lesson.sort_order} of {lessons.length || 1}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-[#45556c]">Your progress in this module</span>
                    <span className="font-semibold ds-text-accent">15%</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#dfe1e7]">
                    <div className="h-3 w-[15%] rounded-full bg-[#0d47a1]" />
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </section>
      </StudentMain>

      <footer className="border-t border-[#dfe1e7] bg-[#f2f7ff]">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={() => setShowLessons((value) => !value)}
            className="rounded-2xl border border-[#dfe1e7] bg-white px-4 py-2 ds-body-sm font-semibold tracking-[0.28px] ds-text-accent"
          >
            {showLessons ? "Hide Lesson" : "Show All Lesson"}
          </button>
          <div className="flex items-center gap-3">
            {course && lesson ? (
              <Link
                to={`/app/prep-course/${course.slug}/${lessons[Math.min(lessons.findIndex((x) => x.slug === lesson.slug) + 1, lessons.length - 1)]?.slug ?? lesson.slug}`}
                className="rounded-2xl bg-[#0d47a1] px-4 py-2 ds-body-sm font-semibold tracking-[0.28px] text-white"
              >
                Mark Complete & Continue
              </Link>
            ) : null}
          </div>
        </div>
      </footer>
    </>
  )
}

export { PrepCourseLessonPage }
