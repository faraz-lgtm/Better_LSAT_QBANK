import { mockPrepTestRecords } from "@/features/student/lib/mock-analytics-preptests"

export type PrepTestTimingOption = {
  id: string
  label: string
}

export type PrepTestFormatOption = {
  id: string
  label: string
}

/** One row in the “Test Section” list (Figma `17847:5068` / `17848:5325`). */
export type PrepTestPracticeSectionRow = {
  id: string
  /** e.g. "Section 1" */
  shortTitle: string
  /** e.g. "35:00" */
  timeDisplay: string
  /** e.g. "25 Questions" */
  questionsLine: string
  /** Only the first unlocked row shows “Start Section”. */
  unlocked: boolean
}

export type PrepTestPracticeDetail = {
  testId: string
  /** Back link label (Figma: “PrepTests 141”) */
  parentLabel: string
  parentHref: string
  /** e.g. "PT 143" */
  label: string
  headline: string
  questionCount: number
  totalMinutes: number
  sectionCount: number
  timingOptions: PrepTestTimingOption[]
  defaultTimingId: string
  formatOptions: PrepTestFormatOption[]
  defaultFormatId: string
  sections: PrepTestPracticeSectionRow[]
}

const DEFAULT_TIMING: PrepTestTimingOption[] = [
  { id: "unlimited", label: "Unlimited" },
  { id: "standard", label: "Standard (35 min / section)" },
  { id: "strict", label: "Strict official timing" },
]

const DEFAULT_FORMAT: PrepTestFormatOption[] = [
  { id: "pt123s1", label: "PT123.S1" },
  { id: "four", label: "4 scored sections" },
  { id: "exp", label: "With experimental" },
]

/** Figma PT 143 hub (`17842:5949`, `17847:5068`) — section times/counts match design file. */
const PT143_TEMPLATE: Omit<PrepTestPracticeDetail, "testId" | "label"> = {
  parentLabel: "PrepTests 141",
  parentHref: "/app/analytics/preptests",
  headline: "Ready to begin your test?",
  questionCount: 101,
  totalMinutes: 140,
  sectionCount: 4,
  timingOptions: DEFAULT_TIMING,
  defaultTimingId: "unlimited",
  formatOptions: DEFAULT_FORMAT,
  defaultFormatId: "pt123s1",
  sections: [
    {
      id: "s1",
      shortTitle: "Section 1",
      timeDisplay: "35:00",
      questionsLine: "25 Questions",
      unlocked: true,
    },
    {
      id: "s2",
      shortTitle: "Section 2",
      timeDisplay: "30:00",
      questionsLine: "15 Questions",
      unlocked: false,
    },
    {
      id: "s3",
      shortTitle: "Section 3",
      timeDisplay: "25:00",
      questionsLine: "10 Questions",
      unlocked: false,
    },
    {
      id: "s4",
      shortTitle: "Section 4",
      timeDisplay: "45:00",
      questionsLine: "36 Questions",
      unlocked: false,
    },
  ],
}

function buildDetailForTestId(testId: string | null): PrepTestPracticeDetail {
  const record = testId ? mockPrepTestRecords.find((r) => r.id === testId) : undefined
  const id = record?.id ?? "pt143"
  const label = record ? `PT ${record.prepTestNumber}` : "PT 143"

  return {
    testId: id,
    label,
    ...PT143_TEMPLATE,
  }
}

function getPrepTestPracticeDetail(testId: string | null | undefined): PrepTestPracticeDetail {
  return buildDetailForTestId(testId ?? null)
}

/** Stub copy for the in-section experience (until wired to real items). */
export const mockPrepTestSectionStub = {
  stem:
    "Philosopher: A theory is scientifically respectable only if it is falsifiable—that is, only if it is possible to specify an observation that would show the theory to be false.",
  choices: [
    "The philosopher’s criterion is too narrow, because many respectable theories are not stated in a falsifiable form.",
    "If a theory is falsifiable, then it can always be replaced by a better theory.",
    "Only observations that are actually made can falsify a theory.",
    "A theory that predicts many observations is more respectable than a theory that predicts few.",
    "Falsifiability is a sufficient but not a necessary condition for scientific respectability.",
  ] as const,
}

export { getPrepTestPracticeDetail }
