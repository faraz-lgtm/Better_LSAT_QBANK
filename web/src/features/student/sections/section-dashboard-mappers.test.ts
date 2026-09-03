import { describe, expect, it } from "vitest"

import type { PracticeSessionSummary } from "@/lib/api/analytics"
import {
  formatContinueSectionTitle,
  formatSectionTimeLeftLabel,
  mapSessionToContinueSection,
} from "./section-dashboard-mappers"

function session(partial: Partial<PracticeSessionSummary> & Pick<PracticeSessionSummary, "id">): PracticeSessionSummary {
  return {
    kind: "SECTION",
    startedAt: "2026-09-03T10:00:00.000Z",
    completedAt: null,
    rawScore: null,
    scaledScore: null,
    percentile: null,
    bookmarked: false,
    excluded: false,
    metadata: {},
    prepTestTitle: null,
    sectionTitle: null,
    sectionType: "LR",
    ...partial,
  }
}

describe("formatContinueSectionTitle", () => {
  it("formats LSAC module id + section number like Figma", () => {
    expect(
      formatContinueSectionTitle(
        session({
          id: "1",
          metadata: { moduleId: "LSAC128", sectionNumber: 3, sectionType: "LR" },
        }),
      ),
    ).toBe("Section - PT128.S3")
  })
})

describe("formatSectionTimeLeftLabel", () => {
  it("returns unlimited copy for unlimited timing", () => {
    expect(
      formatSectionTimeLeftLabel(
        session({ id: "1", metadata: { timing: "unlimited" } }),
      ),
    ).toBe("Time: Unlimited")
  })

  it("formats remaining budget for timed sections", () => {
    const startedAt = "2026-09-03T10:00:00.000Z"
    const nowMs = Date.parse(startedAt) + 11.5 * 60 * 1000
    expect(
      formatSectionTimeLeftLabel(
        session({ id: "1", startedAt, metadata: { timing: "35" } }),
        nowMs,
      ),
    ).toBe("Time: 23:30 min left")
  })
})

describe("mapSessionToContinueSection", () => {
  it("returns null when section type is missing", () => {
    expect(
      mapSessionToContinueSection(
        session({ id: "1", sectionType: null, metadata: {} }),
      ),
    ).toBeNull()
  })

  it("maps continue path and title", () => {
    const mapped = mapSessionToContinueSection(
      session({
        id: "sess-9",
        metadata: { moduleId: "LSAC101", sectionNumber: 1, sectionType: "LR", timing: "unlimited" },
      }),
    )
    expect(mapped).toEqual({
      id: "sess-9",
      section: "LR",
      title: "Section - PT101.S1",
      timeLeftLabel: "Time: Unlimited",
      continuePath: "/app/practice/sections/session/sess-9",
    })
  })
})
