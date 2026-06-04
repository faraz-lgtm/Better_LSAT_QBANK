import type { SupabaseClient } from "@supabase/supabase-js"

import { throwIfEdgeInvokeFailed } from "@/lib/api/edge-invoke-error"

import type {
  ExplanationDetailPayload,
  ExplanationPrepTestListItem,
  ExplanationPrepTestNode,
  ExplanationStatusCounts,
} from "@/features/student/explanation-detail/explanation-tree-types"

export type {
  ExplanationDetailPayload,
  ExplanationPrepTestListItem,
  ExplanationPrepTestNode,
  ExplanationQuestionNode,
  ExplanationSectionNode,
  ExplanationPassageNode,
  ExplanationStatusCounts,
} from "@/features/student/explanation-detail/explanation-tree-types"

/** @deprecated Flat catalog row; kept for legacy list endpoint consumers. */
export type ExplanationsSummaryRow = {
  questionId: string
  prepTestTitle: string
  sectionType: "LR" | "RC" | "LG" | null
  questionNumber: number | null
  topicName: string
  hasWrittenExplanation: boolean
  hasVideo: boolean
  lastAttemptedAt: string
}

export function createExplanationsApi(supabase: SupabaseClient) {
  async function invokeExplanationsFn<T>(
    action: string,
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
    return await supabase.functions.invoke<T>("prep-explanations", {
      method: "POST",
      body: { action, ...body },
      headers,
    })
  }

  return {
    async listPrepTests(options?: {
      page?: number
      pageSize?: number
      sort?: "newest" | "oldest"
    }): Promise<{
      prepTests: ExplanationPrepTestListItem[]
      total: number
      page: number
      pageSize: number
      statusCounts: ExplanationStatusCounts
    }> {
      const { data, error } = await invokeExplanationsFn<{
        prepTests: ExplanationPrepTestListItem[]
        total: number
        page: number
        pageSize: number
        statusCounts: ExplanationStatusCounts
      }>("prep-explanations-prep-tests", {
        page: options?.page ?? 1,
        pageSize: options?.pageSize ?? 5,
        sort: options?.sort ?? "newest",
      })
      if (error) throw error
      return {
        prepTests: data?.prepTests ?? [],
        total: data?.total ?? 0,
        page: data?.page ?? 1,
        pageSize: data?.pageSize ?? 5,
        statusCounts: data?.statusCounts ?? {
          in_process: 0,
          fresh: 0,
          answered: 0,
          seen: 0,
        },
      }
    },

    async getPrepTestTree(prepTestId: string): Promise<ExplanationPrepTestNode> {
      const { data, error } = await invokeExplanationsFn<{ prepTest: ExplanationPrepTestNode }>(
        "prep-explanations-prep-test-tree",
        { prepTestId },
      )
      if (error) throw error
      if (!data?.prepTest) throw new Error("No PrepTest tree returned")
      return data.prepTest
    },

    async getExplanationDetail(questionId: string): Promise<ExplanationDetailPayload> {
      const { data, error } = await invokeExplanationsFn<ExplanationDetailPayload>("prep-explanation-detail", {
        questionId,
      })
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data) throw new Error("No explanation detail returned")
      return data
    },

    /** Legacy flat catalog of questions with explanation content. */
    async listExplanations(): Promise<ExplanationsSummaryRow[]> {
      const { data, error } = await invokeExplanationsFn<{ explanations: ExplanationsSummaryRow[] }>(
        "prep-explanations-list",
        {},
      )
      if (error) throw error
      return data?.explanations ?? []
    },
  }
}
