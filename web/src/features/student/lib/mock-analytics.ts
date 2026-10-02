export const mockAnalyticsOverview = {
  totalStudyHours: 142,
  overallAccuracyPct: 78,
  questionsAnswered: 1847,
}

export const mockPrepTestResult = {
  testLabel: "PT145",
  dateLabel: "October 3, 2025",
  score: 167,
  correct: 66,
  total: 78,
  missed: 12,
  percentile: 90.6,
  prediction: 160,
  blindReview: 167,
}

export const mockSectionResults = [
  { id: "lr1", label: "LR", correct: 22, total: 26 },
  { id: "rc", label: "RC", correct: 20, total: 27 },
  { id: "lr2", label: "LR", correct: 24, total: 25 },
]

export type AnalyticsStat = {
  id: string
  label: string
  value: string
  accent: string
  caption?: string
  /** Extra caption fragment (e.g. "all-time high") after the percentile. */
  captionDetail?: string
  /** Signed delta vs best score, e.g. "-16 from best". */
  deltaCaption?: string
  /** 0–100 fill for the score progress rail (Mean Score only in Figma). */
  progressPct?: number
  /** Scale labels under the progress rail (Figma Mean Score → "120" / "180"). */
  progressScaleMin?: string
  progressScaleMax?: string
}

export const mockAnalyticsHeadlineStats: AnalyticsStat[] = [
  {
    id: "best-score",
    label: "Best Score",
    value: "169",
    accent: "#0d47a1",
    caption: "94th percentile",
    captionDetail: "all-time high",
  },
  {
    id: "average-score",
    label: "Average Score",
    value: "153",
    accent: "#0d47a1",
    caption: "49th percentile",
    deltaCaption: "-16 from best",
    progressPct: 55,
    progressScaleMin: "120",
    progressScaleMax: "180",
  },
]

export const mockAnalyticsSecondaryStats: AnalyticsStat[] = [
  { id: "avg-lr", label: "Logical Reasoning Average", value: "-11", accent: "#00BC54" },
  { id: "avg-rc", label: "Reading Comprehension Average", value: "-12", accent: "#0BBCC9" },
  { id: "avg-time", label: "Average Time per Question", value: "1:00", accent: "#0d47a1" },
  { id: "accuracy", label: "Question Accuracy", value: "64%", accent: "#0d47a1" },
]

export type ScoreProgressPoint = {
  test: string
  regular: number
  blindReview: number
  /** ISO completedAt from trajectory — used for chart hover tooltips. */
  completedAt?: string | null
  percentile?: number | null
  blindReviewPercentile?: number | null
  /** Raw correct count for Regular Score tooltip caption. */
  regularRawScore?: number | null
  /** Raw correct count for Untimed Review tooltip caption. */
  blindReviewRawScore?: number | null
  /** Question total when known (e.g. PrepTest trajectory). */
  questionCount?: number | null
}

export const mockScoreProgress: ScoreProgressPoint[] = [
  { test: "PT 150", regular: 168, blindReview: 172 },
  { test: "PT 151", regular: 165, blindReview: 170 },
  { test: "PT 152", regular: 162, blindReview: 168 },
  { test: "PT 153", regular: 160, blindReview: 166 },
  { test: "PT 154", regular: 158, blindReview: 164 },
  { test: "PT 155", regular: 150, blindReview: 155 },
  { test: "PT 156", regular: 148, blindReview: 154 },
  { test: "PT 157", regular: 145, blindReview: 152 },
]

export type Difficulty = "Easiest" | "Easy" | "Medium" | "Hard" | "Hardest"

export type QuestionTypeRow = {
  id: string
  title: string
  averagePerTest: number
  difficulty: Difficulty
  accuracyPct: number | null
  goalPct: number | null
  /** Goal − accuracy (percentage points); null when locked / missing. */
  gapPct: number | null
  reviewCount: number
  unlocked: boolean
  extraCorrectNeededPerTest: number | null
  priorityTier: "highest" | "high" | "medium" | "low" | null
}

export type SectionId = "LR" | "RC"

export type AnalyticsSection = {
  id: SectionId
  title: string
  badgeBg: string
  badgeColor: string
  accentBar: string
  rows: QuestionTypeRow[]
}

export const mockAnalyticsSections: AnalyticsSection[] = [
  {
    id: "LR",
    title: "Logical Reasoning",
    badgeBg: "#eafff4",
    badgeColor: "#00bc54",
    accentBar: "#00bc54",
    rows: [
      {
        id: "lr-conditional",
        title: "Conditional reasoning",
        averagePerTest: 10.4,
        difficulty: "Medium",
        accuracyPct: 50,
        goalPct: 86,
        gapPct: 36,
        reviewCount: 549,
        unlocked: true,
        extraCorrectNeededPerTest: 3.7,
        priorityTier: "highest",
      },
      {
        id: "lr-flaw",
        title: "Flaw or descriptive weakening",
        averagePerTest: 9.7,
        difficulty: "Easiest",
        accuracyPct: 50,
        goalPct: 86,
        gapPct: 36,
        reviewCount: 549,
        unlocked: true,
        extraCorrectNeededPerTest: 3.5,
        priorityTier: "high",
      },
      {
        id: "lr-link",
        title: "Link assumption",
        averagePerTest: 8.2,
        difficulty: "Hard",
        accuracyPct: 50,
        goalPct: 86,
        gapPct: 36,
        reviewCount: 549,
        unlocked: true,
        extraCorrectNeededPerTest: 3.0,
        priorityTier: "medium",
      },
      {
        id: "lr-phenomenon",
        title: "Phenomenon-hypothesis (LR)",
        averagePerTest: 4.0,
        difficulty: "Hardest",
        accuracyPct: 50,
        goalPct: 86,
        gapPct: 36,
        reviewCount: 549,
        unlocked: true,
        extraCorrectNeededPerTest: 1.4,
        priorityTier: "low",
      },
    ],
  },
  {
    id: "RC",
    title: "Reading Comprehension",
    badgeBg: "#e5fdff",
    badgeColor: "#0bbcc9",
    accentBar: "#0bbcc9",
    rows: [
      {
        id: "rc-critique",
        title: "Critique or debate",
        averagePerTest: 10.4,
        difficulty: "Medium",
        accuracyPct: 50,
        goalPct: 86,
        gapPct: 36,
        reviewCount: 549,
        unlocked: true,
        extraCorrectNeededPerTest: 3.7,
        priorityTier: "highest",
      },
      {
        id: "rc-comparative",
        title: "Comparative",
        averagePerTest: 9.7,
        difficulty: "Easiest",
        accuracyPct: 50,
        goalPct: 86,
        gapPct: 36,
        reviewCount: 549,
        unlocked: true,
        extraCorrectNeededPerTest: 3.5,
        priorityTier: "high",
      },
      {
        id: "rc-problem",
        title: "Problem-analysis",
        averagePerTest: 8.2,
        difficulty: "Hard",
        accuracyPct: 50,
        goalPct: 86,
        gapPct: 36,
        reviewCount: 549,
        unlocked: true,
        extraCorrectNeededPerTest: 3.0,
        priorityTier: "medium",
      },
      {
        id: "rc-implied",
        title: "Implied",
        averagePerTest: 4.0,
        difficulty: "Hardest",
        accuracyPct: 50,
        goalPct: 86,
        gapPct: 36,
        reviewCount: 549,
        unlocked: true,
        extraCorrectNeededPerTest: 1.4,
        priorityTier: "low",
      },
    ],
  },
]
