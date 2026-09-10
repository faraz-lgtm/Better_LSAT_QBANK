import { afterEach, describe, expect, it } from "vitest"

import {
  applyPendingReset,
  applyPendingSelect,
  applyPersistedAnswerToMap,
  clearPendingAnswers,
  isAnswerDirty,
  mergeServerAndPending,
  pendingAnswersStorageKey,
  readPendingAnswers,
  shouldDeferPracticeAnswerPersist,
  writePendingAnswers,
  type DeferredAnswerState,
} from "./practice-deferred-answers"

const SESSION_ID = "session-1"

describe("shouldDeferPracticeAnswerPersist", () => {
  it("defers persist when answers are revealed at the end or never", () => {
    expect(shouldDeferPracticeAnswerPersist("end")).toBe(true)
    expect(shouldDeferPracticeAnswerPersist("never")).toBe(true)
  })

  it("submits immediately when each answer is revealed", () => {
    expect(shouldDeferPracticeAnswerPersist("each")).toBe(false)
  })
})

describe("pending answer storage", () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it("round-trips pending answers keyed by session", () => {
    writePendingAnswers(SESSION_ID, { q1: { selectedAnswer: "B" } })
    expect(sessionStorage.getItem(pendingAnswersStorageKey(SESSION_ID))).toBeTruthy()
    expect(readPendingAnswers(SESSION_ID)).toEqual({ q1: { selectedAnswer: "B" } })
  })

  it("returns an empty map when nothing is stored or storage is malformed", () => {
    expect(readPendingAnswers(SESSION_ID)).toEqual({})
    sessionStorage.setItem(pendingAnswersStorageKey(SESSION_ID), "{not-json")
    expect(readPendingAnswers(SESSION_ID)).toEqual({})
  })

  it("clears pending answers after flush", () => {
    writePendingAnswers(SESSION_ID, { q1: { selectedAnswer: "A" } })
    clearPendingAnswers(SESSION_ID)
    expect(readPendingAnswers(SESSION_ID)).toEqual({})
  })
})

describe("mergeServerAndPending", () => {
  const server: Record<string, DeferredAnswerState> = {
    q1: { selectedAnswer: "A", isCorrect: true },
    q2: { selectedAnswer: "C", isCorrect: false },
  }

  it("overlays pending selections onto the server map", () => {
    expect(
      mergeServerAndPending(server, { q1: { selectedAnswer: "B" } }),
    ).toEqual({
      q1: { selectedAnswer: "B", isCorrect: false },
      q2: { selectedAnswer: "C", isCorrect: false },
    })
  })

  it("treats a pending empty selection as a reset", () => {
    expect(mergeServerAndPending(server, { q1: { selectedAnswer: "" } })).toEqual({
      q2: { selectedAnswer: "C", isCorrect: false },
    })
  })

  it("keeps server correctness when the pending letter still matches", () => {
    expect(
      mergeServerAndPending(server, { q1: { selectedAnswer: "A" } }),
    ).toEqual(server)
  })
})

describe("dirty tracking", () => {
  it("is dirty when the local letter differs from last persisted", () => {
    expect(isAnswerDirty("B", "A")).toBe(true)
    expect(isAnswerDirty("A", "A")).toBe(false)
  })

  it("treats reset-to-empty as dirty when a persisted answer exists", () => {
    expect(isAnswerDirty("", "A")).toBe(true)
    expect(isAnswerDirty(undefined, "A")).toBe(true)
    expect(isAnswerDirty("", undefined)).toBe(false)
    expect(isAnswerDirty(undefined, undefined)).toBe(false)
  })

  it("is dirty when selecting an answer that was never persisted", () => {
    expect(isAnswerDirty("A", undefined)).toBe(true)
  })
})

describe("pending map updates", () => {
  it("records the latest local selection", () => {
    const next = applyPendingSelect({ q1: { selectedAnswer: "A" } }, "q1", "B")
    expect(next).toEqual({ q1: { selectedAnswer: "B" } })
  })

  it("records reset-to-empty so a prior server answer can be cleared on flush", () => {
    const next = applyPendingReset({ q1: { selectedAnswer: "A" } }, "q1")
    expect(next).toEqual({ q1: { selectedAnswer: "" } })
  })
})

describe("applyPersistedAnswerToMap", () => {
  it("updates correctness when the local letter still matches", () => {
    expect(
      applyPersistedAnswerToMap(
        { q1: { selectedAnswer: "B", isCorrect: false } },
        "q1",
        { selectedAnswer: "B", isCorrect: true },
      ),
    ).toEqual({ q1: { selectedAnswer: "B", isCorrect: true } })
  })

  it("keeps a newer local pick when a stale persist returns", () => {
    expect(
      applyPersistedAnswerToMap(
        { q1: { selectedAnswer: "B", isCorrect: false } },
        "q1",
        { selectedAnswer: "A", isCorrect: true },
      ),
    ).toEqual({ q1: { selectedAnswer: "B", isCorrect: false } })
  })
})
