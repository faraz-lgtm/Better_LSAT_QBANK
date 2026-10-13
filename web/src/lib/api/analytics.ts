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
const pageBundleInflight = new Map<string, Promise<AnalyticsPageBundle>>()
const sessionsCache = new Map<string, { expiresAt: number; value: AnalyticsSessionsPage }>()
const sessionsInflight = new Map<string, Promise<AnalyticsSessionsPage>>()
const prioritiesCache = { expiresAt: 0, value: null as PriorityRow[] | null }
const prioritiesInflight = new Map<string, Promise<PriorityRow[]>>()

function sessionsCacheKey(kind: PracticeSessionKind, completedOnly: boolean): string {
  return `${kind}:${completedOnly ? "completed" : "all"}`
}

function writeSessionsCache(
  kind: PracticeSessionKind,
  completedOnly: boolean,
  page: AnalyticsSessionsPage,
) {
  const key = sessionsCacheKey(kind, completedOnly)
  const existing = sessionsCache.get(key)
  // Prefer the larger page so overview previews don't overwrite full insight lists.
  if (
    existing &&
    existing.expiresAt > Date.now() &&
    existing.value.sessions.length > page.sessions.length
  ) {
    return
  }
  sessionsCache.set(key, { expiresAt: Date.now() + BUNDLE_TTL_MS, value: page })
}

function readCachedSessionsPage(
  kind: PracticeSessionKind,
  completedOnly: boolean,
  limit: number,
): AnalyticsSessionsPage | null {
  const key = sessionsCacheKey(kind, completedOnly)
  const hit = sessionsCache.get(key)
  if (!hit) return null
  if (hit.expiresAt <= Date.now()) {
    sessionsCache.delete(key)
    return null
  }
  const cached = hit.value
  const haveFullSet = cached.sessions.length >= cached.total
  const haveEnoughForLimit = cached.sessions.length >= limit
  if (!haveFullSet && !haveEnoughForLimit) return null
  return {
    sessions: cached.sessions.slice(0, limit),
    total: cached.total,
    limit,
    offset: 0,
  }
}

function writePrioritiesCache(priorities: PriorityRow[]) {
  prioritiesCache.expiresAt = Date.now() + BUNDLE_TTL_MS
  prioritiesCache.value = priorities
}

function readCachedPriorities(): PriorityRow[] | null {
  if (prioritiesCache.value && prioritiesCache.expiresAt > Date.now()) {
    return prioritiesCache.value
  }
  if (prioritiesCache.expiresAt > 0 && prioritiesCache.expiresAt <= Date.now()) {
    prioritiesCache.expiresAt = 0
    prioritiesCache.value = null
  }
  return null
}

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
  if (value.priorities?.length) writePrioritiesCache(value.priorities)
  if (value.drillSessions) writeSessionsCache("DRILL", true, value.drillSessions)
  if (value.sectionSessions) writeSessionsCache("SECTION", true, value.sectionSessions)
  if (value.prepTestSessions) writeSessionsCache("PREPTEST", true, value.prepTestSessions)
  if (view === "drills" && value.sessions) {
    writeSessionsCache("DRILL", false, value.sessions)
  }
}

export function resetAnalyticsPageBundleCache() {
  pageBundleCache.clear()
  pageBundleInflight.clear()
  sessionsCache.clear()
  sessionsInflight.clear()
  prioritiesInflight.clear()
  prioritiesCache.expiresAt = 0
  prioritiesCache.value = null
}

/**
 * Instant overview stats for progressive paint (e.g. after visiting dashboard).
 * Does not satisfy the full overview page bundle (trajectory / history / priorities).
 */
export function peekCachedAnalyticsOverview(): AnalyticsOverview | null {
  const overviewHit = pageBundleCache.get("overview")
  if (overviewHit && overviewHit.expiresAt > Date.now() && overviewHit.value.overview) {
    return overviewHit.value.overview
  }
  const dashboardHit = pageBundleCache.get("dashboard")
  if (dashboardHit && dashboardHit.expiresAt > Date.now() && dashboardHit.value.overview) {
    return dashboardHit.value.overview
  }
  return null
}

/** Seed insight pages from overview/dashboard/prior visit caches. */
export function peekCachedAnalyticsSessions(
  kind: PracticeSessionKind,
  opts?: { completedOnly?: boolean },
): PracticeSessionSummary[] | null {
  const completedOnly = opts?.completedOnly === true
  const hit = sessionsCache.get(sessionsCacheKey(kind, completedOnly))
  if (hit && hit.expiresAt > Date.now()) return hit.value.sessions
  if (hit) sessionsCache.delete(sessionsCacheKey(kind, completedOnly))
  return null
}

