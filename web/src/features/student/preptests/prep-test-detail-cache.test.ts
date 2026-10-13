import { beforeEach, describe, expect, it } from "vitest"

import type { PrepTestDetailResponse } from "@/features/student/preptests/preptest-types"
import {
  cachePrepTestDetail,
  clearPrepTestDetailCache,
  getCachedPrepTestDetail,
} from "@/features/student/preptests/prep-test-detail-cache"

const detail = {
  prepTest: { id: "pt-1", label: "PT 1" },
  sections: [],
} as unknown as PrepTestDetailResponse

describe("prep-test-detail-cache", () => {
  beforeEach(() => {
    clearPrepTestDetailCache()
  })

  it("stores and returns detail by prep test id", () => {
    cachePrepTestDetail("pt-1", detail)
    expect(getCachedPrepTestDetail("pt-1")).toEqual(detail)
  })

  it("clears a single prep test id", () => {
    cachePrepTestDetail("pt-1", detail)
    cachePrepTestDetail("pt-2", detail)
    clearPrepTestDetailCache("pt-1")
    expect(getCachedPrepTestDetail("pt-1")).toBeNull()
    expect(getCachedPrepTestDetail("pt-2")).toEqual(detail)
  })
})
