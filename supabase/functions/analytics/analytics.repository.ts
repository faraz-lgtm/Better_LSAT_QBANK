import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

import type { PracticeSessionKind } from '../practice/practice.repository.ts'

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

export type CompletedPreptestRow = {
  id: string
  started_at: string
  completed_at: string
  raw_score: number | null
  scaled_score: number | null
  percentile: number | null
  blind_review_raw_score: number | null
  blind_review_scaled_score: number | null
  blind_review_percentile: number | null
  blind_review_completed_at: string | null
  prep_test_id: string | null
  /** Supabase may return object or single-element array for FK joins */
  admin_prep_tests: { title: string; module_id: string } | { title: string; module_id: string }[] | null
}

export type QuestionTypeRow = {
  id: string
  name: string
  section_type: 'LR' | 'RC' | 'LG'
  goal_accuracy: number | null
  avg_per_test: number | null
}

export type PracticeSessionDetailRow = {
  id: string
  kind: string
  prep_test_id: string | null
  completed_at: string | null
  started_at: string
  raw_score: number | null
  scaled_score: number | null
  percentile: number | null
  blind_review_raw_score: number | null
  blind_review_scaled_score: number | null
  blind_review_percentile: number | null
  blind_review_completed_at: string | null
  excluded: boolean
  metadata: Record<string, unknown>
  admin_prep_tests: { title: string; module_id: string } | { title: string; module_id: string }[] | null
}

export type PracticeSessionListRow = {
  id: string
  kind: PracticeSessionKind
  prep_test_id: string | null
  section_id: string | null
  started_at: string
  completed_at: string | null
  raw_score: number | null
  scaled_score: number | null
  percentile: number | null
  blind_review_raw_score: number | null
  blind_review_scaled_score: number | null
  blind_review_percentile: number | null
  bookmarked: boolean
  excluded: boolean
  metadata: Record<string, unknown>
  admin_prep_tests: { title: string } | { title: string }[] | null
  admin_sections:
    | { title: string | null; section_type: 'LR' | 'RC' | 'LG' | null }
    | { title: string | null; section_type: 'LR' | 'RC' | 'LG' | null }[]
    | null
}

export type QuestionExplanationMetaRow = {
  id: string
  question_number: number | null
  explanation: string | null
  video_url: string | null
  updated_at?: string
  question_types: { name: string } | { name: string }[] | null
  admin_sections: {
    section_type: 'LR' | 'RC' | 'LG' | null
    section_number: number | null
    admin_prep_tests: { title: string } | { title: string }[] | null
  } | {
    section_type: 'LR' | 'RC' | 'LG' | null
    section_number: number | null
    admin_prep_tests: { title: string } | { title: string }[] | null
  }[] | null
}

