import { describe, expect, it } from "vitest"

import { addDays, daysInclusive, startOfDay } from "@/features/admin/components/admin-custom-date-range-dialog"

describe("admin custom date range helpers", () => {
  it("counts inclusive days", () => {
    const start = startOfDay(new Date(2026, 9, 12))
    const end = startOfDay(new Date(2026, 10, 8))
    expect(daysInclusive(start, end)).toBe(28)
  })

  it("addDays preserves calendar day math", () => {
    const start = startOfDay(new Date(2026, 10, 25))
    expect(addDays(start, -13).getDate()).toBe(12)
  })
})
