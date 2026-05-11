import type { SupabaseClient } from "@supabase/supabase-js"

export type PracticeSessionKind = "PREPTEST" | "SECTION" | "DRILL"

export type PracticeSession = {
  id: string
  user_id: string
  kind: PracticeSessionKind
  prep_test_id: string | null
  section_id: string | null
  started_at: string
  completed_at: string | null
  raw_score: number | null
  scaled_score: number | null
  percentile: number | null
  bookmarked: boolean
  excluded: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AnswerEvent = {
  id: string
  user_id: string
  practice_session_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  question_type_id: string | null
  section_type: "LR" | "RC" | "LG" | null
  difficulty: number | null
  session_kind: PracticeSessionKind
  created_at: string
}

export function createPracticeApi(supabase: SupabaseClient) {
  async function invokePracticeFn<T>(
    functionName: string,
    options: Parameters<SupabaseClient["functions"]["invoke"]>[1],
  ): Promise<{ data: T | null; error: unknown }> {
    const maybeAuth = supabase as unknown as {
      auth?: { getSession?: () => Promise<{ data: { session: { access_token?: string } | null } }> }
    }
    const sessionResult = maybeAuth.auth?.getSession ? await maybeAuth.auth.getSession() : null
    const accessToken = sessionResult?.data?.session?.access_token
    const baseHeaders = (options?.headers as Record<string, string> | undefined) ?? undefined
    const headers = baseHeaders ? { ...baseHeaders } : undefined
    if (accessToken) {
      const nextHeaders = headers ?? {}
      nextHeaders.Authorization = `Bearer ${accessToken}`
      return await supabase.functions.invoke<T>(functionName, {
        ...options,
        headers: nextHeaders,
      })
    }
    return await supabase.functions.invoke<T>(functionName, options)
  }

  return {
    async createSession(input: {
      kind: PracticeSessionKind
      prepTestId?: string | null
      sectionId?: string | null
      metadata?: Record<string, unknown>
    }): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-create-session", {
        method: "POST",
        body: {
          kind: input.kind,
          prepTestId: input.prepTestId,
          sectionId: input.sectionId,
          metadata: input.metadata,
        },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },

    async submitAnswer(input: { sessionId: string; questionId: string; selectedAnswer: string }): Promise<AnswerEvent> {
      const { data, error } = await invokePracticeFn<{ event: AnswerEvent }>("practice-submit-answer", {
        method: "POST",
        body: {
          sessionId: input.sessionId,
          questionId: input.questionId,
          selectedAnswer: input.selectedAnswer,
        },
      })
      if (error) throw error
      if (!data?.event) throw new Error("No event returned from practice")
      return data.event
    },

    async completeSession(sessionId: string): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-complete-session", {
        method: "POST",
        body: { sessionId },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },

    async updateSession(input: {
      sessionId: string
      bookmarked?: boolean
      excluded?: boolean
    }): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-update-session", {
        method: "POST",
        body: {
          sessionId: input.sessionId,
          bookmarked: input.bookmarked,
          excluded: input.excluded,
        },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },
  }
}
