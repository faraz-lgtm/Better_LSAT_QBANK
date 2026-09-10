export type DeferredAnswerState = {
  selectedAnswer: string
  isCorrect: boolean
}

export type PendingAnswerMap = Record<string, { selectedAnswer: string }>

export function shouldDeferPracticeAnswerPersist(showAnswers: string | undefined): boolean {
  return showAnswers !== "each"
}

export function pendingAnswersStorageKey(sessionId: string): string {
  return `practice-pending-answers-${sessionId}`
}

export function readPendingAnswers(sessionId: string): PendingAnswerMap {
  if (!sessionId) return {}
  const raw = sessionStorage.getItem(pendingAnswersStorageKey(sessionId))
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as PendingAnswerMap
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const next: PendingAnswerMap = {}
    for (const [questionId, value] of Object.entries(parsed)) {
      if (typeof value?.selectedAnswer !== "string") continue
      next[questionId] = { selectedAnswer: value.selectedAnswer }
    }
    return next
  } catch {
    return {}
  }
}

export function writePendingAnswers(sessionId: string, pending: PendingAnswerMap): void {
  if (!sessionId) return
  if (Object.keys(pending).length === 0) {
    sessionStorage.removeItem(pendingAnswersStorageKey(sessionId))
    return
  }
  sessionStorage.setItem(pendingAnswersStorageKey(sessionId), JSON.stringify(pending))
}

export function clearPendingAnswers(sessionId: string): void {
  if (!sessionId) return
  sessionStorage.removeItem(pendingAnswersStorageKey(sessionId))
}

export function mergeServerAndPending(
  server: Record<string, DeferredAnswerState>,
  pending: PendingAnswerMap,
): Record<string, DeferredAnswerState> {
  const merged: Record<string, DeferredAnswerState> = { ...server }
  for (const [questionId, value] of Object.entries(pending)) {
    const selectedAnswer = value.selectedAnswer.trim()
    if (!selectedAnswer) {
      delete merged[questionId]
      continue
    }
    const persisted = server[questionId]
    merged[questionId] = {
      selectedAnswer,
      isCorrect: Boolean(persisted && persisted.selectedAnswer === selectedAnswer && persisted.isCorrect),
    }
  }
  return merged
}

export function normalizeSelectedAnswer(selectedAnswer: string | undefined): string {
  return selectedAnswer?.trim() ?? ""
}

export function isAnswerDirty(
  localSelected: string | undefined,
  persistedSelected: string | undefined,
): boolean {
  return normalizeSelectedAnswer(localSelected) !== normalizeSelectedAnswer(persistedSelected)
}

export function applyPendingSelect(
  pending: PendingAnswerMap,
  questionId: string,
  selectedAnswer: string,
): PendingAnswerMap {
  return { ...pending, [questionId]: { selectedAnswer } }
}

export function applyPendingReset(pending: PendingAnswerMap, questionId: string): PendingAnswerMap {
  return { ...pending, [questionId]: { selectedAnswer: "" } }
}

export function applyPersistedAnswerToMap(
  prev: Record<string, DeferredAnswerState>,
  questionId: string,
  persisted: DeferredAnswerState | null,
): Record<string, DeferredAnswerState> {
  const current = prev[questionId]
  if (persisted == null) {
    if (current?.selectedAnswer.trim()) return prev
    if (!(questionId in prev)) return prev
    const next = { ...prev }
    delete next[questionId]
    return next
  }
  if (!current || current.selectedAnswer !== persisted.selectedAnswer) return prev
  if (current.isCorrect === persisted.isCorrect) return prev
  return { ...prev, [questionId]: persisted }
}
