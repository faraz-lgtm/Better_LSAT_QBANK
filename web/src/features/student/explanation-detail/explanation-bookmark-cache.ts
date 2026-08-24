const STORAGE_KEY = "lsat.explanation-question-bookmarks"

export type ExplanationBookmarkCache = {
  questionIds: string[]
  prepTestIds: string[]
}

const EMPTY: ExplanationBookmarkCache = { questionIds: [], prepTestIds: [] }

export function readExplanationBookmarkCache(): ExplanationBookmarkCache {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<ExplanationBookmarkCache>
    return {
      questionIds: Array.isArray(parsed.questionIds)
        ? parsed.questionIds.filter((id): id is string => typeof id === "string")
        : [],
      prepTestIds: Array.isArray(parsed.prepTestIds)
        ? parsed.prepTestIds.filter((id): id is string => typeof id === "string")
        : [],
    }
  } catch {
    return EMPTY
  }
}

export function writeExplanationBookmarkCache(cache: ExplanationBookmarkCache): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
}
