import { describe, expect, it } from "vitest"

import { drillConfigOptions } from "@/features/student/drills/drill-types"

describe("drillConfigOptions.passageCount", () => {
  it("keeps RC Number of Passages as Unlimited plus 1–8", () => {
    expect(drillConfigOptions.passageCount.map((option) => option.value)).toEqual([
      "unlimited",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
    ])
    expect(drillConfigOptions.passageCount[0]).toEqual({ label: "Unlimited", value: "unlimited" })
  })
})
