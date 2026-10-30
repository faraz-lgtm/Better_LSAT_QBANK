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

  it("returns feature unlock copy for drills, sections, analytics, explanations, preptests, courses, and study plan", () => {
    expect(getLockedContentCopy("drills")).toEqual({
      title: "Unlock More Ways to Practice",
      paragraphs: [
        "Get access to Section drills, official LSAT questions, text explanations, and the full set of BetterLSAT practice tools.",
      ],
      ctaLabel: "View Plans",
      dismissLabel: "Back",
    })

    expect(getLockedContentCopy("sections")).toEqual({
      title: "Unlock More Ways to Practice",
      paragraphs: [
        "Get access to Section drills, official LSAT questions, text explanations, and the full set of BetterLSAT practice tools.",
      ],
      ctaLabel: "View Plans",
      dismissLabel: "Back",
    })

    expect(getLockedContentCopy("analytics")).toEqual({
      title: "See What's Costing You Points",
      paragraphs: [
        "Track your accuracy, timing, and performance patterns so you know what to work on next.",
        FREE_INCLUDES,
      ],
      ctaLabel: "Unlock Analytics",
    })

    expect(getLockedContentCopy("explanations")).toEqual({
      title: "Ready for More Practice?",
      paragraphs: [
        "Unlock official LSAT questions from PrepTests 101–159, with text explanations and focused practice.",
      ],
      ctaLabel: "Unlock Practice",
      dismissLabel: "Back",
    })

    expect(getLockedContentCopy("preptests")).toEqual({
      title: "Unlock Official LSAT PrepTests",
      paragraphs: [
        "Practice with official LSAT content from PrepTests 101–159. LawHub Advantage is required for official LSAT content.",
      ],
      ctaLabel: "View Plans",
      dismissLabel: "Back",
    })

    expect(getLockedContentCopy("courses")).toEqual({
      title: "Keep Learning with Full Access",
      paragraphs: [
        "Your free access includes Foundations, Module 1. Upgrade to continue through the full BetterLSAT course.",
      ],
      ctaLabel: "View Plans",
      dismissLabel: "Back to Course",
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
    expect(lockedContentVariantForNavHref("/app/practice/sections")).toBe("sections")
    expect(lockedContentVariantForNavHref("/app/analytics/sections")).toBe("studyPlan")
  })
})
