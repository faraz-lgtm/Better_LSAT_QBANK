type Bookmarkable = {
  id: string
  bookmarked: boolean
}

type PracticeBookmarkApi = {
  updateSession: (input: { sessionId: string; bookmarked: boolean }) => Promise<unknown>
}

export function filterBookmarkedOnly<T extends { bookmarked: boolean }>(
  items: readonly T[],
  bookmarkedOnly: boolean,
): T[] {
  if (!bookmarkedOnly) return [...items]
  return items.filter((item) => Boolean(item.bookmarked))
}

export function withSessionBookmark<T extends Bookmarkable>(
  items: readonly T[],
  id: string,
  bookmarked: boolean,
): T[] {
  return items.map((item) => (item.id === id ? { ...item, bookmarked } : item))
}

export function sessionBookmarkState<T extends Bookmarkable>(items: readonly T[], id: string): boolean {
  return Boolean(items.find((item) => item.id === id)?.bookmarked)
}

/** Read a switch/checkbox change without throwing if the event target is missing. */
export function checkedFromToggleEvent(event: {
  target?: EventTarget | null
  currentTarget?: EventTarget | null
}): boolean {
  const candidate = event.currentTarget ?? event.target
  if (candidate instanceof HTMLInputElement) return candidate.checked
  return Boolean((candidate as { checked?: unknown } | null)?.checked)
}

export async function persistSessionBookmark(input: {
  sessionId: string
  bookmarked: boolean
  practiceApi: PracticeBookmarkApi | null
  onFailure: () => void
}): Promise<void> {
  if (!input.practiceApi) return
  try {
    await input.practiceApi.updateSession({
      sessionId: input.sessionId,
      bookmarked: input.bookmarked,
    })
  } catch {
    input.onFailure()
  }
}
