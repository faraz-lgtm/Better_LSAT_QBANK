import type { SupabaseClient } from "@supabase/supabase-js"

import type { PracticeSessionKind } from "@/lib/api/practice"

export type AnalyticsOverview = {
  bestScaledScore: number | null
  averageScaledScore: number | null
  bestPercentile: number | null
  averagePercentile: number | null
  completedPrepTestCount: number
  totalQuestionsAnswered: number
  drillAccuracyPct: number | null
  totalDrillQuestionsAnswered: number
  averageLrMissedPerPrepTest: number | null
  averageRcMissedPerPrepTest: number | null
  totalStudyMinutes: number
}

export type TrajectoryPoint = {
  sessionId: string
  prepTestTitle: string
  moduleId: string | null
  rawScore: number | null
  scaledScore: number | null
  percentile: number | null
  regularRawScore: number | null
  regularScaledScore: number | null
  blindReviewRawScore: number | null
  blindReviewScaledScore: number | null
  blindReviewPercentile: number | null
  completedAt: string
}

export type PriorityTier = "highest" | "high" | "medium" | "low"

export type PriorityRow = {
  questionTypeId: string
  name: string
  sectionType: "LR" | "RC" | "LG" | null
  attemptCount: number
  correctCount: number
  /** null when there are no attempts yet ("Not enough data"). */
  accuracyPct: number | null
  goalAccuracy: number | null
  gap: number | null
  /** Relative quartile tier; null when locked / not rankable. */
  priorityTier: PriorityTier | null
  /** Legacy high/medium/low (highest maps to high). */
  priorityLevel: "high" | "medium" | "low"
  priorityScore: number | null
  extraCorrectNeededPerTest: number | null
  unlocked: boolean
  difficulty: number | null
  averagePerTest: number | null
  reviewCount: number
  goalScoreUsed?: number | null
}

export type PrepTestSessionDetail = {
  sessionId: string
  prepTestId: string
  prepTestTitle: string
  moduleId: string | null
  completedAt: string
  startedAt: string
  excluded: boolean
  totalQuestions: number
  scaledScore: number
  blindReviewScore: number
  correct: number
  incorrect: number
  percentile: number | null
  blindReviewPercentile: number | null
  blindReviewCompletedAt: string | null
  questions: Array<{
    id: string
    number: number
    title: string
    tags: string[]
    difficulty: "Easiest" | "Easy" | "Medium" | "Hard" | "Hardest"
    difficultyDots: number
    actualCorrect: boolean
    blindReviewCorrect: boolean
    blindReviewUnanswered: boolean
    isUnanswered: boolean
    correctLetter: string
    selectedLetter: string | null
    sectionType: "LR" | "RC" | "LG" | null
    sectionNumber: number | null
    /** Unscored experimental section question; still listed in results. */
    isExperimental?: boolean
    /** Difficulty-weighted share of 0.90 × 35 min for this question's section. */
    targetTimeSeconds?: number
    /** Pause-aware dwell seconds on the scored attempt; omitted when unanswered. */
    yourTimeSeconds?: number
    /** A–E popularity bar heights 0–100; zeros when platform sample is too small. */
    answerPopularity?: [number, number, number, number, number]
  }>
}

export type QuestionTypeReviewAttempt = {
  answerEventId: string
  questionId: string
  practiceSessionId: string
  sessionKind: PracticeSessionKind
  isCorrect: boolean
  selectedAnswer: string
  difficulty: number | null
  sectionType: "LR" | "RC" | "LG" | null
  createdAt: string
  title: string
  questionNumber: number | null
  prepTestTitle: string | null
}

export type QuestionTypeReviewPayload = {
  questionTypeId: string
  name: string
  sectionType: "LR" | "RC" | "LG" | null
  attemptCount: number
  correctCount: number
  attempts: QuestionTypeReviewAttempt[]
}

export type PracticeSessionSummary = {
  id: string
  kind: PracticeSessionKind
  prepTestId?: string | null
  startedAt: string
  completedAt: string | null
  rawScore: number | null
  scaledScore: number | null
  percentile: number | null
  blindReviewRawScore?: number | null
  blindReviewScaledScore?: number | null
  blindReviewPercentile?: number | null
  bookmarked: boolean
  excluded: boolean
  metadata: Record<string, unknown>
  prepTestTitle: string | null
  sectionTitle: string | null
  sectionType: "LR" | "RC" | "LG" | null
}

export type KindBreakdownSection = {
  sectionType: "LR" | "RC" | "LG"
  accuracyPct: number
  correct: number
  total: number
}

export type AnalyticsPageBundleView = "dashboard" | "overview" | "drills"

export type AnalyticsSessionsPage = {
  sessions: PracticeSessionSummary[]
  total: number
  limit: number
  offset: number
}

