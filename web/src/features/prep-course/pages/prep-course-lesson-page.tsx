import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"

import { useStudentEntitlementOptional } from "@/features/app-shell/student-entitlement-context"
import { useGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { PrepCourseLessonFooter } from "@/features/prep-course/components/prep-course-lesson-footer"
import { PrepCourseLessonPanel } from "@/features/prep-course/components/prep-course-lesson-panel"
import { PrepCourseLessonSidebar } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  findLessonSectionContext,
  formatRemainingHoursLabel,
  incompleteDurationMinutes,
  lessonProgressPercent,
  nextLessonSlug,
  normalizeCurriculum,
  prepCourseDisplayTitle,
  prevLessonSlug,
  resolveDrillLessonType,
  shouldFlattenModuleSections,
  isResolvedPrepCourseDrillLesson,
} from "@/features/prep-course/lib/prep-course-format"
import { mergeActiveDrillAttemptBlindReview } from "@/features/prep-course/lib/merge-drill-blind-review-attempt"
import { isPrepCourseComingSoonSlug } from "@/features/prep-course/lib/prep-course-nav"
import { isPrepCourseLessonLockedForFreePlan, shouldLimitFreePrepCourseAccess } from "@/features/prep-course/lib/prep-course-free-access"
import { usePrepCourseBookmarks } from "@/features/prep-course/lib/use-prep-course-bookmarks"
import { PrepCourseComingSoonPage } from "@/features/prep-course/pages/prep-course-coming-soon-page"
import { StudentMain } from "@/features/student/components/student-main"
import { STUDENT_PAGE_CONTAINER_CLASS } from "@/features/student/components/student-page-container"
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

