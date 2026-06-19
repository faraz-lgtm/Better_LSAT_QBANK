import type { PrepCourseModule } from "@/lib/api/prep-course"

export type PrepCourseBookmarks = {
  moduleIds: string[]
  lessonSlugs: string[]
}

const EMPTY_BOOKMARKS: PrepCourseBookmarks = { moduleIds: [], lessonSlugs: [] }

function storageKey(courseId: string): string {
  return `prep-course:bookmarks:${courseId}`
}

export function loadPrepCourseBookmarks(courseId: string): PrepCourseBookmarks {
  if (typeof window === "undefined") return EMPTY_BOOKMARKS
  try {
    const raw = window.localStorage.getItem(storageKey(courseId))
    if (!raw) return EMPTY_BOOKMARKS
    const parsed = JSON.parse(raw) as Partial<PrepCourseBookmarks>
    return {
      moduleIds: Array.isArray(parsed.moduleIds)
        ? parsed.moduleIds.filter((id): id is string => typeof id === "string")
        : [],
      lessonSlugs: Array.isArray(parsed.lessonSlugs)
        ? parsed.lessonSlugs.filter((slug): slug is string => typeof slug === "string")
        : [],
    }
  } catch {
    return EMPTY_BOOKMARKS
  }
}

export function savePrepCourseBookmarks(courseId: string, bookmarks: PrepCourseBookmarks): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(courseId), JSON.stringify(bookmarks))
  } catch {
    // ignore quota / private mode errors
  }
}

export function moduleMatchesBookmarkFilter(
  module: PrepCourseModule,
  bookmarks: PrepCourseBookmarks,
): boolean {
  if (bookmarks.moduleIds.includes(module.id)) return true
  const slugSet = new Set(bookmarks.lessonSlugs)
  for (const section of module.sections) {
    for (const lesson of section.lessons) {
      if (slugSet.has(lesson.slug)) return true
    }
  }
  return false
}
