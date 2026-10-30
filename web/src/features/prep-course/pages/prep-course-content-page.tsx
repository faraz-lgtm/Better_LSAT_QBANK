import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"

import { useStudentEntitlementOptional } from "@/features/app-shell/student-entitlement-context"
import { useGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { PrepCourseContentHeader } from "@/features/prep-course/components/prep-course-content-header"
import { PrepCourseModulePanel } from "@/features/prep-course/components/prep-course-module-panel"
import { PrepCourseModuleSidebar } from "@/features/prep-course/components/prep-course-module-sidebar"
import { moduleMatchesBookmarkFilter } from "@/features/prep-course/lib/prep-course-bookmarks"
import {
  collectLockedLessonSlugsForFreePlan,
  isPrepCourseModuleLockedForFreePlan,
  isPrepCourseSectionLockedForFreePlan,
  shouldLimitFreePrepCourseAccess,
} from "@/features/prep-course/lib/prep-course-free-access"
import {
  curriculumStats,
  findLessonLocation,
  normalizeCurriculum,
  type PrepCourseCurriculumStats,
} from "@/features/prep-course/lib/prep-course-format"
import { usePrepCourseBookmarks } from "@/features/prep-course/lib/use-prep-course-bookmarks"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import {
  createPrepCourseApi,
  type PrepCourse,
  type PrepCourseBookmarks,
  type PrepCourseCurriculum,
  type PrepCourseModuleLessonStats,
} from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type LocationState = {
  activeLessonSlug?: string
}

function mergeCurriculumModules(
  current: PrepCourseCurriculum,
  incoming: PrepCourseCurriculum | undefined,
): PrepCourseCurriculum {
  if (!incoming?.modules.length) return current
  const byId = new Map(incoming.modules.map((mod) => [mod.id, mod]))
  return {
    modules: current.modules.map((mod) => {
      const next = byId.get(mod.id)
      if (!next) return mod
      const nextLessonCount = next.sections.reduce((sum, section) => sum + section.lessons.length, 0)
      const curLessonCount = mod.sections.reduce((sum, section) => sum + section.lessons.length, 0)
      return nextLessonCount >= curLessonCount ? next : mod
    }),
  }
}

function statsFromModuleStats(
  curriculum: PrepCourseCurriculum,
  moduleStats: PrepCourseModuleLessonStats[],
): PrepCourseCurriculumStats {
  if (moduleStats.length === 0) return curriculumStats(curriculum)
  return {
    moduleCount: curriculum.modules.length,
    sectionCount: curriculum.modules.reduce((sum, mod) => sum + mod.sections.length, 0),
    lessonCount: moduleStats.reduce((sum, row) => sum + row.lessonCount, 0),
    totalMinutes: moduleStats.reduce((sum, row) => sum + row.totalMinutes, 0),
  }
}

function PrepCourseContentPage() {
  const { courseSlug: courseSlugParam } = useParams<{ courseSlug: string }>()
  const courseSlug = courseSlugParam?.trim() ?? ""
  const location = useLocation()
  const locationState = (location.state ?? {}) as LocationState
  const entitlement = useStudentEntitlementOptional()
  const premiumAccount = useGuestPremiumAccount()
  const { openLockedContentModal } = useGuestPricingModal()
  const limitFreeAccess = shouldLimitFreePrepCourseAccess({
    hasActiveCore: entitlement?.entitlement?.hasActiveCore,
    accessState: entitlement?.entitlement?.accessState ?? null,
    hasGuestPremiumAccount: Boolean(premiumAccount),
  })

  const [course, setCourse] = useState<PrepCourse | null>(null)
  const [curriculum, setCurriculum] = useState<PrepCourseCurriculum>({ modules: [] })
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(() => new Set())
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [completedLessonSlugs, setCompletedLessonSlugs] = useState<Set<string>>(() => new Set())
  const [initialBookmarks, setInitialBookmarks] = useState<PrepCourseBookmarks | null>(null)
  const [hydratedModuleIds, setHydratedModuleIds] = useState<Set<string>>(() => new Set())
  const [moduleStats, setModuleStats] = useState<PrepCourseModuleLessonStats[]>([])
  const [hydratingModuleId, setHydratingModuleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const hydratingRef = useRef<Set<string>>(new Set())
  const hydratedModuleIdsRef = useRef<Set<string>>(new Set())

  const prepCourseApi = useMemo(() => {
    try {
      return createPrepCourseApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const { bookmarks, isModuleBookmarked, setModuleBookmarked, setLessonBookmarked } = usePrepCourseBookmarks({
    courseId: course?.id,
    courseSlug,
    prepCourseApi,
    initialBookmarks,
  })
  const bookmarkedLessonSlugs = useMemo(() => new Set(bookmarks.lessonSlugs), [bookmarks.lessonSlugs])

  const activeLessonSlug = locationState.activeLessonSlug
  const activeLessonSlugRef = useRef(activeLessonSlug)
  const limitFreeAccessRef = useRef(limitFreeAccess)

  useEffect(() => {
    activeLessonSlugRef.current = activeLessonSlug
  }, [activeLessonSlug])

  useEffect(() => {
    limitFreeAccessRef.current = limitFreeAccess
  }, [limitFreeAccess])

  useEffect(() => {
    hydratedModuleIdsRef.current = hydratedModuleIds
  }, [hydratedModuleIds])

  const ensureModuleHydrated = useCallback(
    async (moduleId: string) => {
      if (!prepCourseApi || !courseSlug) return
      if (hydratedModuleIdsRef.current.has(moduleId)) return
      if (hydratingRef.current.has(moduleId)) return
      hydratingRef.current.add(moduleId)
      setHydratingModuleId(moduleId)
      try {
        const data = await prepCourseApi.getCourse(courseSlug, { moduleId })
        const incoming = normalizeCurriculum(data.curriculum, data.lessons, data.course.id)
        setCurriculum((prev) => mergeCurriculumModules(prev, incoming))
        setHydratedModuleIds((prev) => {
          const next = new Set(prev)
          for (const id of data.hydratedModuleIds ?? [moduleId]) next.add(id)
          hydratedModuleIdsRef.current = next
          return next
        })
        if (data.moduleStats?.length) setModuleStats(data.moduleStats)
      } finally {
        hydratingRef.current.delete(moduleId)
        setHydratingModuleId((current) => (current === moduleId ? null : current))
      }
    },
    [courseSlug, prepCourseApi],
  )

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
      try {
        // Fetch once per courseSlug — do not re-run when entitlement/limitFreeAccess settles
        // (that was causing a second full outline round-trip and ~2× perceived load time).
        const data = await prepCourseApi.getCourse(courseSlug, { hydrate: "first" })
        if (!alive) return
        const normalized = normalizeCurriculum(data.curriculum, data.lessons, data.course.id)
        setCourse(data.course)
        setCurriculum(normalized)
        setCompletedLessonSlugs(new Set(data.completedLessonSlugs ?? []))
        setInitialBookmarks(data.bookmarks ?? { moduleIds: [], lessonSlugs: [] })
        setHydratedModuleIds(new Set(data.hydratedModuleIds ?? []))
        setModuleStats(data.moduleStats ?? [])

        const lessonSlug = activeLessonSlugRef.current
        const limitAccess = limitFreeAccessRef.current
        const lessonLoc = lessonSlug ? findLessonLocation(normalized, lessonSlug) : null
        const firstUnlockedId =
          normalized.modules.find(
            (module) => !isPrepCourseModuleLockedForFreePlan(courseSlug, module, limitAccess),
          )?.id ?? null
        const lessonModule = lessonLoc
          ? normalized.modules.find((module) => module.id === lessonLoc.moduleId)
          : null
        const lessonUnlocked = lessonModule
          ? !isPrepCourseModuleLockedForFreePlan(courseSlug, lessonModule, limitAccess)
          : false
        const defaultModuleId = lessonUnlocked ? lessonLoc?.moduleId ?? firstUnlockedId : firstUnlockedId
        setSelectedModuleId(defaultModuleId)

        const defaultModule = normalized.modules.find((module) => module.id === defaultModuleId)
        setExpandedSectionIds(
          defaultModule
            ? new Set(
                defaultModule.sections
                  .filter(
                    (section) =>
                      !isPrepCourseSectionLockedForFreePlan(
                        courseSlug,
                        defaultModule,
                        section,
                        limitAccess,
                      ),
                  )
                  .map((section) => section.id),
              )
            : new Set(),
        )

        if (defaultModuleId && !(data.hydratedModuleIds ?? []).includes(defaultModuleId)) {
          void prepCourseApi.getCourse(courseSlug, { moduleId: defaultModuleId }).then((extra) => {
            if (!alive) return
            const incoming = normalizeCurriculum(extra.curriculum, extra.lessons, extra.course.id)
            setCurriculum((prev) => mergeCurriculumModules(prev, incoming))
            setHydratedModuleIds((prev) => {
              const next = new Set(prev)
              for (const id of extra.hydratedModuleIds ?? [defaultModuleId]) next.add(id)
              return next
            })
          })
        }
      } catch (e) {
        if (!alive) return
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

  const stats = useMemo(
    () => statsFromModuleStats(curriculum, moduleStats),
    [curriculum, moduleStats],
  )

  const moduleLessonCountById = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of moduleStats) map.set(row.moduleId, row.lessonCount)
    return map
  }, [moduleStats])

  const lockedModuleIds = useMemo(() => {
    return new Set(
      curriculum.modules
        .filter((module) => isPrepCourseModuleLockedForFreePlan(courseSlug, module, limitFreeAccess))
        .map((module) => module.id),
    )
  }, [courseSlug, curriculum.modules, limitFreeAccess])

  const lockedSectionIds = useMemo(() => {
    const ids = new Set<string>()
    if (!limitFreeAccess) return ids
    for (const module of curriculum.modules) {
      if (lockedModuleIds.has(module.id)) continue
      for (const section of module.sections) {
        if (isPrepCourseSectionLockedForFreePlan(courseSlug, module, section, true)) {
          ids.add(section.id)
        }
      }
    }
    return ids
  }, [courseSlug, curriculum.modules, limitFreeAccess, lockedModuleIds])

  const lockedLessonSlugs = useMemo(
    () => collectLockedLessonSlugsForFreePlan(curriculum, courseSlug, limitFreeAccess),
    [courseSlug, curriculum, limitFreeAccess],
  )

  const selectedModule = useMemo(
    () => curriculum.modules.find((mod) => mod.id === selectedModuleId) ?? null,
    [curriculum.modules, selectedModuleId],
  )

  const visibleModules = useMemo(() => {
    if (!showBookmarksOnly) return curriculum.modules
    return curriculum.modules.filter((module) => moduleMatchesBookmarkFilter(module, bookmarks))
  }, [bookmarks, curriculum.modules, showBookmarksOnly])

  useEffect(() => {
    if (!showBookmarksOnly) return
    if (visibleModules.length === 0) {
      setSelectedModuleId(null)
      return
    }
    const selectedVisible = visibleModules.some((module) => module.id === selectedModuleId)
    if (!selectedModuleId || !selectedVisible) {
      setSelectedModuleId(visibleModules[0]!.id)
    }
  }, [bookmarks, selectedModuleId, showBookmarksOnly, visibleModules])

  useEffect(() => {
    if (!selectedModuleId || lockedModuleIds.size === 0) return
    if (!lockedModuleIds.has(selectedModuleId)) return
    const firstUnlockedId = curriculum.modules.find((module) => !lockedModuleIds.has(module.id))?.id ?? null
    setSelectedModuleId(firstUnlockedId)
  }, [curriculum.modules, lockedModuleIds, selectedModuleId])

  useEffect(() => {
    if (!selectedModule) return
    const shouldExpandForBookmarks =
      showBookmarksOnly || isModuleBookmarked(selectedModule.id)
    if (!shouldExpandForBookmarks) return
    const sectionIdsWithBookmarks = selectedModule.sections
      .filter((section) => section.lessons.some((lesson) => bookmarkedLessonSlugs.has(lesson.slug)))
      .map((section) => section.id)
    if (sectionIdsWithBookmarks.length === 0) return
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      for (const id of sectionIdsWithBookmarks) next.add(id)
      return next
    })
  }, [bookmarkedLessonSlugs, isModuleBookmarked, selectedModule, showBookmarksOnly])

  function handleSelectModule(moduleId: string) {
    const mod = curriculum.modules.find((module) => module.id === moduleId)
    if (!mod) return
    if (lockedModuleIds.has(moduleId)) {
      openLockedContentModal("courses")
      return
    }
    setSelectedModuleId(moduleId)
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      for (const section of mod.sections) {
        if (lockedSectionIds.has(section.id)) continue
        next.add(section.id)
      }
      return next
    })
    void ensureModuleHydrated(moduleId)
  }

  useEffect(() => {
    if (!selectedModuleId || !hydratedModuleIds.has(selectedModuleId)) return
    const fresh = curriculum.modules.find((module) => module.id === selectedModuleId)
    if (!fresh) return
    setExpandedSectionIds((prev) => {
      let changed = false
      const next = new Set(prev)
      for (const section of fresh.sections) {
        if (lockedSectionIds.has(section.id)) continue
        if (!next.has(section.id)) {
          next.add(section.id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [curriculum.modules, hydratedModuleIds, lockedSectionIds, selectedModuleId])

  function handleLockedContentClick() {
    openLockedContentModal("courses")
  }

  function handleToggleModuleBookmark(moduleId: string, next: boolean) {
    setModuleBookmarked(moduleId, next)
  }

  function handleToggleSection(sectionId: string) {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  function handleExpandModuleSections() {
    if (!selectedModule) return
    const expandableSectionIds = selectedModule.sections
      .filter((section) => !lockedSectionIds.has(section.id))
      .map((section) => section.id)
    if (expandableSectionIds.length === 0) {
      openLockedContentModal("courses")
      return
    }
    const allExpanded = expandableSectionIds.every((id) => expandedSectionIds.has(id))
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      if (allExpanded) {
        for (const id of expandableSectionIds) next.delete(id)
      } else {
        for (const id of expandableSectionIds) next.add(id)
      }
      return next
    })
  }

  if (!courseSlug) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">Missing course.</p>
      </StudentMain>
    )
  }

  if (loading) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading course content…" />
      </StudentMain>
    )
  }

  if (error || !course) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">{error ?? "Course not found."}</p>
        <Link to="/app/prep-course" className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">
          Back to courses
        </Link>
      </StudentMain>
    )
  }

  if (curriculum.modules.length === 0) {
    return (
      <StudentMain>
        <p className="ds-body-sm ds-text-muted">This course has no lessons yet.</p>
      </StudentMain>
    )
  }

  const selectedHydrated = selectedModule
    ? hydratedModuleIds.has(selectedModule.id) ||
      selectedModule.sections.some((section) => section.lessons.length > 0)
    : false
  const selectedHydrating = selectedModuleId !== null && hydratingModuleId === selectedModuleId

  return (
    <StudentMain contentClassName="flex flex-col bg-[var(--primary-0)] pb-[24px]">
      <section className="prep-course-shell-card flex w-full flex-col overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
        <div className="shrink-0">
          <PrepCourseContentHeader
            stats={stats}
            showBookmarksOnly={showBookmarksOnly}
            onToggleShowBookmarksOnly={setShowBookmarksOnly}
          />
        </div>
        <div className="flex flex-col border-t border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
          <div className="flex flex-col overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--primary-0)] lg:flex-row lg:items-start">
            {selectedModule && selectedHydrated && !selectedHydrating ? (
              <PrepCourseModulePanel
                course={course}
                module={selectedModule}
                expandedSectionIds={expandedSectionIds}
                activeLessonSlug={activeLessonSlug}
                completedLessonSlugs={completedLessonSlugs}
                onToggleSection={handleToggleSection}
                onExpandModuleSections={handleExpandModuleSections}
                moduleBookmarked={isModuleBookmarked(selectedModule.id)}
                showBookmarksOnly={showBookmarksOnly}
                bookmarkedLessonSlugs={bookmarkedLessonSlugs}
                onToggleLessonBookmark={setLessonBookmarked}
                onToggleModuleBookmark={(next) => handleToggleModuleBookmark(selectedModule.id, next)}
                onToggleShowBookmarksOnly={setShowBookmarksOnly}
                moduleLocked={lockedModuleIds.has(selectedModule.id)}
                lockedSectionIds={lockedSectionIds}
                lockedLessonSlugs={lockedLessonSlugs}
                onLockedLessonClick={handleLockedContentClick}
              />
            ) : selectedModule ? (
              <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                <StudentPageLoader label="Loading module…" />
              </div>
            ) : (
              <p className="ds-body-sm ds-text-muted min-w-0 flex-1 p-6">Select a module to view sections.</p>
            )}
            <PrepCourseModuleSidebar
              modules={visibleModules}
              selectedModuleId={selectedModuleId}
              completedLessonSlugs={completedLessonSlugs}
              moduleLessonCountById={moduleLessonCountById}
              hydratedModuleIds={hydratedModuleIds}
              lockedModuleIds={lockedModuleIds}
              onSelectModule={handleSelectModule}
              onLockedModuleClick={handleLockedContentClick}
            />
          </div>
        </div>
      </section>
    </StudentMain>
  )
}

export { PrepCourseContentPage }