const PREP_COURSE_LESSON_CONTENT_CARD_CLASS =
  "flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden rounded-t-[14px] rounded-b-none border border-b-0 border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"

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
  const comingSoon = isPrepCourseComingSoonSlug(courseSlug)
  const entitlement = useStudentEntitlementOptional()
  const premiumAccount = useGuestPremiumAccount()
  const { openLockedContentModal } = useGuestPricingModal()
  const limitFreeAccess = shouldLimitFreePrepCourseAccess({
    hasActiveCore: entitlement?.entitlement?.hasActiveCore,
    accessState: entitlement?.entitlement?.accessState ?? null,
    hasGuestPremiumAccount: Boolean(premiumAccount),
  })
  const entitlementReady = !entitlement?.loading
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
  const [showSidebar, setShowSidebar] = useState(false)
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
    return course ? prepCourseDisplayTitle(course) : "Lessons"
  }, [course, lessonContext])

  const sectionRemainingLabel = useMemo(() => {
    const remaining = incompleteDurationMinutes(sidebarLessons, completedLessonSlugs)
    return formatRemainingHoursLabel(remaining).replace(" left", " left in section")
  }, [completedLessonSlugs, sidebarLessons])

  const sectionSubtitle = useMemo(() => {
    if (!lesson) return null
    return sectionTitle
  }, [lesson, sectionTitle])

  const lessonSequence = useMemo(() => {
    if (!lesson) return null
    const total = sidebarLessons.length
    if (total <= 0) return null
    const idx = sidebarLessons.findIndex((row) => row.slug === lesson.slug)
    const current = idx >= 0 ? idx + 1 : 1
    return { current, total }
  }, [lesson, sidebarLessons])

  const moduleLessonLine = useMemo(() => {
    if (!lessonContext || !lessonSequence) return null
    const moduleNumber = curriculum.modules.findIndex((mod) => mod.id === lessonContext.module.id) + 1
    const safeModuleNumber = moduleNumber > 0 ? moduleNumber : 1
    return `Module ${safeModuleNumber} · Lesson ${lessonSequence.current} of ${lessonSequence.total}`
  }, [curriculum.modules, lessonContext, lessonSequence])

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
      if (comingSoon) {
        if (alive) setLoading(false)
        return
      }
      if (!paramsValid) return
      if (!entitlementReady) return
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
      let redirected = false
      try {
        const courseData = await prepCourseApi.getCourse(courseSlug)
        if (!alive) return
        const normalized = normalizeCurriculum(courseData.curriculum, courseData.lessons, courseData.course.id)
        if (isPrepCourseLessonLockedForFreePlan(normalized, courseSlug, lessonSlug, limitFreeAccess)) {
          redirected = true
          openLockedContentModal()
          navigate(`/app/prep-course/${courseSlug}`, { replace: true })
          return
        }
        const lessonData = await prepCourseApi.getLesson(courseSlug, lessonSlug)
        if (!alive) return
        setCourse(courseData.course)
        setLessons(courseData.lessons)
        setCurriculum(normalized)
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
        if (alive && !redirected) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [comingSoon, paramsValid, courseSlug, lessonSlug, prepCourseApi, practiceApi, location.key, entitlementReady, limitFreeAccess, navigate, openLockedContentModal])

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

  if (comingSoon) {
    return <PrepCourseComingSoonPage />
  }

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
      if (nextSlug && isPrepCourseLessonLockedForFreePlan(curriculum, course.slug, nextSlug, limitFreeAccess)) {
        openLockedContentModal()
        return
      }
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
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading lesson…" />
      </StudentMain>
    )
  }

  if (!course || !lesson) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">{error ?? "Lesson not found."}</p>
        <Link to="/app/prep-course" className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">
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
    moduleLessonLine,
    lessonSequence,
    onReviewDrill: handleReviewDrill,
    onStartDrill: () => void handleStartDrill(),
    startingDrill,
    drillStartError,
    lessonBookmarked: isLessonBookmarked(lesson.slug),
    onToggleLessonBookmark: (next: boolean) => setLessonBookmarked(lesson.slug, next),
  }

  return (
    <StudentMain layout="locked" fullBleed contentClassName="bg-[var(--background)] px-0 pb-0">
      <div className="prep-course-lesson-shell flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-y-hidden bg-[var(--background)]">
        {error ? <p className="mb-4 shrink-0 text-xs text-[#95122b]">{error}</p> : null}

        <section className="prep-course-lesson-frame practice-session-card flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              "practice-session-body flex h-0 min-h-0 min-w-0 max-w-full flex-1 overflow-hidden bg-[var(--background)] px-[24px] pb-0",
              useSplitDrillLayout
                ? "flex-col"
                : showSidebar
                  ? "practice-session-body--with-sidebar mx-auto w-full max-w-[calc(1168px+320px+24px)] flex-row items-stretch justify-center gap-6"
                  : "flex-col items-center",
            )}
          >
            {useSplitDrillLayout ? (
              <div
                ref={lessonContentRef}
                className="practice-session-pane practice-session-scroll-hidden flex min-h-0 flex-1 flex-col gap-6 overflow-x-clip overflow-y-auto overscroll-contain bg-[var(--background)] [overflow-anchor:none]"
              >
                <div className={cn(STUDENT_PAGE_CONTAINER_CLASS, "w-full")}>
                  <PrepCourseLessonPanel {...lessonPanelProps} drillResultsPart="cards" sidebarAdjacent={false} />
                </div>
                <div className="mx-auto flex w-full min-w-0 max-w-[calc(1168px+320px+24px)] gap-6">
                  <div className={cn(STUDENT_PAGE_CONTAINER_CLASS, "min-w-0 flex-1")}>
                    <PrepCourseLessonPanel
                      {...lessonPanelProps}
                      drillResultsPart="below"
                      sidebarAdjacent
                    />
                  </div>
                  <div className="sticky top-0 flex w-[320px] shrink-0 self-start flex-col overflow-hidden">
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
                <div
                  className={cn(
                    PREP_COURSE_LESSON_CONTENT_CARD_CLASS,
                    STUDENT_PAGE_CONTAINER_CLASS,
                    "w-full flex-1",
                    !showSidebar && "mx-auto",
                  )}
                >
                  <PrepCourseLessonPanel
                    {...lessonPanelProps}
                    contentScrollRef={lessonContentRef}
                    inLessonCard
                  />
                </div>

                {showSidebar ? (
                  <div className="flex h-full min-h-0 w-[320px] shrink-0 flex-col self-stretch overflow-hidden">
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
                ) : null}
              </>
            )}
          </div>
        </section>

        <PrepCourseLessonFooter
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar((v) => !v)}
          onBackToCourseModule={() =>
            navigate(`/app/prep-course/${course.slug}`, { state: { activeLessonSlug: lesson.slug } })
          }
          onPrev={() => {
            if (prevSlug) navigate(`/app/prep-course/${course.slug}/${prevSlug}`)
          }}
          onNext={() => {
            if (!nextSlug) return
            if (isPrepCourseLessonLockedForFreePlan(curriculum, course.slug, nextSlug, limitFreeAccess)) {
              openLockedContentModal()
              return
            }
            navigate(`/app/prep-course/${course.slug}/${nextSlug}`)
          }}
          prevDisabled={!prevSlug}
          nextDisabled={!nextSlug}
          onMarkComplete={() => void handleMarkComplete()}
          markCompleteDisabled={savingComplete}
        />
      </div>
    </StudentMain>
  )
}

export { PrepCourseLessonPage }
