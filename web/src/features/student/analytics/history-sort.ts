export type HistorySort = "date-desc" | "date-asc" | "score-desc" | "score-asc"

export const HISTORY_SORT_OPTIONS: Array<{ id: HistorySort; label: string }> = [
  { id: "date-desc", label: "Most recent" },
  { id: "date-asc", label: "Oldest first" },
  { id: "score-desc", label: "Highest score" },
  { id: "score-asc", label: "Lowest score" },
]

export type HistorySortableEntry = {
  id: string
  score: number
  scoreMax: number
  takenAt?: string | null
}

function takenAtMs(entry: HistorySortableEntry): number {
  if (!entry.takenAt) return 0
  const time = new Date(entry.takenAt).getTime()
  return Number.isFinite(time) ? time : 0
}

function scoreRatio(entry: HistorySortableEntry): number {
  const max = entry.scoreMax > 0 ? entry.scoreMax : 1
  return entry.score / max
}

export function sortHistoryEntries<T extends HistorySortableEntry>(
  entries: readonly T[],
  sort: HistorySort,
): T[] {
  const out = [...entries]
  switch (sort) {
    case "date-desc":
      out.sort((a, b) => takenAtMs(b) - takenAtMs(a) || b.id.localeCompare(a.id))
      break
    case "date-asc":
      out.sort((a, b) => takenAtMs(a) - takenAtMs(b) || a.id.localeCompare(b.id))
      break
    case "score-desc":
      out.sort(
        (a, b) => scoreRatio(b) - scoreRatio(a) || b.score - a.score || takenAtMs(b) - takenAtMs(a),
      )
      break
    case "score-asc":
      out.sort(
        (a, b) => scoreRatio(a) - scoreRatio(b) || a.score - b.score || takenAtMs(a) - takenAtMs(b),
      )
      break
  }
  return out
}