export type AnalyticsPageBundle = {
  view: AnalyticsPageBundleView
  overview?: AnalyticsOverview
  trajectory?: TrajectoryPoint[]
  priorities: PriorityRow[]
  sessions?: AnalyticsSessionsPage
  drillSessions?: AnalyticsSessionsPage
  sectionSessions?: AnalyticsSessionsPage
  prepTestSessions?: AnalyticsSessionsPage
}

const BUNDLE_TTL_MS = 30_000
const pageBundleCache = new Map<string, { expiresAt: number; value: AnalyticsPageBundle }>()

function readCachedBundle(view: AnalyticsPageBundleView): AnalyticsPageBundle | null {
  const hit = pageBundleCache.get(view)
  if (hit && hit.expiresAt > Date.now()) return hit.value
  if (hit) pageBundleCache.delete(view)
  if (view === "drills") {
    const dashboard = pageBundleCache.get("dashboard")
    if (dashboard && dashboard.expiresAt > Date.now() && dashboard.value.sessions) {
      return {
        view: "drills",
        sessions: dashboard.value.sessions,
        priorities: dashboard.value.priorities,
      }
    }
  }
  return null
}

function writeCachedBundle(view: AnalyticsPageBundleView, value: AnalyticsPageBundle) {
  pageBundleCache.set(view, { expiresAt: Date.now() + BUNDLE_TTL_MS, value })
}

export function resetAnalyticsPageBundleCache() {
  pageBundleCache.clear()
}

function normalizeOverview(data: Omit<AnalyticsOverview, "totalStudyMinutes"> & { totalStudyMinutes?: unknown }): AnalyticsOverview {
  const raw = data.totalStudyMinutes
  const totalStudyMinutes =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.max(0, Math.floor(raw))
      : typeof raw === "string" && raw.trim() !== ""
        ? Math.max(0, Number.parseInt(raw, 10) || 0)
        : 0
  return { ...data, totalStudyMinutes }
}

/** True when analytics-overview honored `include` and returned a page bundle. */
function looksLikePageBundle(data: unknown): data is AnalyticsPageBundle {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    d.view === "dashboard" ||
    d.view === "overview" ||
    d.view === "drills" ||
    (d.overview != null && typeof d.overview === "object") ||
    (d.sessions != null && typeof d.sessions === "object") ||
    (d.drillSessions != null && typeof d.drillSessions === "object")
  )
}

/** True when the edge function ignored `include` and returned a flat overview. */
function looksLikeFlatOverview(
  data: unknown,
): data is Omit<AnalyticsOverview, "totalStudyMinutes"> & { totalStudyMinutes?: unknown } {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    !("view" in d) &&
    !("overview" in d) &&
    !("sessions" in d) &&
    typeof d.completedPrepTestCount === "number"
  )
}

const DASHBOARD_DRILL_LIMIT = 50
const OVERVIEW_HISTORY_LIMIT = 500

