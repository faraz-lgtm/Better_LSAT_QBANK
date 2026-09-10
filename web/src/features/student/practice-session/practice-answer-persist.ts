import { useMemo, useRef } from "react"

import {
  applyPendingReset,
  applyPendingSelect,
  clearPendingAnswers,
  isAnswerDirty,
  mergeServerAndPending,
  readPendingAnswers,
  writePendingAnswers,
  type DeferredAnswerState,
} from "@/features/student/practice-session/practice-deferred-answers"

export type PersistAnswerEvent = {
  selected_answer: string
  is_correct: boolean
}

export type SubmitPracticeAnswer = (input: {
  sessionId: string
  questionId: string
  selectedAnswer: string
  blindReview?: boolean
  timeSpentSeconds?: number
}) => Promise<PersistAnswerEvent>

export type PracticeAnswerPersistOptions = {
  getSessionId: () => string | null
  isEnabled: () => boolean
  submitAnswer: SubmitPracticeAnswer
  getTimeSpentSeconds?: (questionId: string) => number | undefined
  isBlindReview?: () => boolean
  onPersisted?: (questionId: string, answer: DeferredAnswerState | null) => void
  onError?: (error: Error) => void
}

export function createPracticeAnswerPersist(options: PracticeAnswerPersistOptions) {
  let lastPersisted: Record<string, DeferredAnswerState> = {}
  const inflight = new Map<string, Promise<void>>()

  function sessionIdOrNull(): string | null {
    return options.getSessionId()
  }

  function persistPending(sessionId: string, pending: ReturnType<typeof readPendingAnswers>) {
    writePendingAnswers(sessionId, pending)
  }

  function hydrate(server: Record<string, DeferredAnswerState>): Record<string, DeferredAnswerState> {
    lastPersisted = { ...server }
    const sessionId = sessionIdOrNull()
    if (!sessionId || !options.isEnabled()) return { ...server }
    return mergeServerAndPending(server, readPendingAnswers(sessionId))
  }

  function markDirty(questionId: string, selectedAnswer: string) {
    const sessionId = sessionIdOrNull()
    if (!sessionId || !options.isEnabled()) return
    const persisted = lastPersisted[questionId]?.selectedAnswer
    let pending = readPendingAnswers(sessionId)
    if (!isAnswerDirty(selectedAnswer, persisted)) {
      if (pending[questionId] !== undefined) {
        const next = { ...pending }
        delete next[questionId]
        persistPending(sessionId, next)
      }
      return
    }
    pending =
      selectedAnswer.trim() === ""
        ? applyPendingReset(pending, questionId)
        : applyPendingSelect(pending, questionId, selectedAnswer)
    persistPending(sessionId, pending)
  }

  async function runFlush(questionId: string): Promise<void> {
    const sessionId = sessionIdOrNull()
    if (!sessionId || !options.isEnabled()) return

    try {
      while (true) {
        const pending = readPendingAnswers(sessionId)[questionId]
        if (pending === undefined) return
        if (!isAnswerDirty(pending.selectedAnswer, lastPersisted[questionId]?.selectedAnswer)) {
          const next = readPendingAnswers(sessionId)
          delete next[questionId]
          persistPending(sessionId, next)
          return
        }

        const payload = pending.selectedAnswer
        const event = await options.submitAnswer({
          sessionId,
          questionId,
          selectedAnswer: payload,
          blindReview: options.isBlindReview?.() || undefined,
          timeSpentSeconds: options.isBlindReview?.() ? undefined : options.getTimeSpentSeconds?.(questionId),
        })

        const latest = readPendingAnswers(sessionId)[questionId]
        if (latest !== undefined && latest.selectedAnswer !== payload) continue

        const persisted: DeferredAnswerState | null = event.selected_answer.trim()
          ? { selectedAnswer: event.selected_answer, isCorrect: event.is_correct }
          : null
        if (persisted) lastPersisted[questionId] = persisted
        else delete lastPersisted[questionId]

        const next = readPendingAnswers(sessionId)
        if (next[questionId]?.selectedAnswer === payload) {
          delete next[questionId]
          persistPending(sessionId, next)
        }
        options.onPersisted?.(questionId, persisted)
        return
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to submit answer")
      options.onError?.(err)
      throw err
    }
  }

  async function flushQuestion(questionId: string): Promise<void> {
    if (!options.isEnabled() || !sessionIdOrNull()) return
    const existing = inflight.get(questionId)
    if (existing) return existing
    const pending = runFlush(questionId).finally(() => {
      inflight.delete(questionId)
    })
    inflight.set(questionId, pending)
    return pending
  }

  async function flushAll(): Promise<void> {
    const sessionId = sessionIdOrNull()
    if (!sessionId || !options.isEnabled()) return
    const ids = Object.keys(readPendingAnswers(sessionId))
    await Promise.all(ids.map((questionId) => flushQuestion(questionId)))
  }

  function clearPending() {
    const sessionId = sessionIdOrNull()
    if (sessionId) clearPendingAnswers(sessionId)
  }

  return {
    hydrate,
    markDirty,
    flushQuestion,
    flushAll,
    clearPending,
  }
}

export type UsePracticeAnswerPersistOptions = {
  sessionId: string | null
  enabled: boolean
  submitAnswer: SubmitPracticeAnswer
  getTimeSpentSeconds?: (questionId: string) => number | undefined
  blindReview?: boolean
  onPersisted?: (questionId: string, answer: DeferredAnswerState | null) => void
  onError?: (error: Error) => void
}

export function usePracticeAnswerPersist(options: UsePracticeAnswerPersistOptions) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  return useMemo(
    () =>
      createPracticeAnswerPersist({
        getSessionId: () => optionsRef.current.sessionId,
        isEnabled: () => optionsRef.current.enabled,
        submitAnswer: (input) => optionsRef.current.submitAnswer(input),
        getTimeSpentSeconds: (questionId) => optionsRef.current.getTimeSpentSeconds?.(questionId),
        isBlindReview: () => optionsRef.current.blindReview === true,
        onPersisted: (questionId, answer) => optionsRef.current.onPersisted?.(questionId, answer),
        onError: (error) => optionsRef.current.onError?.(error),
      }),
    [],
  )
}
