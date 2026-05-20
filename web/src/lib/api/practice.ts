import type {
  DrillPoolStats,
  DrillPoolStatsInput,
  DrillSessionResponse,
  StartDrillInput,
} from "@/features/student/drills/drill-types"
import type {
  ListSectionPoolInput,
  SectionPoolItem,
  SectionSessionResponse,
  StartSectionInput,
} from "@/features/student/sections/section-types"
import type {
  BlindReviewDetailResponse,
  BlindReviewPoolItem,
} from "@/features/student/blind-review/blind-review-types"
import type {
  PrepTestDetailResponse,
  PrepTestPoolFilter,
  PrepTestPoolItem,
  StartPrepTestInput,
  StartPrepTestResponse,
} from "@/features/student/preptests/preptest-types"
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
  blind_review_raw_score?: number | null
  blind_review_scaled_score?: number | null
  blind_review_percentile?: number | null
  blind_review_completed_at?: string | null
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

    async submitAnswer(input: {
      sessionId: string
      questionId: string
      selectedAnswer: string
      blindReview?: boolean
    }): Promise<AnswerEvent> {
      const { data, error } = await invokePracticeFn<{ event: AnswerEvent }>("practice-submit-answer", {
        method: "POST",
        body: {
          sessionId: input.sessionId,
          questionId: input.questionId,
          selectedAnswer: input.selectedAnswer,
          blindReview: input.blindReview,
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

    async startDrill(input: StartDrillInput): Promise<DrillSessionResponse> {
      const { data, error } = await invokePracticeFn<DrillSessionResponse>("practice-start-drill", {
        method: "POST",
        body: {
          sectionType: input.sectionType,
          questionCount: input.questionCount,
          timing: input.timing,
          showAnswers: input.showAnswers,
          selection: input.selection,
          questionTypeId: input.questionTypeId,
          tagLabel: input.tagLabel,
          difficulty: input.difficulty,
          status: input.status,
          title: input.title,
        },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No drill session returned from practice")
      return data
    },

    async startLessonDrill(input: { lessonId: string }): Promise<DrillSessionResponse> {
      const { data, error } = await invokePracticeFn<DrillSessionResponse>("practice-start-lesson-drill", {
        method: "POST",
        body: { lessonId: input.lessonId },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No drill session returned from practice")
      return data
    },

    async getDrillSession(sessionId: string): Promise<DrillSessionResponse> {
      const { data, error } = await invokePracticeFn<DrillSessionResponse>("practice-get-drill-session", {
        method: "POST",
        body: { sessionId },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No drill session returned from practice")
      return data
    },

    async getDrillPoolStats(input: DrillPoolStatsInput): Promise<DrillPoolStats> {
      const { data, error } = await invokePracticeFn<DrillPoolStats>("practice-drill-pool-stats", {
        method: "POST",
        body: {
          sectionType: input.sectionType,
          questionTypeId: input.questionTypeId,
          difficulty: input.difficulty,
          status: input.status,
        },
      })
      if (error) throw error
      if (!data) throw new Error("No pool stats returned from practice")
      return data
    },

    async listSectionPool(input: ListSectionPoolInput = {}): Promise<{ sections: SectionPoolItem[] }> {
      const { data, error } = await invokePracticeFn<{ sections: SectionPoolItem[] }>(
        "practice-list-section-pool",
        {
          method: "POST",
          body: { sectionType: input.sectionType },
        },
      )
      if (error) throw error
      if (!data?.sections) throw new Error("No sections returned from practice")
      return data
    },

    async startSection(input: StartSectionInput): Promise<SectionSessionResponse> {
      const { data, error } = await invokePracticeFn<SectionSessionResponse>("practice-start-section", {
        method: "POST",
        body: {
          sectionId: input.sectionId,
          timing: input.timing,
          showAnswers: input.showAnswers,
        },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No section session returned from practice")
      return data
    },

    async getSectionSession(sessionId: string): Promise<SectionSessionResponse> {
      const { data, error } = await invokePracticeFn<SectionSessionResponse>("practice-get-section-session", {
        method: "POST",
        body: { sessionId },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No section session returned from practice")
      return data
    },

    async listPrepTestPool(input: { filter?: PrepTestPoolFilter } = {}): Promise<{ prepTests: PrepTestPoolItem[] }> {
      const { data, error } = await invokePracticeFn<{ prepTests: PrepTestPoolItem[] }>(
        "practice-list-prep-test-pool",
        {
          method: "POST",
          body: { filter: input.filter === "all" ? undefined : input.filter },
        },
      )
      if (error) throw error
      if (!data?.prepTests) throw new Error("No prep tests returned from practice")
      return data
    },

    async getPrepTestDetail(prepTestId: string): Promise<PrepTestDetailResponse> {
      const { data, error } = await invokePracticeFn<PrepTestDetailResponse>("practice-get-prep-test-detail", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) throw error
      if (!data?.prepTest) throw new Error("No prep test detail returned from practice")
      return data
    },

    async startPrepTest(input: StartPrepTestInput): Promise<StartPrepTestResponse> {
      const { data, error } = await invokePracticeFn<StartPrepTestResponse>("practice-start-prep-test", {
        method: "POST",
        body: {
          prepTestId: input.prepTestId,
          timing: input.timing,
          format: input.format,
        },
      })
      if (error) throw error
      if (!data?.prepTestSession) throw new Error("No prep test session returned from practice")
      return data
    },

    async completePrepTest(prepTestId: string): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-complete-prep-test", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },

    async listBlindReviewPool(): Promise<{ prepTests: BlindReviewPoolItem[] }> {
      const { data, error } = await invokePracticeFn<{ prepTests: BlindReviewPoolItem[] }>(
        "practice-list-blind-review-pool",
        { method: "POST", body: {} },
      )
      if (error) throw error
      if (!data?.prepTests) throw new Error("No blind review pool returned from practice")
      return data
    },

    async getBlindReviewDetail(prepTestId: string): Promise<BlindReviewDetailResponse> {
      const { data, error } = await invokePracticeFn<BlindReviewDetailResponse>("practice-get-blind-review-detail", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) throw error
      if (!data?.prepTest) throw new Error("No blind review detail returned from practice")
      return data
    },

    async startBlindReview(prepTestId: string): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-start-blind-review", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },

    async completeBlindReview(input: { prepTestId?: string; sessionId?: string }): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-complete-blind-review", {
        method: "POST",
        body: input,
      })
      if (error) throw error
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },
  }
}
