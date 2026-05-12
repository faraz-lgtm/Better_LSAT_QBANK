import { describe, expect, it } from "vitest"

import { annotationReducer, createInitialAnnotationState } from "@/features/admin/lib/annotations/annotation-state"
import { MAX_ANNOTATION_HISTORY } from "@/features/admin/lib/annotations/types"

const pen = (id: string) =>
  ({
    kind: "pen" as const,
    id,
    color: "#000",
    width: 2,
    points: [{ x: 0, y: 0 }],
  }) satisfies import("@/features/admin/lib/annotations/types").PenAnnotation

describe("annotationReducer", () => {
  it("adds annotation and clears redo stack", () => {
    let s = createInitialAnnotationState()
    s = annotationReducer(s, { type: "ADD", annotation: pen("a") })
    expect(s.annotations).toHaveLength(1)
    expect(s.past).toHaveLength(1)
    expect(s.future).toHaveLength(0)
    s = annotationReducer(s, { type: "UNDO" })
    expect(s.annotations).toHaveLength(0)
    s = annotationReducer(s, { type: "ADD", annotation: pen("b") })
    expect(s.future).toHaveLength(0)
  })

  it("undo restores previous list", () => {
    let s = createInitialAnnotationState()
    s = annotationReducer(s, { type: "ADD", annotation: pen("1") })
    s = annotationReducer(s, { type: "ADD", annotation: pen("2") })
    expect(s.annotations.map((a) => a.id)).toEqual(["1", "2"])
    s = annotationReducer(s, { type: "UNDO" })
    expect(s.annotations.map((a) => a.id)).toEqual(["1"])
    s = annotationReducer(s, { type: "REDO" })
    expect(s.annotations.map((a) => a.id)).toEqual(["1", "2"])
  })

  it("clear pushes history and empties", () => {
    let s = createInitialAnnotationState()
    s = annotationReducer(s, { type: "ADD", annotation: pen("x") })
    s = annotationReducer(s, { type: "CLEAR" })
    expect(s.annotations).toHaveLength(0)
    s = annotationReducer(s, { type: "UNDO" })
    expect(s.annotations.map((a) => a.id)).toEqual(["x"])
  })

  it("delete clears selectedId when matching", () => {
    let s = createInitialAnnotationState()
    s = annotationReducer(s, { type: "ADD", annotation: pen("z") })
    s = annotationReducer(s, { type: "SELECT", id: "z" })
    s = annotationReducer(s, { type: "DELETE", id: "z" })
    expect(s.annotations).toHaveLength(0)
    expect(s.selectedId).toBeNull()
  })

  it("UPDATE with skipHistory does not push past", () => {
    let s = createInitialAnnotationState()
    s = annotationReducer(s, { type: "ADD", annotation: pen("t") })
    const pastLenAfterAdd = s.past.length
    s = annotationReducer(s, {
      type: "UPDATE",
      id: "t",
      patch: { points: [{ x: 1, y: 1 }] },
      skipHistory: true,
    })
    expect(s.past.length).toBe(pastLenAfterAdd)
    expect((s.annotations[0] as { points: { x: number; y: number }[] }).points).toEqual([{ x: 1, y: 1 }])
  })

  it("UPDATE without skipHistory pushes past", () => {
    let s = createInitialAnnotationState()
    s = annotationReducer(s, { type: "ADD", annotation: pen("t") })
    const pastLen = s.past.length
    s = annotationReducer(s, { type: "UPDATE", id: "t", patch: { width: 5 } })
    expect(s.past.length).toBe(pastLen + 1)
  })

  it("bounds history length", () => {
    let s = createInitialAnnotationState()
    for (let i = 0; i < MAX_ANNOTATION_HISTORY + 10; i++) {
      s = annotationReducer(s, { type: "ADD", annotation: pen(`id-${i}`) })
    }
    expect(s.past.length).toBeLessThanOrEqual(MAX_ANNOTATION_HISTORY)
  })

  it("PUSH_HISTORY_MARKER records undo point without changing list", () => {
    let s = createInitialAnnotationState()
    s = annotationReducer(s, { type: "ADD", annotation: pen("a") })
    s = annotationReducer(s, { type: "PUSH_HISTORY_MARKER" })
    s = annotationReducer(s, { type: "UPDATE", id: "a", patch: { width: 9 }, skipHistory: true })
    expect(s.annotations[0]?.kind === "pen" && s.annotations[0].width).toBe(9)
    s = annotationReducer(s, { type: "UNDO" })
    expect(s.annotations[0]?.kind === "pen" && s.annotations[0].width).toBe(2)
  })

  it("selects new text annotation on add", () => {
    let s = createInitialAnnotationState()
    const textAnn = {
      kind: "text" as const,
      id: "txt1",
      position: { x: 10, y: 10 },
      width: 200,
      fontSize: 16,
      color: "#000",
      html: "",
    }
    s = annotationReducer(s, { type: "ADD", annotation: textAnn })
    expect(s.selectedId).toBe("txt1")
  })
})
