import type { SupabaseClient } from "@supabase/supabase-js"

import type { PracticeSessionKind } from "@/lib/api/practice"

export type AnalyticsOverview = {
  bestScaledScore: number | null
  averageScaledScore: number | null
  completedPrepTestCount: number
  totalQuestionsAnswered: number
  drillAccuracyPct: number | null
  totalDrillQuestionsAnswered: number
  averageLrMissedPerPrepTest: number | null
  averageRcMissedPerPrepTest: number | null
}

export type TrajectoryPoint = {
  sessionId: string
  prepTestTitle: string
  moduleId: string | null
  rawScore: number | null
  scaledScore: number | null
  percentile: number | null
  completedAt: string
}

export type PriorityRow = {
  questionTypeId: string
  name: string
  sectionType: "LR" | "RC" | "LG" | null
  attemptCount: number
  correctCount: number
  accuracyPct: number
  goalAccuracy: number | null
  gap: number | null
  priorityLevel: "high" | "medium" | "low"
}

export type PracticeSessionSummary = {
  id: string
  kind: PracticeSessionKind
  startedAt: string
  completedAt: string | null
  rawScore: number | null
  scaledScore: number | null
  percentile: number | null
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

  return {
    async getOverview(): Promise<AnalyticsOverview> {
      const { data, error } = await invokeAnalyticsFn<AnalyticsOverview>("analytics-overview", {})
      if (error) throw error
      if (!data) throw new Error("No overview returned from analytics")
      return data
    },

    async getTrajectory(): Promise<TrajectoryPoint[]> {
      const { data, error } = await invokeAnalyticsFn<{ points: TrajectoryPoint[] }>("analytics-trajectory", {})
      if (error) throw error
      return data?.points ?? []
    },

    async getPriorities(): Promise<PriorityRow[]> {
      const { data, error } = await invokeAnalyticsFn<{ priorities: PriorityRow[] }>("analytics-priorities", {})
      if (error) throw error
      return data?.priorities ?? []
    },

    async getSessions(input?: {
      kind?: PracticeSessionKind
      bookmarked?: boolean
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
  }
}
