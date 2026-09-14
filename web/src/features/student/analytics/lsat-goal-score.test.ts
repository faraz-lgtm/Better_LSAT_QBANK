import { describe, expect, it } from "vitest"

import {
  LSAT_GOAL_SCORE_MAX,
  LSAT_GOAL_SCORE_MIN,
  LSAT_GOAL_SCORE_OPTIONS,
  parseLsatGoalScore,
} from "./lsat-goal-score"

describe("LSAT goal score helpers", () => {
  it("lists every score from 120 through 180", () => {
    expect(LSAT_GOAL_SCORE_OPTIONS).toHaveLength(LSAT_GOAL_SCORE_MAX - LSAT_GOAL_SCORE_MIN + 1)
    expect(LSAT_GOAL_SCORE_OPTIONS[0]).toEqual({ label: "120", value: "120" })
    expect(LSAT_GOAL_SCORE_OPTIONS.at(-1)).toEqual({ label: "180", value: "180" })
  })

  it("parses valid goal scores and rejects out-of-range values", () => {
    expect(parseLsatGoalScore("165")).toBe(165)
    expect(parseLsatGoalScore("119")).toBeNull()
    expect(parseLsatGoalScore("181")).toBeNull()
    expect(parseLsatGoalScore("")).toBeNull()
  })
})
