export type LockedContentVariant =
  | "default"
  | "drills"
  | "analytics"
  | "explanations"
  | "preptests"
  | "courses"
  | "studyPlan"

export type LockedContentCopy = {
  title: string
  paragraphs: string[]
  ctaLabel: string
}

const FREE_INCLUDES_LINE =
  "Free includes your diagnostic, results, 5 explanations, and Foundations, Module 1."

const LOCKED_CONTENT_COPY: Record<LockedContentVariant, LockedContentCopy> = {
  default: {
    title: "Subscriber-Only Content",
    paragraphs: [
      "This question is available exclusively to subscribers. Upgrade your plan to access every official LSAT PrepTest ever released, including 101 previous-generation tests.",
    ],
    ctaLabel: "Subscribe Now",
  },
  drills: {
    title: "Unlock Targeted Drills",
    paragraphs: [
      "Practice the question types that need the most work and build accuracy with focused sets.",
      FREE_INCLUDES_LINE,
    ],
    ctaLabel: "Unlock Drills",
  },
  analytics: {
    title: "See What's Costing You Points",
    paragraphs: [
      "Track your accuracy, timing, and performance patterns so you know what to work on next.",
      FREE_INCLUDES_LINE,
    ],
    ctaLabel: "Unlock Analytics",
  },
  explanations: {
    title: "See Why the Answer Works",
    paragraphs: [
      "Unlock full explanations to understand the right answer, the trap, and where your reasoning went off track.",
      FREE_INCLUDES_LINE,
    ],
    ctaLabel: "Unlock Explanations",
  },
  preptests: {
    title: "Unlock Official LSAT PrepTests",
    paragraphs: [
      "Get access to official PrepTests and practice in a test-like environment. LawHub Advantage is required for official LSAT content.",
      FREE_INCLUDES_LINE,
    ],
    ctaLabel: "Unlock PrepTests",
  },
  courses: {
    title: "Unlock the Full Course",
    paragraphs: [
      "Continue beyond Foundations with the full BetterLSAT course library.",
      FREE_INCLUDES_LINE,
    ],
    ctaLabel: "Unlock Course",
  },
  studyPlan: {
    title: "Know What to Study Next",
    paragraphs: [
      "Unlock a structured study plan based on your timeline and performance.",
      FREE_INCLUDES_LINE,
    ],
    ctaLabel: "Unlock My Plan",
  },
}

function isLockedContentVariant(value: unknown): value is LockedContentVariant {
  return typeof value === "string" && Object.hasOwn(LOCKED_CONTENT_COPY, value)
}

function getLockedContentCopy(variant: LockedContentVariant = "default"): LockedContentCopy {
  return LOCKED_CONTENT_COPY[isLockedContentVariant(variant) ? variant : "default"]
}

/** Map locked nav hrefs to modal copy variants (extend as more surfaces get custom copy). */
function lockedContentVariantForNavHref(href: string): LockedContentVariant {
  const path = href.split("?")[0] ?? href
  if (path === "/app/practice/drills" || path === "/app/analytics/drills") return "drills"
  if (path === "/app/practice/sections" || path === "/app/analytics/sections") return "studyPlan"
  if (path === "/app/analytics") return "analytics"
  if (path === "/app/learn/explanations") return "explanations"
  if (path === "/app/preptest" || path === "/app/analytics/preptests") return "preptests"
  if (path === "/app/prep-course" || path.startsWith("/app/prep-course/")) return "courses"
  return "default"
}

export { getLockedContentCopy, isLockedContentVariant, lockedContentVariantForNavHref }
