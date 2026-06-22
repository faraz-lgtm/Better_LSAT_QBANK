import type {
  DrillPoolStats,
  DrillPoolStatsInput,
  DrillSessionResponse,
  StartDrillInput,
} from "@/features/student/drills/drill-types"
import type {
  ListSectionPoolInput,
  SectionPoolItem,
  SectionPoolListResult,
  SectionPoolTypeCounts,
  SectionSessionResponse,
  StartSectionInput,
} from "@/features/student/sections/section-types"
import type {
  BlindReviewDetailResponse,
  BlindReviewPoolFilter,
  BlindReviewPoolItem,
  BlindReviewPoolListResult,
  BlindReviewPoolSort,
  BlindReviewPoolStatusCounts,
} from "@/features/student/blind-review/blind-review-types"
import type {
  PrepTestDetailResponse,
  PrepTestPoolFilter,
  PrepTestPoolItem,
  PrepTestPoolListResult,
  PrepTestPoolSort,
  StartPrepTestInput,
  StartPrepTestResponse,
} from "@/features/student/preptests/preptest-types"
import { coercePoolScore } from "@/features/student/preptests/preptest-pool-display"
import { normalizePrepTestDetail } from "@/features/student/preptests/preptest-section-break"
import type { SupabaseClient } from "@supabase/supabase-js"

import { throwIfEdgeInvokeFailed } from "@/lib/api/edge-invoke-error"

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

function sectionTypeCountsFromSections(sections: SectionPoolItem[]): SectionPoolTypeCounts {
  return {
    all: sections.length,
    lr: sections.filter((s) => s.sectionType === "LR").length,
    rc: sections.filter((s) => s.sectionType === "RC").length,
  }
}

function sectionNumberSortValue(item: SectionPoolItem): number {
  const fromModule = item.moduleId ? /^LSAC(\d+)$/i.exec(item.moduleId)?.[1] : undefined
  const moduleNum = fromModule ? Number.parseInt(fromModule, 10) : 0
  const sectionNum = item.sectionNumber ?? 0
  return moduleNum * 1000 + sectionNum
}

/**
 * Normalize legacy `{ sections }` responses from undeployed edge functions.
 * When `total` is missing, paginate/filter/sort in the client so the UI only renders one page.
 */
function normalizeSectionPoolListResult(
  data: Partial<SectionPoolListResult> & { sections: SectionPoolItem[] },
  input: ListSectionPoolInput,
): SectionPoolListResult {
  const page = Math.max(1, Math.floor(input.page ?? 1))
  const pageSize = Math.min(50, Math.max(1, Math.floor(input.pageSize ?? 12)))
  const sort = input.sort === "oldest" ? "oldest" : "newest"
  const isLegacy = typeof data.total !== "number"

  if (isLegacy) {
    const sectionTypeCounts = sectionTypeCountsFromSections(data.sections)
    let pool = data.sections
    if (input.sectionType) {
      pool = pool.filter((s) => s.sectionType === input.sectionType)
    }
    pool = [...pool].sort((a, b) => {
      const diff = sectionNumberSortValue(a) - sectionNumberSortValue(b)
      return sort === "newest" ? -diff : diff
    })
    const total = pool.length
    const start = (page - 1) * pageSize
    return {
      sections: pool.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      sectionTypeCounts,
    }
  }

  return {
    sections: data.sections,
    total: data.total!,
    page: typeof data.page === "number" ? data.page : page,
    pageSize: typeof data.pageSize === "number" ? data.pageSize : pageSize,
    sectionTypeCounts: data.sectionTypeCounts ?? sectionTypeCountsFromSections(data.sections),
  }
}

function blindReviewPoolSortValue(item: BlindReviewPoolItem): number {
  const n = item.prepTestNumber ? Number.parseInt(item.prepTestNumber, 10) : NaN
  if (Number.isFinite(n)) return n
  const fromModule = /^LSAC(\d+)$/i.exec(item.moduleId)?.[1]
  return fromModule ? Number.parseInt(fromModule, 10) : 0
}

