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
}

export const mockAnalyticsHeadlineStats: AnalyticsStat[] = [
  { id: "best-score", label: "BEST SCORE", value: "169", accent: "#0d47a1", caption: "PERCENTILE: 94th" },
  { id: "average-score", label: "AVERAGE SCORE", value: "153", accent: "#5463a9", caption: "PERCENTILE: 49th" },
]

export const mockAnalyticsSecondaryStats: AnalyticsStat[] = [
  { id: "avg-lr", label: "AVERAGE LR", value: "-11", accent: "#00BC54" },
  { id: "avg-rc", label: "AVERAGE RC", value: "-12", accent: "#0BBCC9" },
  { id: "drilled", label: "QUESTIONS DRILLED", value: "740", accent: "#116b97" },
  { id: "accuracy", label: "DRILLING ACCURACY", value: "64%", accent: "#956321" },
]

export type ScoreProgressPoint = {
  test: string
  regular: number
  blindReview: number
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
  accuracyPct: number
  goalPct: number
  reviewCount: number
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
        reviewCount: 549,
      },
      {
        id: "lr-flaw",
        title: "Flaw or descriptive weakening",
        averagePerTest: 9.7,
        difficulty: "Easiest",
        accuracyPct: 50,
        goalPct: 86,
        reviewCount: 549,
      },
      {
        id: "lr-link",
        title: "Link assumption",
        averagePerTest: 8.2,
        difficulty: "Hard",
        accuracyPct: 50,
        goalPct: 86,
        reviewCount: 549,
      },
      {
        id: "lr-phenomenon",
        title: "Phenomenon-hypothesis (LR)",
        averagePerTest: 4.0,
        difficulty: "Hardest",
        accuracyPct: 50,
        goalPct: 86,
        reviewCount: 549,
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
        reviewCount: 549,
      },
      {
        id: "rc-comparative",
        title: "Comparative",
        averagePerTest: 9.7,
        difficulty: "Easiest",
        accuracyPct: 50,
        goalPct: 86,
        reviewCount: 549,
      },
      {
        id: "rc-problem",
        title: "Problem-analysis",
        averagePerTest: 8.2,
        difficulty: "Hard",
        accuracyPct: 50,
        goalPct: 86,
        reviewCount: 549,
      },
      {
        id: "rc-implied",
        title: "Implied",
        averagePerTest: 4.0,
        difficulty: "Hardest",
        accuracyPct: 50,
        goalPct: 86,
        reviewCount: 549,
      },
    ],
  },
]
