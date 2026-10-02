import { describe, expect, it } from "vitest"

import { buildProvisionalScoreBand, resolveScoreBand } from "./provisional-score-band"

describe("buildProvisionalScoreBand", () => {
  it("returns a stable numeric score band in the 120–180 range", () => {
    const a = buildProvisionalScoreBand("q-1", 3)
    const b = buildProvisionalScoreBand("q-1", 3)
    expect(a).toEqual(b)
    const score = Number.parseInt(a.headline, 10)
    expect(score).toBeGreaterThanOrEqual(120)
    expect(score).toBeLessThanOrEqual(180)
    expect(a.range).toMatch(/^\d+–\d+$/)
    expect(a.caption.length).toBeGreaterThan(0)
  })

  it("skews harder items toward higher midpoints", () => {
    const easy = Number.parseInt(buildProvisionalScoreBand("same", 1).headline, 10)
    const hard = Number.parseInt(buildProvisionalScoreBand("same", 5).headline, 10)
    expect(hard).toBeGreaterThan(easy)
  })
})

describe("resolveScoreBand", () => {
  it("keeps a real numeric band", () => {
    const band = resolveScoreBand(
      { headline: "162", range: "155–168", caption: "Real" },
      "q",
      3,
    )
    expect(band.headline).toBe("162")
    expect(band.caption).toBe("Real")
  })

  it("fills provisional when headline is missing", () => {
    const band = resolveScoreBand(
      { headline: "—", range: "—", caption: "Not enough answers yet" },
      "q-seed",
      4,
    )
    expect(Number.parseInt(band.headline, 10)).toBeGreaterThanOrEqual(120)
    expect(band.caption).not.toBe("Not enough answers yet")
  })
})
