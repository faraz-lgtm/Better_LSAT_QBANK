import { describe, expect, it } from "vitest"

import {
  getLockedContentCopy,
  lockedContentVariantForNavHref,
} from "@/features/guest/pricing/guest-locked-content-copy"

const FREE_INCLUDES =
  "Free includes your diagnostic, results, 5 explanations, and Foundations, Module 1."

describe("guest-locked-content-copy", () => {
  it("returns default subscriber copy", () => {
    expect(getLockedContentCopy("default")).toEqual({
      title: "Subscriber-Only Content",
      paragraphs: [
        "This question is available exclusively to subscribers. Upgrade your plan to access every official LSAT PrepTest ever released, including 101 previous-generation tests.",
      ],
      ctaLabel: "Subscribe Now",
    })
  })

  it("returns feature unlock copy for drills, analytics, explanations, preptests, courses, and study plan", () => {
    expect(getLockedContentCopy("drills").title).toBe("Unlock Targeted Drills")
    expect(getLockedContentCopy("drills").ctaLabel).toBe("Unlock Drills")

    expect(getLockedContentCopy("analytics")).toEqual({
      title: "See What's Costing You Points",
      paragraphs: [
        "Track your accuracy, timing, and performance patterns so you know what to work on next.",
        FREE_INCLUDES,
      ],
      ctaLabel: "Unlock Analytics",
    })

    expect(getLockedContentCopy("explanations")).toEqual({
      title: "See Why the Answer Works",
      paragraphs: [
        "Unlock full explanations to understand the right answer, the trap, and where your reasoning went off track.",
        FREE_INCLUDES,
      ],
      ctaLabel: "Unlock Explanations",
    })

    expect(getLockedContentCopy("preptests")).toEqual({
      title: "Unlock Official LSAT PrepTests",
      paragraphs: [
        "Get access to official PrepTests and practice in a test-like environment. LawHub Advantage is required for official LSAT content.",
        FREE_INCLUDES,
      ],
      ctaLabel: "Unlock PrepTests",
    })

    expect(getLockedContentCopy("courses")).toEqual({
      title: "Unlock the Full Course",
      paragraphs: [
        "Continue beyond Foundations with the full BetterLSAT course library.",
        FREE_INCLUDES,
      ],
      ctaLabel: "Unlock Course",
    })

    expect(getLockedContentCopy("studyPlan")).toEqual({
      title: "Know What to Study Next",
      paragraphs: [
        "Unlock a structured study plan based on your timeline and performance.",
        FREE_INCLUDES,
      ],
      ctaLabel: "Unlock My Plan",
    })
  })

  it("maps locked nav hrefs to the matching copy variant", () => {
    expect(lockedContentVariantForNavHref("/app/practice/drills")).toBe("drills")
    expect(lockedContentVariantForNavHref("/app/analytics/drills")).toBe("drills")
    expect(lockedContentVariantForNavHref("/app/analytics")).toBe("analytics")
    expect(lockedContentVariantForNavHref("/app/learn/explanations")).toBe("explanations")
    expect(lockedContentVariantForNavHref("/app/preptest")).toBe("preptests")
    expect(lockedContentVariantForNavHref("/app/analytics/preptests")).toBe("preptests")
    expect(lockedContentVariantForNavHref("/app/prep-course")).toBe("courses")
    expect(lockedContentVariantForNavHref("/app/prep-course/lr-mastery-course")).toBe("courses")
    expect(lockedContentVariantForNavHref("/app/practice/sections")).toBe("studyPlan")
    expect(lockedContentVariantForNavHref("/app/analytics/sections")).toBe("studyPlan")
  })
})
