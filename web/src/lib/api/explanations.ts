import type { SupabaseClient } from "@supabase/supabase-js"

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

export type ExplanationDetailPayload = {
  questionId: string
  prepTestTitle: string
  sectionType: "LR" | "RC" | "LG" | null
  questionNumber: number | null
  topicName: string
  explanationHtml: string | null
  videoUrl: string | null
}

export function createExplanationsApi(supabase: SupabaseClient) {
  async function invokeExplanationsFn<T>(
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
    async listExplanations(): Promise<ExplanationsSummaryRow[]> {
      const { data, error } = await invokeExplanationsFn<{ explanations: ExplanationsSummaryRow[] }>(
        "prep-explanations-list",
        {},
      )
      if (error) throw error
      return data?.explanations ?? []
    },

    async getExplanationDetail(questionId: string): Promise<ExplanationDetailPayload> {
      const { data, error } = await invokeExplanationsFn<ExplanationDetailPayload>("prep-explanation-detail", {
        questionId,
      })
      if (error) throw error
      if (!data) throw new Error("No explanation detail returned")
      return data
    },
  }
}