type PrepTestPoolItemRaw = Partial<PrepTestPoolItem> & Record<string, unknown>

function normalizePrepTestPoolItem(pt: PrepTestPoolItemRaw): PrepTestPoolItem {
  const scaledScore = coercePoolScore(pt.scaledScore ?? pt.scaled_score)
  const blindReviewScaledScore = coercePoolScore(pt.blindReviewScaledScore ?? pt.blind_review_scaled_score)
  const completedAt =
    typeof pt.completedAt === "string"
      ? pt.completedAt
      : typeof pt.completed_at === "string"
        ? pt.completed_at
        : null
  const rawAttempts = Array.isArray(pt.attempts) ? pt.attempts : []
  const attempts = rawAttempts.map((attempt) => {
    const row = attempt as Record<string, unknown>
    return {
      sessionId: String(row.sessionId ?? row.session_id ?? ""),
      completedAt: String(row.completedAt ?? row.completed_at ?? ""),
      scaledScore: coercePoolScore(row.scaledScore ?? row.scaled_score),
      blindReviewScaledScore: coercePoolScore(row.blindReviewScaledScore ?? row.blind_review_scaled_score),
      attemptNumber: typeof row.attemptNumber === "number" ? row.attemptNumber : Number(row.attempt_number ?? 1),
    }
  })

  return {
    ...(pt as PrepTestPoolItem),
    scaledScore,
    blindReviewScaledScore,
    completedAt,
    attempts,
    blindReviewStatus: pt.blindReviewStatus ?? null,
    openPrepTestSessionId:
      typeof pt.openPrepTestSessionId === "string"
        ? pt.openPrepTestSessionId
        : typeof pt.open_prep_test_session_id === "string"
          ? pt.open_prep_test_session_id
          : null,
  }
}

function normalizeBlindReviewPoolItem(pt: Partial<BlindReviewPoolItem> & Record<string, unknown>): BlindReviewPoolItem {
  const rawAttempts = Array.isArray(pt.attempts) ? pt.attempts : []
  const attempts = rawAttempts.map((attempt) => {
    const row = attempt as Record<string, unknown>
    return {
      sessionId: String(row.sessionId ?? row.session_id ?? ""),
      completedAt: String(row.completedAt ?? row.completed_at ?? ""),
      scaledScore: coercePoolScore(row.scaledScore ?? row.scaled_score),
      blindReviewScaledScore: coercePoolScore(row.blindReviewScaledScore ?? row.blind_review_scaled_score),
      attemptNumber: typeof row.attemptNumber === "number" ? row.attemptNumber : Number(row.attempt_number ?? 1),
    }
  })

  return {
    ...(pt as BlindReviewPoolItem),
    scaledScore: coercePoolScore(pt.scaledScore ?? pt.scaled_score),
    blindReviewScaledScore: coercePoolScore(pt.blindReviewScaledScore ?? pt.blind_review_scaled_score),
    completedAt:
      typeof pt.completedAt === "string"
        ? pt.completedAt
        : typeof pt.completed_at === "string"
          ? pt.completed_at
          : null,
    blindReviewCompletedAt:
      typeof pt.blindReviewCompletedAt === "string"
        ? pt.blindReviewCompletedAt
        : typeof pt.blind_review_completed_at === "string"
          ? pt.blind_review_completed_at
          : null,
    prepTestSessionId:
      typeof pt.prepTestSessionId === "string"
        ? pt.prepTestSessionId
        : typeof pt.prep_test_session_id === "string"
          ? pt.prep_test_session_id
          : null,
    attempts,
  }
}

function blindReviewStatusCountsFromItems(items: BlindReviewPoolItem[]): BlindReviewPoolStatusCounts {
  return {
    all: items.length,
    eligible: items.filter((i) => i.status === "eligible").length,
    in_progress: items.filter((i) => i.status === "in_progress").length,
    completed: items.filter((i) => i.status === "completed").length,
  }
}

/**
 * Normalize legacy `{ prepTests }` responses from undeployed edge functions.
 * When `total` is missing, paginate/filter in the client so the UI only renders one page.
 */
