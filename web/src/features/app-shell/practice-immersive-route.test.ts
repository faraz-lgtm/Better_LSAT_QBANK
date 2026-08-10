import { describe, expect, it } from "vitest"

import { isPracticeImmersiveRoute } from "@/features/app-shell/practice-immersive-route"

describe("isPracticeImmersiveRoute", () => {
  it("matches drill and section question sessions", () => {
    expect(isPracticeImmersiveRoute("/app/practice/drills/session/abc-123")).toBe(true)
    expect(isPracticeImmersiveRoute("/app/practice/sections/session/xyz-456")).toBe(true)
    expect(isPracticeImmersiveRoute("/app/practice/blind-review/pt-118")).toBe(true)
  })

  it("matches diagnostic review / tester exam shells", () => {
    expect(isPracticeImmersiveRoute("/app/diagnostic/review")).toBe(true)
    expect(isPracticeImmersiveRoute("/app/diagnostic/tester")).toBe(true)
    expect(isPracticeImmersiveRoute("/diagnostic/review")).toBe(true)
    expect(isPracticeImmersiveRoute("/diagnostic/tester/preview")).toBe(true)
  })

  it("does not match hub, results, or explanation routes", () => {
    expect(isPracticeImmersiveRoute("/app/practice/drills")).toBe(false)
    expect(isPracticeImmersiveRoute("/app/practice/blind-review")).toBe(false)
    expect(isPracticeImmersiveRoute("/app/practice/results/s1")).toBe(false)
    expect(isPracticeImmersiveRoute("/app/learn/explanations/q/q1")).toBe(false)
    expect(isPracticeImmersiveRoute("/app/preptest/pt1/section/s1")).toBe(false)
    expect(isPracticeImmersiveRoute("/app/diagnostic/results")).toBe(false)
  })
})