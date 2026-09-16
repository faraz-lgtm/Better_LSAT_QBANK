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

/** Active drill Figma results only after submit (`?results=1`). Course module keeps the lesson text. */
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
  resolveDisplayedActiveDrillAttempt,
  withActiveDrillResultsQuery,
}