function normalizeBlindReviewPoolResult(
  data: Partial<BlindReviewPoolListResult> & { prepTests: BlindReviewPoolItem[] },
  input: { filter?: BlindReviewPoolFilter; page: number; pageSize: number; sort?: BlindReviewPoolSort },
): BlindReviewPoolListResult {
  const page = Math.max(1, Math.floor(input.page))
  const pageSize = Math.min(50, Math.max(1, Math.floor(input.pageSize)))
  const sort = input.sort === "oldest" ? "oldest" : "newest"
  const isLegacy = typeof data.total !== "number"

  if (isLegacy) {
    const statusCounts = blindReviewStatusCountsFromItems(data.prepTests)
    let pool = data.prepTests
    if (input.filter && input.filter !== "all") {
      pool = pool.filter((p) => p.status === input.filter)
    }
    pool = [...pool].sort((a, b) => {
      const diff = blindReviewPoolSortValue(a) - blindReviewPoolSortValue(b)
      return sort === "newest" ? -diff : diff
    })
    const total = pool.length
    const start = (page - 1) * pageSize
    return {
      prepTests: pool.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      statusCounts,
    }
  }

  return {
    prepTests: data.prepTests,
    total: data.total!,
    page: typeof data.page === "number" ? data.page : page,
    pageSize: typeof data.pageSize === "number" ? data.pageSize : pageSize,
    statusCounts: data.statusCounts ?? blindReviewStatusCountsFromItems(data.prepTests),
  }
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
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },

    async completeDrillBlindReview(input: {
      sessionId: string
      answers: Array<{ questionId: string; selectedAnswer: string }>
    }): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>(
        "practice-complete-drill-blind-review",
        {
          method: "POST",
          body: input,
        },
      )
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },

    async completeSectionBlindReview(input: {
      sessionId: string
      answers: Array<{ questionId: string; selectedAnswer: string }>
    }): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>(
        "practice-complete-section-blind-review",
        {
          method: "POST",
          body: input,
        },
      )
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },

    async updateSession(input: {
      sessionId: string
      bookmarked?: boolean
      excluded?: boolean
      flaggedQuestionIds?: string[]
      seenQuestionIds?: string[]
    }): Promise<PracticeSession> {
      const body: Record<string, unknown> = { sessionId: input.sessionId }
      if (input.bookmarked !== undefined) body.bookmarked = input.bookmarked
      if (input.excluded !== undefined) body.excluded = input.excluded
      if (input.flaggedQuestionIds !== undefined) body.flaggedQuestionIds = input.flaggedQuestionIds
      if (input.seenQuestionIds !== undefined) body.seenQuestionIds = input.seenQuestionIds

      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-update-session", {
        method: "POST",
        body,
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
          source: input.source,
        },
      })
      if (error) throw error
      if (!data?.session) throw new Error("No drill session returned from practice")
      return data
    },

    async startLessonDrill(input: {
      lessonId: string
      questionId?: string | null
    }): Promise<DrillSessionResponse> {
      const { data, error } = await invokePracticeFn<DrillSessionResponse>("practice-start-lesson-drill", {
        method: "POST",
        body: {
          lessonId: input.lessonId,
          ...(input.questionId ? { questionId: input.questionId } : {}),
        },
      })
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data?.session) throw new Error("No drill session returned from practice")
      return data
    },

    async getDrillSession(sessionId: string): Promise<DrillSessionResponse> {
      const { data, error } = await invokePracticeFn<DrillSessionResponse>("practice-get-drill-session", {
        method: "POST",
        body: { sessionId },
      })
      if (error) await throwIfEdgeInvokeFailed(error)
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

    async listSectionPool(input: ListSectionPoolInput = {}): Promise<SectionPoolListResult> {
      const { data, error } = await invokePracticeFn<SectionPoolListResult>(
        "practice-list-section-pool",
        {
          method: "POST",
          body: {
            sectionType: input.sectionType,
            page: input.page,
            pageSize: input.pageSize,
            sort: input.sort,
          },
        },
      )
      if (error) throw error
      if (!data?.sections) throw new Error("No sections returned from practice")
      return normalizeSectionPoolListResult(data, input)
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
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data?.session) throw new Error("No section session returned from practice")
      return data
    },

    async listPrepTestPool(
      input: {
        filter?: PrepTestPoolFilter
        page?: number
        pageSize?: number
        sort?: PrepTestPoolSort
      } = {},
    ): Promise<PrepTestPoolListResult> {
      const body: Record<string, unknown> = {}
      if (input.filter && input.filter !== "all") body.filter = input.filter
      if (input.page !== undefined) body.page = input.page
      if (input.pageSize !== undefined) body.pageSize = input.pageSize
      if (input.sort !== undefined) body.sort = input.sort

      const { data, error } = await invokePracticeFn<PrepTestPoolListResult>("practice-list-prep-test-pool", {
        method: "POST",
        body,
      })
      if (error) throw error
      if (!data?.prepTests) throw new Error("No prep tests returned from practice")
      return {
        ...data,
        prepTests: data.prepTests.map((pt) => normalizePrepTestPoolItem(pt)),
      }
    },

    async getPrepTestDetail(prepTestId: string): Promise<PrepTestDetailResponse> {
      const { data, error } = await invokePracticeFn<PrepTestDetailResponse>("practice-get-prep-test-detail", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) throw error
      if (!data?.prepTest) throw new Error("No prep test detail returned from practice")
      return normalizePrepTestDetail(
        {
          ...data,
          sectionBreak: data.sectionBreak ?? null,
          sections: data.sections.map((s) => ({ ...s, onBreak: s.onBreak ?? false })),
        },
        { prepTestId },
      )
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
      return {
        ...data,
        detail: normalizePrepTestDetail(
          {
            ...data.detail,
            sectionBreak: data.detail.sectionBreak ?? null,
            sections: data.detail.sections.map((s) => ({ ...s, onBreak: s.onBreak ?? false })),
          },
          { prepTestId: input.prepTestId },
        ),
      }
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

    async listBlindReviewPool(
      input: {
        filter?: BlindReviewPoolFilter
        page?: number
        pageSize?: number
        sort?: BlindReviewPoolSort
      } = {},
    ): Promise<BlindReviewPoolListResult> {
      const page = input.page ?? 1
      const pageSize = input.pageSize ?? 5
      const body: Record<string, unknown> = {}
      if (input.filter && input.filter !== "all") body.filter = input.filter
      if (input.page !== undefined) body.page = input.page
      if (input.pageSize !== undefined) body.pageSize = input.pageSize
      if (input.sort !== undefined) body.sort = input.sort

      const { data, error } = await invokePracticeFn<Partial<BlindReviewPoolListResult>>(
        "practice-list-blind-review-pool",
        { method: "POST", body },
      )
      if (error) throw error
      if (!data?.prepTests) throw new Error("No blind review pool returned from practice")
      const normalized = {
        ...data,
        prepTests: data.prepTests.map((pt) =>
          normalizeBlindReviewPoolItem(pt as Partial<BlindReviewPoolItem> & Record<string, unknown>),
        ),
      }
      return normalizeBlindReviewPoolResult(normalized, {
        filter: input.filter,
        page,
        pageSize,
        sort: input.sort,
      })
    },

    async getBlindReviewDetail(prepTestId: string): Promise<BlindReviewDetailResponse> {
      const { data, error } = await invokePracticeFn<BlindReviewDetailResponse>("practice-get-blind-review-detail", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data?.prepTest) throw new Error("No blind review detail returned from practice")
      return data
    },

    async startBlindReview(prepTestId: string): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-start-blind-review", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },

    async skipBlindReview(prepTestId: string): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-skip-blind-review", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },

    async completeBlindReview(input: { prepTestId?: string; sessionId?: string }): Promise<PracticeSession> {
      const { data, error } = await invokePracticeFn<{ session: PracticeSession }>("practice-complete-blind-review", {
        method: "POST",
        body: input,
      })
      if (error) await throwIfEdgeInvokeFailed(error)
      if (!data?.session) throw new Error("No session returned from practice")
      return data.session
    },
  }
}