export function peekCachedAnalyticsPriorities(): PriorityRow[] | null {
  if (prioritiesCache.value && prioritiesCache.expiresAt > Date.now()) {
    return prioritiesCache.value
  }
  for (const view of ["overview", "dashboard", "drills"] as const) {
    const hit = pageBundleCache.get(view)
    if (hit && hit.expiresAt > Date.now() && hit.value.priorities?.length) {
      return hit.value.priorities
    }
  }
  return null
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
/** Match edge overview bundle preview; dedicated history pages fetch their own pages. */
const OVERVIEW_HISTORY_LIMIT = 8

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
      const existing = pageBundleInflight.get(view)
      if (existing) return existing

      const pending = (async (): Promise<AnalyticsPageBundle> => {
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
      })().finally(() => {
        pageBundleInflight.delete(view)
      })

      pageBundleInflight.set(view, pending)
      return pending
    },

    async getTrajectory(): Promise<TrajectoryPoint[]> {
      const { data, error } = await invokeAnalyticsFn<{ points: TrajectoryPoint[] }>("analytics-trajectory", {})
      if (error) throw error
      return data?.points ?? []
    },

    async getPriorities(input?: {
      includeKinds?: PracticeSessionKind[]
      /** Skip difficulty join — enough for drill type menus / light catalogs. */
      skipDifficulty?: boolean
    }): Promise<PriorityRow[]> {
      const filtered = Boolean(input?.includeKinds?.length)
      const skipDifficulty = input?.skipDifficulty === true
      const cacheable = !filtered && !skipDifficulty
      if (cacheable) {
        const cached = readCachedPriorities()
        if (cached) return cached
        const existing = prioritiesInflight.get("all")
        if (existing) return existing
      }

      const pending = (async (): Promise<PriorityRow[]> => {
        const { data, error } = await invokeAnalyticsFn<{ priorities: PriorityRow[] }>(
          "analytics-priorities",
          {
            includeKinds: input?.includeKinds,
            skipDifficulty: skipDifficulty ? true : undefined,
          },
        )
        if (error) throw error
        const priorities = data?.priorities ?? []
        if (cacheable) writePrioritiesCache(priorities)
        return priorities
      })()

      if (cacheable) {
        prioritiesInflight.set("all", pending)
        try {
          return await pending
        } finally {
          prioritiesInflight.delete("all")
        }
      }
      return pending
    },

    async getSessions(input?: {
      kind?: PracticeSessionKind
      bookmarked?: boolean
      /** Completed sessions only, newest completion first (analytics charts/history). */
      completedOnly?: boolean
      /** Skip COUNT(*) when total is unused (insight charts/history). */
      skipCount?: boolean
      limit?: number
      offset?: number
    }): Promise<{ sessions: PracticeSessionSummary[]; total: number; limit: number; offset: number }> {
      const kind = input?.kind
      const completedOnly = input?.completedOnly === true
      const bookmarked = input?.bookmarked === true
      const skipCount = input?.skipCount === true
      const limit = input?.limit
      const offset = input?.offset ?? 0

      if (kind && !bookmarked && offset === 0 && typeof limit === "number") {
        const cached = readCachedSessionsPage(kind, completedOnly, limit)
        if (cached) return cached
      }

      const inflightKey =
        kind && !bookmarked
          ? `${kind}:${completedOnly ? "c" : "a"}:${limit ?? "def"}:${offset}:${skipCount ? "sc" : "ct"}`
          : null
      if (inflightKey) {
        const existing = sessionsInflight.get(inflightKey)
        if (existing) return existing
      }

      const pending = (async (): Promise<AnalyticsSessionsPage> => {
        const { data, error } = await invokeAnalyticsFn<AnalyticsSessionsPage>("analytics-sessions", {
          kind,
          bookmarked: bookmarked ? true : undefined,
          completedOnly: completedOnly ? true : undefined,
          skipCount: skipCount ? true : undefined,
          limit,
          offset,
        })
        if (error) throw error
        if (!data) throw new Error("No sessions returned from analytics")
        if (kind && !bookmarked && offset === 0) {
          writeSessionsCache(kind, completedOnly, data)
        }
        return data
      })()

      if (inflightKey) {
        sessionsInflight.set(inflightKey, pending)
        try {
          return await pending
        } finally {
          sessionsInflight.delete(inflightKey)
        }
      }
      return pending
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
