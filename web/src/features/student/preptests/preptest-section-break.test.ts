import { describe, expect, it, beforeEach } from "vitest"

import type { PrepTestDetailResponse } from "@/features/student/preptests/preptest-types"
import {
  normalizePrepTestDetail,
  readStoredSectionBreak,
  writeStoredSectionBreak,
  clearStoredSectionBreak,
} from "@/features/student/preptests/preptest-section-break"

const baseDetail: PrepTestDetailResponse = {
  prepTest: {
    id: "pt-152",
    moduleId: "LSAC152",
    title: "PrepTest 152",
    prepTestNumber: "152",
    label: "PT 152",
    questionCount: 100,
    totalMinutes: 140,
    sectionCount: 4,
    practiceableSectionCount: 4,
  },
  sections: [
    {
      id: "s1",
      sectionId: "LR152A-1",
      sectionNumber: 1,
      sectionType: "LR",
      title: "LR152A-1",
      questionCount: 25,
      timeMinutes: 35,
      practiceable: true,
      unlocked: true,
      onBreak: false,
      answeredCount: 25,
      completed: true,
      activeSectionSessionId: null,
    },
    {
      id: "s2",
      sectionId: "LR152V-2",
      sectionNumber: 2,
      sectionType: "LR",
      title: "LR152V-2",
      questionCount: 25,
      timeMinutes: 35,
      practiceable: true,
      unlocked: true,
      onBreak: false,
      answeredCount: 0,
      completed: false,
      activeSectionSessionId: null,
    },
    {
      id: "s3",
      sectionId: "RC152A-3",
      sectionNumber: 3,
      sectionType: "RC",
      title: "RC152A-3",
      questionCount: 26,
      timeMinutes: 35,
      practiceable: true,
      unlocked: true,
      onBreak: false,
      answeredCount: 0,
      completed: false,
      activeSectionSessionId: null,
    },
    {
      id: "s4",
      sectionId: "LR152B-4",
      sectionNumber: 4,
      sectionType: "LR",
      title: "LR152B-4",
      questionCount: 25,
      timeMinutes: 35,
      practiceable: true,
      unlocked: true,
      onBreak: false,
      answeredCount: 0,
      completed: false,
      activeSectionSessionId: null,
    },
  ],
  sectionBreak: null,
  prepTestSession: null,
  status: "in_progress",
  allPracticeableSectionsComplete: false,
  timingOptions: [],
  formatOptions: [],
  defaultTimingId: "standard",
  defaultFormatId: "four",
}

describe("normalizePrepTestDetail", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("locks later sections when only the first is complete", () => {
    const out = normalizePrepTestDetail(baseDetail)
    expect(out.sections[0]?.unlocked).toBe(true)
    expect(out.sections[1]?.unlocked).toBe(true)
    expect(out.sections[2]?.unlocked).toBe(false)
    expect(out.sections[3]?.unlocked).toBe(false)
  })

  it("marks the next section on break when stored break is active", () => {
    writeStoredSectionBreak("pt-152", "s1")
    const out = normalizePrepTestDetail(baseDetail)
    expect(out.sectionBreak?.afterSectionId).toBe("s1")
    expect(out.sections[1]?.onBreak).toBe(true)
    expect(out.sections[1]?.unlocked).toBe(false)
    expect(readStoredSectionBreak("pt-152")).not.toBeNull()
    clearStoredSectionBreak("pt-152")
    const cleared = normalizePrepTestDetail(baseDetail)
    expect(cleared.sectionBreak).toBeNull()
    expect(cleared.sections[1]?.unlocked).toBe(true)
  })
})
