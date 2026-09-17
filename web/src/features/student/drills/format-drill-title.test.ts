import { describe, expect, it } from "vitest"

import {
  ensureDrillTitleSuffix,
  formatDrillTitleFromTypeNames,
  formatPickMyOwnDrillTitle,
  isVariedMixTitle,
  PICK_MY_OWN_DRILL_TITLE,
  resolveDrillDisplayTitle,
  typeNamesFromDrillMetadata,
  VARIED_MIX_DRILL_TITLE,
} from "@/features/student/drills/format-drill-title"

describe("formatDrillTitleFromTypeNames", () => {
  it("returns Varied Mix when no types are selected", () => {
    expect(formatDrillTitleFromTypeNames([])).toBe(VARIED_MIX_DRILL_TITLE)
  })

  it("names one to three types and appends Drill", () => {
    expect(formatDrillTitleFromTypeNames(["Flaw"])).toBe("Flaw Drill")
    expect(formatDrillTitleFromTypeNames(["Flaw", "Assumption"])).toBe("Flaw, Assumption Drill")
    expect(formatDrillTitleFromTypeNames(["Flaw", "Assumption", "Strengthen"])).toBe(
      "Flaw, Assumption, Strengthen Drill",
    )
  })

  it("returns Varied Mix when more than three types are selected", () => {
    expect(formatDrillTitleFromTypeNames(["A", "B", "C", "D"])).toBe(VARIED_MIX_DRILL_TITLE)
  })

  it("ignores blank names", () => {
    expect(formatDrillTitleFromTypeNames(["  Flaw  ", "", "  "])).toBe("Flaw Drill")
  })
})

describe("ensureDrillTitleSuffix", () => {
  it("appends Drill when missing", () => {
    expect(ensureDrillTitleSuffix("Flaw")).toBe("Flaw Drill")
  })

  it("does not double-append Drill", () => {
    expect(ensureDrillTitleSuffix("Flaw Drill")).toBe("Flaw Drill")
  })

  it("normalizes Varied Mix casing", () => {
    expect(ensureDrillTitleSuffix("varied mix")).toBe(VARIED_MIX_DRILL_TITLE)
  })
})

describe("typeNamesFromDrillMetadata", () => {
  it("prefers tagLabels arrays", () => {
    expect(
      typeNamesFromDrillMetadata({
        tagLabels: ["Flaw", "Assumption"],
        tagLabel: "Ignored",
      }),
    ).toEqual(["Flaw", "Assumption"])
  })

  it("falls back to questionTypeName / tagLabel", () => {
    expect(typeNamesFromDrillMetadata({ questionTypeName: "Flaw" })).toEqual(["Flaw"])
    expect(typeNamesFromDrillMetadata({ tagLabel: "MB" })).toEqual(["MB"])
  })
})

describe("isVariedMixTitle", () => {
  it("detects Varied Mix labels", () => {
    expect(isVariedMixTitle("Varied Mix")).toBe(true)
    expect(isVariedMixTitle("  varied mix  ")).toBe(true)
    expect(isVariedMixTitle("Flaw Drill")).toBe(false)
  })
})

describe("resolveDrillDisplayTitle", () => {
  it("uses Pick My Own for manual selection when title would be Varied Mix", () => {
    expect(
      resolveDrillDisplayTitle({
        title: VARIED_MIX_DRILL_TITLE,
        selection: "manual",
      }),
    ).toBe(PICK_MY_OWN_DRILL_TITLE)
  })

  it("keeps typed titles for manual selection", () => {
    expect(
      resolveDrillDisplayTitle({
        selection: "manual",
        tagLabels: ["Flaw"],
      }),
    ).toBe("Flaw Drill")
  })

  it("keeps Varied Mix for auto selection", () => {
    expect(
      resolveDrillDisplayTitle({
        title: VARIED_MIX_DRILL_TITLE,
        selection: "auto",
      }),
    ).toBe(VARIED_MIX_DRILL_TITLE)
  })

  it("keeps Pick-my-own PT headings", () => {
    expect(
      resolveDrillDisplayTitle({
        title: "5 Questions from PT 157, 158 and 159",
        selection: "manual",
      }),
    ).toBe("5 Questions from PT 157, 158 and 159")
  })
})

describe("formatPickMyOwnDrillTitle", () => {
  it("formats count and PrepTest list like the product heading", () => {
    expect(
      formatPickMyOwnDrillTitle({
        questionCount: 5,
        prepTestNumbers: [159, 157, 158, 157],
      }),
    ).toBe("5 Questions from PT 157, 158 and 159")
  })

  it("handles one and two PrepTests", () => {
    expect(formatPickMyOwnDrillTitle({ questionCount: 1, prepTestNumbers: [158] })).toBe(
      "1 Question from PT 158",
    )
    expect(formatPickMyOwnDrillTitle({ questionCount: 2, prepTestNumbers: [158, 159] })).toBe(
      "2 Questions from PT 158 and 159",
    )
  })
})
