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
  tags: "mb",
  difficulty: "hard",
  status: "fresh",
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

  it("ignores invalid stored JSON", () => {
    window.localStorage.setItem(drillConfigSettingsKey("LR"), "{\"timing\":\"nope\"}")
    expect(readSavedDrillConfig("LR")).toBeNull()
  })
})