export function createAnalyticsApi(supabase: SupabaseClient) {
  async function invokeAnalyticsFn<T>(
    functionName: string,
    body: Record<string, unknown>,
  ): Promise<{ data: T | null; error: unknown }> {
    const maybeAuth = supabase as unknown as {
      auth?: { getSession?: () => Promise<{ data: { session: { access_token?: string } | null } }> }
    }
    const sessionResult = maybeAuth.auth?.getSession ? await maybeAuth.auth.getSession() : null
    const accessToken = sessionResult?.data?.session?.access_token
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
    return await supabase.functions.invoke<T>(functionName, {
      method: "POST",
      body,
      headers,
    })
  }

  const api = {
    async getOverview(input?: { completedSince?: string }): Promise<AnalyticsOverview> {
      const { data, error } = await invokeAnalyticsFn<
        Omit<AnalyticsOverview, "totalStudyMinutes"> & { totalStudyMinutes?: unknown }
      >("analytics-overview", {
        ...(input?.completedSince ? { completedSince: input.completedSince } : {}),
      })
      if (error) throw error
      if (!data) throw new Error("No overview returned from analytics")
      return normalizeOverview(data)
    },

    async getPageBundle(view: AnalyticsPageBundleView): Promise<AnalyticsPageBundle> {
      const cached = readCachedBundle(view)
      if (cached) return cached
      const { data, error } = await invokeAnalyticsFn<AnalyticsPageBundle | AnalyticsOverview>(
        "analytics-overview",
        {
          include: view,
        },
      )
      if (error) throw error
      if (!data) throw new Error("No analytics bundle returned")

      if (looksLikePageBundle(data)) {
        const bundle: AnalyticsPageBundle = {
          ...data,
          view,
          priorities: data.priorities ?? [],
          overview: data.overview ? normalizeOverview(data.overview) : undefined,
        }
        writeCachedBundle(view, bundle)
        return bundle
      }

      // Pre-bundle edge function ignored `include` and returned a flat overview.
      // Compose the page payload from the existing single-purpose endpoints.
      const overview = looksLikeFlatOverview(data) ? normalizeOverview(data) : await api.getOverview()
      const composed = await composePageBundleFromParts(view, overview)
      writeCachedBundle(view, composed)
      return composed
    },

    async getTrajectory(): Promise<TrajectoryPoint[]> {
      const { data, error } = await invokeAnalyticsFn<{ points: TrajectoryPoint[] }>("analytics-trajectory", {})
      if (error) throw error
      return data?.points ?? []
    },

    async getPriorities(input?: {
      includeKinds?: PracticeSessionKind[]
    }): Promise<PriorityRow[]> {
      const { data, error } = await invokeAnalyticsFn<{ priorities: PriorityRow[] }>(
        "analytics-priorities",
        {
          includeKinds: input?.includeKinds,
        },
      )
      if (error) throw error
      return data?.priorities ?? []
    },

    async getSessions(input?: {
      kind?: PracticeSessionKind
      bookmarked?: boolean
      /** Completed sessions only, newest completion first (analytics charts/history). */
      completedOnly?: boolean
      limit?: number
      offset?: number
    }): Promise<{ sessions: PracticeSessionSummary[]; total: number; limit: number; offset: number }> {
      const { data, error } = await invokeAnalyticsFn<{
        sessions: PracticeSessionSummary[]
        total: number
        limit: number
        offset: number
      }>("analytics-sessions", {
        kind: input?.kind,
        bookmarked: input?.bookmarked === true ? true : undefined,
        completedOnly: input?.completedOnly === true ? true : undefined,
        limit: input?.limit,
        offset: input?.offset,
      })
      if (error) throw error
      if (!data) throw new Error("No sessions returned from analytics")
      return data
    },

    async getKindBreakdown(sessionKind: PracticeSessionKind): Promise<{
      sessionKind: PracticeSessionKind
      totalAnswered: number
      sections: KindBreakdownSection[]
    }> {
      const { data, error } = await invokeAnalyticsFn<{
        sessionKind: PracticeSessionKind
        totalAnswered: number
        sections: KindBreakdownSection[]
      }>("analytics-kind-breakdown", {
        sessionKind,
      })
      if (error) throw error
      if (!data) throw new Error("No breakdown returned from analytics")
      return data
    },

    async getPrepTestSessionDetail(sessionId: string): Promise<PrepTestSessionDetail> {
      const { data, error } = await invokeAnalyticsFn<PrepTestSessionDetail>("analytics-prep-test-detail", {
        sessionId,
      })
      if (error) throw error
      if (!data) throw new Error("No PrepTest detail returned from analytics")
      return data
    },

    async getQuestionTypeReview(questionTypeId: string): Promise<QuestionTypeReviewPayload> {
      const { data, error } = await invokeAnalyticsFn<QuestionTypeReviewPayload>(
        "analytics-question-type-review",
        { questionTypeId, limit: 100 },
      )
      if (error) throw error
      if (!data) throw new Error("No question type review returned from analytics")
      return data
    },
  }

  async function composePageBundleFromParts(
    view: AnalyticsPageBundleView,
    overview: AnalyticsOverview,
  ): Promise<AnalyticsPageBundle> {
    if (view === "drills") {
      const [sessions, priorities] = await Promise.all([
        api.getSessions({ kind: "DRILL", limit: DASHBOARD_DRILL_LIMIT, offset: 0 }),
        api.getPriorities(),
      ])
      return { view, sessions, priorities }
    }

    if (view === "dashboard") {
      const [trajectory, sessions, priorities] = await Promise.all([
        api.getTrajectory(),
        api.getSessions({ kind: "DRILL", limit: DASHBOARD_DRILL_LIMIT, offset: 0 }),
        api.getPriorities(),
      ])
      return { view, overview, trajectory, sessions, priorities }
    }

    const [trajectory, priorities, drillSessions, sectionSessions, prepTestSessions] = await Promise.all([
      api.getTrajectory(),
      api.getPriorities(),
      api.getSessions({ kind: "DRILL", completedOnly: true, limit: OVERVIEW_HISTORY_LIMIT, offset: 0 }),
      api.getSessions({ kind: "SECTION", completedOnly: true, limit: OVERVIEW_HISTORY_LIMIT, offset: 0 }),
      api.getSessions({ kind: "PREPTEST", completedOnly: true, limit: OVERVIEW_HISTORY_LIMIT, offset: 0 }),
    ])
    return {
      view: "overview",
      overview,
      trajectory,
      priorities,
      drillSessions,
      sectionSessions,
      prepTestSessions,
    }
  }

  return api
}
