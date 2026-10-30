export type LockedContentVariant =
  | "default"
  | "drills"
  | "sections"
  | "analytics"
  | "explanations"
  | "preptests"
  | "courses"
  | "studyPlan"

export type LockedContentCopy = {
  title: string
  paragraphs: string[]
  ctaLabel: string
  /** Secondary dismiss button label (Figma course lock uses "Back to Course"). */
  dismissLabel?: string
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
  /** Figma `21587:36586` — Prep Drills free-user lock modal */
  drills: {
    title: "Unlock More Ways to Practice",
    paragraphs: [
      "Get access to Section drills, official LSAT questions, text explanations, and the full set of BetterLSAT practice tools.",
    ],
    ctaLabel: "View Plans",
    dismissLabel: "Back",
  },
  /** Figma `21587:36609` (overlay `21587:36585`) — Sections free-user lock modal */
  sections: {
    title: "Unlock More Ways to Practice",
    paragraphs: [
      "Get access to Section drills, official LSAT questions, text explanations, and the full set of BetterLSAT practice tools.",
    ],
    ctaLabel: "View Plans",
    dismissLabel: "Back",
  },
  analytics: {
    title: "See What's Costing You Points",
    paragraphs: [
      "Track your accuracy, timing, and performance patterns so you know what to work on next.",
      FREE_INCLUDES_LINE,
    ],
    ctaLabel: "Unlock Analytics",
  },
  /** Figma `21587:34268` — Explanations free-user lock */
  explanations: {
    title: "Ready for More Practice?",
    paragraphs: [
      "Unlock official LSAT questions from PrepTests 101–159, with text explanations and focused practice.",
    ],
    ctaLabel: "Unlock Practice",
    dismissLabel: "Back",
  },
  /** Figma `21587:32455` — PrepTest subscriber-only lock */
  preptests: {
    title: "Unlock Official LSAT PrepTests",
    paragraphs: [
      "Practice with official LSAT content from PrepTests 101–159. LawHub Advantage is required for official LSAT content.",
    ],
    ctaLabel: "View Plans",
    dismissLabel: "Back",
  },
  /** Figma `19939:8388` — Expand Lock / Upgrade to Keep Going */
  courses: {
    title: "Keep Learning with Full Access",
    paragraphs: [
      "Your free access includes Foundations, Module 1. Upgrade to continue through the full BetterLSAT course.",
    ],
    ctaLabel: "View Plans",
    dismissLabel: "Back to Course",
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
  if (path === "/app/practice/sections") return "sections"
  if (path === "/app/analytics/sections") return "studyPlan"
  if (path === "/app/analytics") return "analytics"
  if (path === "/app/learn/explanations") return "explanations"
  if (path === "/app/preptest" || path === "/app/analytics/preptests") return "preptests"
  if (path === "/app/prep-course" || path.startsWith("/app/prep-course/")) return "courses"
  return "default"
}

export { getLockedContentCopy, isLockedContentVariant, lockedContentVariantForNavHref }
