import { describe, expect, it } from "vitest"

import { formatAnsweredMeta } from "@/features/student/components/practice-drill-continue-row"

describe("formatAnsweredMeta", () => {
  it("formats slash progress as Figma copy", () => {
    expect(formatAnsweredMeta("45/100", "2 days ago")).toBe(
      "45 of 100 answered · 2 days ago",
    )
  })

  it("falls back when answered is not slash-separated", () => {
    expect(formatAnsweredMeta("halfway", "Just now")).toBe("halfway answered · Just now")
  })
})
