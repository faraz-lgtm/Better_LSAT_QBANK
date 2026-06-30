import { describe, expect, it } from "vitest"

import {
  isStudentVisiblePrepTest,
  MIN_STUDENT_VISIBLE_PREP_TEST,
  sortPrepTestsByNumberAsc,
} from "@/lib/prep-test-visibility"

describe("prep-test-visibility", () => {
  it("shows PT100 and hides below PT100", () => {
    expect(MIN_STUDENT_VISIBLE_PREP_TEST).toBe(100)
    expect(isStudentVisiblePrepTest("LSAC062")).toBe(false)
    expect(isStudentVisiblePrepTest("LSAC099")).toBe(false)
    expect(isStudentVisiblePrepTest("LSAC100")).toBe(true)
    expect(isStudentVisiblePrepTest("LSAC101")).toBe(true)
  })

  it("sorts from PT100 upward", () => {
    const sorted = sortPrepTestsByNumberAsc([
      { module_id: "LSAC102" },
      { module_id: "LSAC100" },
      { module_id: "LSAC101" },
    ])
    expect(sorted.map((row) => row.module_id)).toEqual(["LSAC100", "LSAC101", "LSAC102"])
  })
})
