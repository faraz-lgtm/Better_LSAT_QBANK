const ACTIVE_DRILL_RESULTS_PARAM = "results"

function isActiveDrillResultsQuery(search: string): boolean {
  const raw = search.startsWith("?") ? search.slice(1) : search
  return new URLSearchParams(raw).get(ACTIVE_DRILL_RESULTS_PARAM) === "1"
}

function withActiveDrillResultsQuery(path: string): string {
  const hashIndex = path.indexOf("#")
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : ""
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const qIndex = withoutHash.indexOf("?")
  const pathname = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash
  const search = qIndex >= 0 ? withoutHash.slice(qIndex + 1) : ""
  const params = new URLSearchParams(search)
  params.set(ACTIVE_DRILL_RESULTS_PARAM, "1")
  return `${pathname}?${params.toString()}${hash}`
}

/**
 * Active Drill entry routing:
 * start screen → singular question → results analytics + lesson content (`?results=1`).
 * Lesson body stays hidden until after submit.
 */
function resolveActiveDrillLessonEntry(input: {
  isStartScreen: boolean
  search: string
  hasAttempt: boolean
}): "stay" | "start" | "results" {
  if (input.isStartScreen || isActiveDrillResultsQuery(input.search)) return "stay"
  return input.hasAttempt ? "results" : "start"
}

/**
 * After Next / Mark Complete, React still holds the previous lesson until the load
 * effect clears it. Never apply Active Drill entry redirects against that stale row.
 */
function isLoadedLessonMatchingUrl(input: {
  urlLessonSlug: string
  loadedLessonSlug: string | null | undefined
}): boolean {
  const urlSlug = input.urlLessonSlug.trim()
  const loadedSlug = input.loadedLessonSlug?.trim() ?? ""
  return urlSlug.length > 0 && loadedSlug.length > 0 && urlSlug === loadedSlug
}

/** Active drill Figma results only after submit (`?results=1`). */
function resolveDisplayedActiveDrillAttempt<T>(
  drillKind: string | null,
  attempt: T | null,
  search: string,
): T | null {
  if (drillKind === "active_drill" && !isActiveDrillResultsQuery(search)) {
    return null
  }
  return attempt
}

export {
  ACTIVE_DRILL_RESULTS_PARAM,
  isActiveDrillResultsQuery,
  isLoadedLessonMatchingUrl,
  resolveActiveDrillLessonEntry,
  resolveDisplayedActiveDrillAttempt,
  withActiveDrillResultsQuery,
}
