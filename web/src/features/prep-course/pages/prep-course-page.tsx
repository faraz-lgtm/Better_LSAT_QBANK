import { useEffect, useMemo, useState } from "react"
import { Link, Navigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { createPrepCourseApi, type PrepCourse, type PrepLesson } from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { BookOpen, Bookmark, ChevronDown, Clock3, Download, LibraryBig, NotebookTabs } from "lucide-react"

type ModuleMeta = {
  title: string
  lessonsLabel: string
  statusLabel?: string
  progress: number
}

const moduleMeta: ModuleMeta[] = [
  { title: "The Kickoff", lessonsLabel: "62 Lessons", statusLabel: "Not Started", progress: 0 },
  { title: "The Anatomy of an Argument", lessonsLabel: "58 Lessons", progress: 80 },
  { title: "Practical Grammar", lessonsLabel: "72 Lessons", progress: 60 },
  { title: "The Logic of Sets & Conditions", lessonsLabel: "12 Lessons", statusLabel: "Not Started", progress: 0 },
  { title: "Everything Causation", lessonsLabel: "12 Lessons", statusLabel: "Not Started", progress: 0 },
  { title: "Argumentative Flaws (The Finale)", lessonsLabel: "23 Lessons", statusLabel: "Not Started", progress: 0 },
]

function ProgressRing({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const angle = (pct / 100) * 360
  return (
    <div className="relative flex size-9 items-center justify-center rounded-full bg-white">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#0d47a1 ${angle}deg, #dfe1e7 ${angle}deg)`,
        }}
      />
      <div className="absolute inset-[3px] rounded-full bg-white" />
      <span className="relative text-[10px] font-bold leading-[1.5] tracking-[0.02em] text-[#666d80]">{pct}%</span>
    </div>
  )
}

function StatItem({ icon: Icon, label }: { icon: typeof BookOpen; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <Icon className="size-4 text-[#666d80]" />
      <span className="text-xs font-medium tracking-[0.02em] text-[#666d80]">{label}</span>
    </div>
  )
}

function PrepCoursePage() {
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
      if (!prepCourseApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setLoading(false)
        }
        return
      }
      try {
        const data = await prepCourseApi.getCourse("prep-course")
        if (!alive) return
        setCourse(data.course)
        setLessons(data.lessons)
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
  }, [prepCourseApi])

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
      </StudentMain>
    )
  }

  const firstLesson = lessons[0]
  if (!firstLesson) return <Navigate to="/app" replace />
  const rightColumnLessons = lessons.slice(1, 5)

  return (
    <StudentMain className="max-w-[1280px] pt-0">
      <section className="mb-6 border-b border-[#dfe1e7] pb-4 pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold leading-[1.3] text-[#062357]">Prep Course</h1>
          <div className="flex items-center gap-1 text-xs font-medium tracking-[0.02em] text-[#666d80]">
            <span>Learn</span>
            <span className="text-[#dfe1e7]">/</span>
            <span>Prep Course</span>
            <span className="text-[#dfe1e7]">/</span>
            <span className="font-semibold text-[#0d47a1]">Course Content</span>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dfe1e7]">
        <div className="bg-[#f6f8fa] p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-4xl font-bold leading-[1.3] text-[#062357]">Course Content</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <StatItem icon={BookOpen} label="6 Modules" />
                <span className="h-5 w-px bg-[#dfe1e7]" />
                <StatItem icon={LibraryBig} label="24 Sections" />
                <span className="h-5 w-px bg-[#dfe1e7]" />
                <StatItem icon={NotebookTabs} label="369 Lessons" />
                <span className="h-5 w-px bg-[#dfe1e7]" />
                <StatItem icon={Clock3} label="78 hours total lenght" />
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.02em] text-[#666d80]">
                <Bookmark className="size-4" />
                <span>Show All Bookmark</span>
                <button
                  type="button"
                  aria-label="Show all bookmark"
                  className="relative h-5 w-9 rounded-full border border-[#dfe1e7] bg-white p-[2px]"
                >
                  <span className="block size-4 rounded-full bg-[#dfe1e7]" />
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-xl border-[#dfe1e7] bg-white px-4 text-xs font-semibold tracking-[0.02em] text-[#0d47a1]"
              >
                <Download className="mr-2 size-4" />
                Expand All
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[272px_1fr] bg-white">
          <aside className="border-r border-[#dfe1e7] bg-[#f3f7ff] py-6 pr-4">
            <div className="px-3 pb-2 text-[28px] font-bold leading-[1.35] text-[#082c6b]">Course Modules</div>
            <div className="mt-1 space-y-1">
              {moduleMeta.map((module, idx) => {
                const isActive = idx === 1
                return (
                  <div
                    key={module.title}
                    className={`flex h-[62px] items-center gap-3 rounded-r-2xl px-4 ${
                      isActive ? "bg-[#edf3ff]" : "bg-transparent"
                    }`}
                  >
                    <ProgressRing value={module.progress} />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-xs tracking-[0.02em]">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#062357]">{module.title}</p>
                        <p className="text-[#6d78b6]">{module.lessonsLabel}</p>
                      </div>
                      {module.statusLabel ? <p className="text-right text-[#6d78b6]">{module.statusLabel}</p> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>

          <section>
            <header className="border-b border-[#dfe1e7] bg-[#f3f7ff] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <ProgressRing value={80} />
                    <h3 className="text-[34px] font-bold leading-[1.3] text-[#062357]">{firstLesson.title}</h3>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 text-xs font-medium tracking-[0.02em] text-[#666d80]">
                    <Bookmark className="size-4" />
                    <span>Bookmark</span>
                    <button
                      type="button"
                      aria-label="Bookmark section"
                      className="relative h-5 w-9 rounded-full border border-[#dfe1e7] bg-white p-[2px]"
                    >
                      <span className="block size-4 rounded-full bg-[#dfe1e7]" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right text-xs tracking-[0.02em]">
                    <p className="text-[#666d80]">
                      Total Time: <span className="font-semibold">90 hrs</span>
                    </p>
                    <p className="text-[#0d47a1]">45 of 369 Lessons completed • About 78 hrs left</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl border-[#dfe1e7] bg-white px-4 text-xs font-semibold tracking-[0.02em] text-[#0d47a1]"
                  >
                    <Download className="mr-2 size-4" />
                    Expand this Sections
                  </Button>
                </div>
              </div>
            </header>

            <div className="bg-[#f6f8fa]">
              {rightColumnLessons.map((lesson, idx) => (
                <Link
                  key={lesson.id}
                  to={`/app/prep-course/${course.slug}/${lesson.slug}`}
                  className="flex h-[100px] items-center gap-3 border-b border-[#dfe1e7] px-6 transition-colors hover:bg-[#eef3fb]"
                >
                  <ProgressRing value={[0, 20, 10, 0][idx] ?? 0} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[18px] font-bold leading-[1.35] text-[#062357]">{lesson.title}</p>
                  </div>
                  <div className="text-right text-xs tracking-[0.02em]">
                    <p className="text-[#666d80]">
                      Total Time: <span className="font-semibold">{lesson.duration_minutes ?? 0}mins</span>
                    </p>
                    <p className="text-[#818898]">About {Math.max((lesson.duration_minutes ?? 60) - 10, 10)} minutes left in section</p>
                  </div>
                  <ChevronDown className="size-5 text-[#666d80]" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      {error && <p className="mt-4 text-xs text-[#95122b]">{error}</p>}
    </StudentMain>
  )
}

export { PrepCoursePage }
