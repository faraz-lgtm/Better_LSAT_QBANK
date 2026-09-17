import { beforeEach, describe, expect, it } from "vitest"

import {
  clearSavedDrillConfig,
  drillConfigSettingsKey,
  readSavedDrillConfig,
  writeSavedDrillConfig,
  type SavedDrillConfig,
} from "@/features/student/drills/drill-config-saved-settings"

const sample: SavedDrillConfig = {
  questionCount: "10",
  passageCount: "2",
  timing: "35",
  showAnswers: "each",
  customize: true,
  selection: "auto",
  tags: ["mb"],
  difficulty: "hard",
  status: "fresh",
  manualQuestionIds: [],
  manualPrepTestNumbers: [],
}

describe("drill-config-saved-settings", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("writes and reads saved settings per section type", () => {
    writeSavedDrillConfig("LR", sample)
    expect(readSavedDrillConfig("LR")).toEqual(sample)
    expect(readSavedDrillConfig("RC")).toBeNull()
    expect(window.localStorage.getItem(drillConfigSettingsKey("LR"))).toContain("\"timing\":\"35\"")
  })

  it("clears saved settings when the checkbox is turned off", () => {
    writeSavedDrillConfig("LR", sample)
    clearSavedDrillConfig("LR")
    expect(readSavedDrillConfig("LR")).toBeNull()
  })

  it("maps a previously saved Never (blind) value to At the end", () => {
    window.localStorage.setItem(
      drillConfigSettingsKey("LR"),
      JSON.stringify({ ...sample, showAnswers: "never" }),
    )
    expect(readSavedDrillConfig("LR")?.showAnswers).toBe("end")
  })

  it("normalizes legacy string tags into an array", () => {
    window.localStorage.setItem(
      drillConfigSettingsKey("LR"),
      JSON.stringify({ ...sample, tags: "flaw" }),
    )
    expect(readSavedDrillConfig("LR")?.tags).toEqual(["flaw"])
  })

  it("treats legacy any tag as empty selection", () => {
    window.localStorage.setItem(
      drillConfigSettingsKey("LR"),
      JSON.stringify({ ...sample, tags: "any" }),
    )
    expect(readSavedDrillConfig("LR")?.tags).toEqual([])
  })

  it("ignores invalid stored JSON", () => {
    window.localStorage.setItem(drillConfigSettingsKey("LR"), "{\"timing\":\"nope\"}")
    expect(readSavedDrillConfig("LR")).toBeNull()
  })

  it("accepts Standard, percent, and custom time values", () => {
    writeSavedDrillConfig("LR", { ...sample, timing: "pace" })
    expect(readSavedDrillConfig("LR")?.timing).toBe("pace")
    writeSavedDrillConfig("LR", { ...sample, timing: "pct:100" })
    expect(readSavedDrillConfig("LR")?.timing).toBe("pct:100")
    writeSavedDrillConfig("LR", { ...sample, timing: "time:420" })
    expect(readSavedDrillConfig("LR")?.timing).toBe("time:420")
  })

  it("persists pick-my-own question ids", () => {
    writeSavedDrillConfig("LR", {
      ...sample,
      selection: "auto",
      manualQuestionIds: ["q-1", "q-2"],
      manualPrepTestNumbers: [158, 159],
    })
    expect(readSavedDrillConfig("LR")).toMatchObject({
      selection: "auto",
      manualQuestionIds: ["q-1", "q-2"],
      manualPrepTestNumbers: [158, 159],
    })
  })

  it("defaults missing manual pick fields for legacy saved configs", () => {
    const { manualQuestionIds: _ids, manualPrepTestNumbers: _pts, ...legacy } = sample
    window.localStorage.setItem(drillConfigSettingsKey("LR"), JSON.stringify(legacy))
    expect(readSavedDrillConfig("LR")?.manualQuestionIds).toEqual([])
    expect(readSavedDrillConfig("LR")?.manualPrepTestNumbers).toEqual([])
  })
})