export function createAnalyticsRepository(client: SupabaseClient) {
  function parseStudyMinutesRpcValue(data: unknown): number {
    if (typeof data === 'number' && Number.isFinite(data)) {
      return Math.max(0, Math.floor(data))
    }
    if (typeof data === 'string' && data.trim() !== '') {
      const parsed = Number.parseInt(data, 10)
      if (Number.isFinite(parsed)) return Math.max(0, parsed)
    }
    return 0
  }

  return {
    async countAnswerEvents(userId: string): Promise<number> {
      const { count, error } = await client
        .from('answer_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (error) throw error
      return count ?? 0
    },

    async sumCompletedSessionStudyMinutes(userId: string): Promise<number> {
      const { data, error } = await client.rpc('sum_user_practice_study_minutes', {
        p_user_id: userId,
      })
      if (error) throw error
      return parseStudyMinutesRpcValue(data)
    },

    async sumCompletedLessonStudyMinutes(userId: string): Promise<number> {
      const { data, error } = await client.rpc('sum_user_lesson_study_minutes', {
        p_user_id: userId,
      })
      if (error) throw error
      return parseStudyMinutesRpcValue(data)
    },

    async countDrillAnswerEvents(userId: string): Promise<{ correct: number; total: number }> {
      const { data, error } = await client
        .from('answer_events')
        .select('is_correct')
        .eq('user_id', userId)
        .eq('session_kind', 'DRILL')
      if (error) throw error
      const rows = (data as { is_correct: boolean }[]) ?? []
      const total = rows.length
      const correct = rows.filter((r) => r.is_correct).length
      return { correct, total }
    },

    async listCompletedPreptests(userId: string): Promise<CompletedPreptestRow[]> {
      const { data, error } = await client
        .from('practice_sessions')
        .select(
          `
          id,
          started_at,
          completed_at,
          raw_score,
          scaled_score,
          percentile,
          blind_review_raw_score,
          blind_review_scaled_score,
          blind_review_percentile,
          blind_review_completed_at,
          prep_test_id,
          admin_prep_tests ( title, module_id )
        `,
        )
        .eq('user_id', userId)
        .eq('kind', 'PREPTEST')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true })
      if (error) throw error
      return (data as unknown as CompletedPreptestRow[]) ?? []
    },

    async listAnswerEventsForSessions(sessionIds: string[], userId: string) {
      if (sessionIds.length === 0) return []
      const { data, error } = await client
        .from('answer_events')
        .select(
          'practice_session_id, question_id, is_correct, selected_answer, section_type, created_at',
        )
        .eq('user_id', userId)
        .in('practice_session_id', sessionIds)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data as {
        practice_session_id: string
        question_id: string
        is_correct: boolean
        selected_answer: string
        section_type: 'LR' | 'RC' | 'LG' | null
        created_at: string
      }[]) ?? []
    },

    async listAnswerEventsWithTypes(userId: string) {
      const { data, error } = await client
        .from('answer_events')
        .select('question_type_id, is_correct')
        .eq('user_id', userId)
        .not('question_type_id', 'is', null)
      if (error) throw error
      return (data as { question_type_id: string; is_correct: boolean }[]) ?? []
    },

    async listAnswerEventsWithTypeDifficulty(userId: string) {
      const { data, error } = await client
        .from('answer_events')
        .select('question_type_id, difficulty')
        .eq('user_id', userId)
        .not('question_type_id', 'is', null)
      if (error) throw error
      return (data as { question_type_id: string; difficulty: number | null }[]) ?? []
    },

    async getPracticeSession(sessionId: string, userId: string) {
      const { data, error } = await client
        .from('practice_sessions')
        .select(
          `
          id,
          kind,
          prep_test_id,
          completed_at,
          started_at,
          raw_score,
          scaled_score,
          percentile,
          blind_review_raw_score,
          blind_review_scaled_score,
          blind_review_percentile,
          blind_review_completed_at,
          excluded,
          metadata,
          admin_prep_tests ( title, module_id )
        `,
        )
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data as PracticeSessionDetailRow | null
    },

    async resolveCompletedPrepTestSession(userId: string, sessionIdOrPrepTestId: string) {
      const direct = await this.getPracticeSession(sessionIdOrPrepTestId, userId)
      if (direct?.kind === 'PREPTEST' && direct.completed_at) {
        return direct
      }

      const { data, error } = await client
        .from('practice_sessions')
        .select(
          `
          id,
          kind,
          prep_test_id,
          completed_at,
          started_at,
          raw_score,
          scaled_score,
          percentile,
          blind_review_raw_score,
          blind_review_scaled_score,
          blind_review_percentile,
          blind_review_completed_at,
          excluded,
          metadata,
          admin_prep_tests ( title, module_id )
        `,
        )
        .eq('user_id', userId)
        .eq('prep_test_id', sessionIdOrPrepTestId)
        .eq('kind', 'PREPTEST')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as PracticeSessionDetailRow | null) ?? null
    },

    async listSectionSessionsForPrepTest(userId: string, prepTestId: string) {
      const { data, error } = await client
        .from('practice_sessions')
        .select('id, section_id, started_at, completed_at, raw_score')
        .eq('user_id', userId)
        .eq('prep_test_id', prepTestId)
        .eq('kind', 'SECTION')
        .not('completed_at', 'is', null)
      if (error) throw error
      return (data as {
        id: string
        section_id: string | null
        started_at: string
        completed_at: string
        raw_score: number | null
      }[]) ?? []
    },

    async listCompletedSectionSessions(userId: string) {
      const { data, error } = await client
        .from('practice_sessions')
        .select('id, prep_test_id, section_id, started_at, completed_at, raw_score, metadata')
        .eq('user_id', userId)
        .eq('kind', 'SECTION')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true })
      if (error) throw error
      return (data as {
        id: string
        prep_test_id: string | null
        section_id: string | null
        started_at: string
        completed_at: string
        raw_score: number | null
        metadata: Record<string, unknown>
      }[]) ?? []
    },

    async getScoreRowForRaw(prepTestId: string, rawScore: number): Promise<{
      scaled_score: number | null
      percentile: number | null
    } | null> {
      const { data: table, error: tErr } = await client
        .from('admin_score_tables')
        .select('id')
        .eq('prep_test_id', prepTestId)
        .maybeSingle()
      if (tErr) throw tErr
      const tableRow = table as { id: string } | null
      if (!tableRow) return null

      const { data: row, error } = await client
        .from('admin_score_rows')
        .select('scaled_score, percentile')
        .eq('score_table_id', tableRow.id)
        .eq('raw_score', rawScore)
        .maybeSingle()
      if (error) throw error
      return (row as { scaled_score: number | null; percentile: number | null } | null) ?? null
    },

    async listPrepTestQuestionsWithMeta(prepTestId: string) {
      const { data, error } = await client
        .from('admin_questions')
        .select(
          `
          id,
          question_number,
          stem_text,
          correct_answer,
          difficulty,
          question_type_id,
          question_types ( name ),
          admin_sections!inner (
            id,
            section_type,
            section_number,
            title,
            prep_test_id
          )
        `,
        )
        .eq('admin_sections.prep_test_id', prepTestId)
        .order('question_number', { ascending: true })
      if (error) throw error
      return (data ?? []) as Array<Record<string, unknown>>
    },

    async listQuestionTypesByIds(ids: string[]): Promise<QuestionTypeRow[]> {
      if (ids.length === 0) return []
      const { data, error } = await client
        .from('question_types')
        .select('id, name, section_type, goal_accuracy, avg_per_test')
        .in('id', ids)
        .eq('is_active', true)
      if (error) throw error
      return (data as QuestionTypeRow[]) ?? []
    },

    async listSessions(input: {
      userId: string
      kind?: PracticeSessionKind
      bookmarked?: boolean
      limit: number
      offset: number
    }): Promise<PracticeSessionListRow[]> {
      let q = client
        .from('practice_sessions')
        .select(
          `
          id,
          kind,
          prep_test_id,
          section_id,
          started_at,
          completed_at,
          raw_score,
          scaled_score,
          percentile,
          blind_review_raw_score,
          blind_review_scaled_score,
          blind_review_percentile,
          bookmarked,
          excluded,
          metadata,
          admin_prep_tests ( title ),
          admin_sections ( title, section_type )
        `,
        )
        .eq('user_id', input.userId)
        .order('started_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (input.kind) {
        q = q.eq('kind', input.kind)
      }
      if (input.bookmarked === true) {
        q = q.eq('bookmarked', true)
      }

      const { data, error } = await q
      if (error) throw error
      return (data as unknown as PracticeSessionListRow[]) ?? []
    },

    async countSessions(input: {
      userId: string
      kind?: PracticeSessionKind
      bookmarked?: boolean
    }): Promise<number> {
      let q = client
        .from('practice_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', input.userId)

      if (input.kind) {
        q = q.eq('kind', input.kind)
      }
      if (input.bookmarked === true) {
        q = q.eq('bookmarked', true)
      }

      const { count, error } = await q
      if (error) throw error
      return count ?? 0
    },

    async countAnswerEventsByKind(userId: string, sessionKind: PracticeSessionKind): Promise<number> {
      const { count, error } = await client
        .from('answer_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('session_kind', sessionKind)
      if (error) throw error
      return count ?? 0
    },

    async fetchKindSectionAccuracy(userId: string, sessionKind: PracticeSessionKind) {
      const { data, error } = await client
        .from('answer_events')
        .select('section_type, is_correct')
        .eq('user_id', userId)
        .eq('session_kind', sessionKind)
      if (error) throw error
      return (data as { section_type: 'LR' | 'RC' | 'LG' | null; is_correct: boolean }[]) ?? []
    },

    async listAnswerEventsForExplanationIndex(userId: string, limit: number) {
      const { data, error } = await client
        .from('answer_events')
        .select('question_id, created_at, section_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data as {
        question_id: string
        created_at: string
        section_type: 'LR' | 'RC' | 'LG' | null
      }[]) ?? []
    },

    /**
     * PrepTest questions with admin-authored explanation or video.
     * Uses view `admin_questions_explanation_catalog` so limit/order apply only to matching rows.
     */
    async listAdminQuestionsWithExplanationContent(limit: number): Promise<QuestionExplanationMetaRow[]> {
      const { data, error } = await client
        .from('admin_questions_explanation_catalog')
        .select(
          `
          id,
          question_number,
          explanation,
          video_url,
          updated_at,
          question_types ( name ),
          admin_sections!inner (
            section_type,
            section_number,
            admin_prep_tests ( title )
          )
        `,
        )
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data as QuestionExplanationMetaRow[]) ?? []
    },

    async listQuestionsExplanationMetaByIds(questionIds: string[]) {
      if (questionIds.length === 0) return []
      const { data, error } = await client
        .from('admin_questions')
        .select(
          `
          id,
          question_number,
          explanation,
          video_url,
          question_types ( name ),
          admin_sections (
            section_type,
            section_number,
            admin_prep_tests ( title )
          )
        `,
        )
        .in('id', questionIds)
      if (error) throw error
      return (data as QuestionExplanationMetaRow[]) ?? []
    },

    async countAnswerEventsForQuestion(userId: string, questionId: string): Promise<number> {
      const { count, error } = await client
        .from('answer_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .limit(1)
      if (error) throw error
      return count ?? 0
    },

    async getQuestionExplanationPayload(questionId: string) {
      const { data, error } = await client
        .from('admin_questions')
        .select(
          `
          id,
          question_number,
          explanation,
          video_url,
          question_types ( name ),
          admin_sections (
            section_type,
            section_number,
            admin_prep_tests ( title )
          )
        `,
        )
        .eq('id', questionId)
        .maybeSingle()
      if (error) throw error
      return (data as QuestionExplanationMetaRow | null) ?? null
    },
  }
}

export type AnalyticsRepository = ReturnType<typeof createAnalyticsRepository>
