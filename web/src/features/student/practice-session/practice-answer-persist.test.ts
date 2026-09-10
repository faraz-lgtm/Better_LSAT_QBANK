import { afterEach, describe, expect, it, vi } from "vitest"

import { createPracticeAnswerPersist, type SubmitPracticeAnswer } from "./practice-answer-persist"
import { readPendingAnswers, writePendingAnswers } from "./practice-deferred-answers"

const SESSION_ID = "session-1"

function deferredEvent(selectedAnswer: string, isCorrect = false) {
  return { selected_answer: selectedAnswer, is_correct: isCorrect }
}

describe("createPracticeAnswerPersist", () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it("does not call submitAnswer when marking a local selection", () => {
    const submitAnswer = vi.fn()
    const persist = createPracticeAnswerPersist({
      getSessionId: () => SESSION_ID,
      isEnabled: () => true,
      submitAnswer,
    })
    persist.hydrate({})
    persist.markDirty("q1", "A")
    expect(submitAnswer).not.toHaveBeenCalled()
    expect(readPendingAnswers(SESSION_ID)).toEqual({ q1: { selectedAnswer: "A" } })
  })

  it("flushes only the latest choice for a question", async () => {
    const submitAnswer = vi.fn<SubmitPracticeAnswer>(async (input) => deferredEvent(input.selectedAnswer))
    const persist = createPracticeAnswerPersist({
      getSessionId: () => SESSION_ID,
      isEnabled: () => true,
      submitAnswer,
    })
    persist.hydrate({})
    persist.markDirty("q1", "A")
    persist.markDirty("q1", "B")
    await persist.flushQuestion("q1")
    expect(submitAnswer).toHaveBeenCalledTimes(1)
    expect(submitAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: "q1", selectedAnswer: "B" }),
    )
    expect(readPendingAnswers(SESSION_ID)).toEqual({})
  })

  it("flushAll waits for every dirty question", async () => {
    const submitAnswer = vi.fn<SubmitPracticeAnswer>(async (input) => deferredEvent(input.selectedAnswer))
    const persist = createPracticeAnswerPersist({
      getSessionId: () => SESSION_ID,
      isEnabled: () => true,
      submitAnswer,
    })
    persist.hydrate({})
    persist.markDirty("q1", "A")
    persist.markDirty("q2", "C")
    await persist.flushAll()
    expect(submitAnswer).toHaveBeenCalledTimes(2)
    expect(submitAnswer.mock.calls.map((call) => call[0].questionId).sort()).toEqual(["q1", "q2"])
  })

  it("does not apply a stale in-flight response over a newer local pick", async () => {
    let resolveFirst: ((value: { selected_answer: string; is_correct: boolean }) => void) | undefined
    const submitAnswer = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<{ selected_answer: string; is_correct: boolean }>((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockImplementationOnce(async (input: { selectedAnswer: string }) => deferredEvent(input.selectedAnswer, true))

    const onPersisted = vi.fn()
    const persist = createPracticeAnswerPersist({
      getSessionId: () => SESSION_ID,
      isEnabled: () => true,
      submitAnswer,
      onPersisted,
    })
    persist.hydrate({})
    persist.markDirty("q1", "A")
    const firstFlush = persist.flushQuestion("q1")
    persist.markDirty("q1", "B")
    const secondFlush = persist.flushQuestion("q1")
    resolveFirst?.(deferredEvent("A", true))
    await Promise.all([firstFlush, secondFlush])

    expect(onPersisted).toHaveBeenCalledTimes(1)
    expect(onPersisted).toHaveBeenCalledWith("q1", { selectedAnswer: "B", isCorrect: true })
    expect(submitAnswer).toHaveBeenCalledTimes(2)
    expect(submitAnswer.mock.calls[1][0].selectedAnswer).toBe("B")
  })

  it("overlays pending storage when hydrating from the server", () => {
    writePendingAnswers(SESSION_ID, { q1: { selectedAnswer: "B" } })
    const persist = createPracticeAnswerPersist({
      getSessionId: () => SESSION_ID,
      isEnabled: () => true,
      submitAnswer: vi.fn(),
    })
    expect(
      persist.hydrate({
        q1: { selectedAnswer: "A", isCorrect: true },
        q2: { selectedAnswer: "C", isCorrect: false },
      }),
    ).toEqual({
      q1: { selectedAnswer: "B", isCorrect: false },
      q2: { selectedAnswer: "C", isCorrect: false },
    })
  })

  it("does not persist while disabled", async () => {
    const submitAnswer = vi.fn()
    const persist = createPracticeAnswerPersist({
      getSessionId: () => SESSION_ID,
      isEnabled: () => false,
      submitAnswer,
    })
    persist.hydrate({})
    persist.markDirty("q1", "A")
    await persist.flushQuestion("q1")
    await persist.flushAll()
    expect(submitAnswer).not.toHaveBeenCalled()
    expect(readPendingAnswers(SESSION_ID)).toEqual({})
  })

  it("flushes a reset as an empty selectedAnswer", async () => {
    const submitAnswer = vi.fn<SubmitPracticeAnswer>(async (input) => deferredEvent(input.selectedAnswer))
    const persist = createPracticeAnswerPersist({
      getSessionId: () => SESSION_ID,
      isEnabled: () => true,
      submitAnswer,
    })
    persist.hydrate({ q1: { selectedAnswer: "A", isCorrect: true } })
    persist.markDirty("q1", "")
    await persist.flushQuestion("q1")
    expect(submitAnswer).toHaveBeenCalledWith(expect.objectContaining({ selectedAnswer: "" }))
  })
})
