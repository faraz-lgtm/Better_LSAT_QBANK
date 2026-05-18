import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type PracticeSessionKind = 'PREPTEST' | 'SECTION' | 'DRILL'

export type PracticeSessionRow = {
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

export type AnswerEventRow = {
  id: string
  user_id: string
  practice_session_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  question_type_id: string | null
  section_type: 'LR' | 'RC' | 'LG' | null
  difficulty: number | null
  session_kind: PracticeSessionKind
  created_at: string
}

export type QuestionDetailRow = {
  id: string
  correct_answer: string | null
  difficulty: number | null
  question_type_id: string | null
  section_id: string | null
  admin_sections: { section_type: 'LR' | 'RC' | 'LG' | null; prep_test_id: string } | null
}

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

export function createPracticeRepository(client: SupabaseClient) {
  return {
    async insertSession(input: {
      userId: string
      kind: PracticeSessionKind
      prepTestId: string | null
      sectionId: string | null
      metadata: Record<string, unknown>
    }): Promise<PracticeSessionRow> {
      const { data, error } = await client
        .from('practice_sessions')
        .insert({
          user_id: input.userId,
          kind: input.kind,
          prep_test_id: input.prepTestId,
          section_id: input.sectionId,
          metadata: input.metadata,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data as PracticeSessionRow
    },

    async getSessionById(sessionId: string, userId: string): Promise<PracticeSessionRow | null> {
      const { data, error } = await client
        .from('practice_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return (data as PracticeSessionRow | null) ?? null
    },

    async getSectionPrepTestId(sectionId: string): Promise<string | null> {
      const { data, error } = await client
        .from('admin_sections')
        .select('prep_test_id')
        .eq('id', sectionId)
        .maybeSingle()
      if (error) throw error
      const row = data as { prep_test_id: string } | null
      return row?.prep_test_id ?? null
    },

    async getPrepTestExists(prepTestId: string): Promise<boolean> {
      const { data, error } = await client
        .from('admin_prep_tests')
        .select('id')
        .eq('id', prepTestId)
        .maybeSingle()
      if (error) throw error
      return Boolean(data)
    },

    async getSectionExists(sectionId: string): Promise<boolean> {
      const { data, error } = await client
        .from('admin_sections')
        .select('id')
        .eq('id', sectionId)
        .maybeSingle()
      if (error) throw error
      return Boolean(data)
    },

    async getQuestionDetail(questionId: string): Promise<QuestionDetailRow | null> {
      const { data, error } = await client
        .from('admin_questions')
        .select(
          `
          id,
          correct_answer,
          difficulty,
          question_type_id,
          section_id,
          admin_sections ( section_type, prep_test_id )
        `,
        )
        .eq('id', questionId)
        .maybeSingle()
      if (error) throw error
      return (data as QuestionDetailRow | null) ?? null
    },

    async insertAnswerEvent(input: {
      userId: string
      practiceSessionId: string
      questionId: string
      selectedAnswer: string
      isCorrect: boolean
      questionTypeId: string | null
      sectionType: 'LR' | 'RC' | 'LG' | null
      difficulty: number | null
      sessionKind: PracticeSessionKind
    }): Promise<AnswerEventRow> {
      const { data, error } = await client
        .from('answer_events')
        .insert({
          user_id: input.userId,
          practice_session_id: input.practiceSessionId,
          question_id: input.questionId,
          selected_answer: input.selectedAnswer,
          is_correct: input.isCorrect,
          question_type_id: input.questionTypeId,
          section_type: input.sectionType,
          difficulty: input.difficulty,
          session_kind: input.sessionKind,
        })
        .select()
        .single()
      if (error) throw error
      return data as AnswerEventRow
    },

    async listAnswerEventsForSession(sessionId: string, userId: string): Promise<AnswerEventRow[]> {
      const { data, error } = await client
        .from('answer_events')
        .select('*')
        .eq('practice_session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data as AnswerEventRow[]) ?? []
    },

    async updateSession(
      sessionId: string,
      userId: string,
      patch: {
        completed_at?: string | null
        raw_score?: number | null
        scaled_score?: number | null
        percentile?: number | null
        bookmarked?: boolean
        excluded?: boolean
        metadata?: Record<string, unknown>
      },
    ): Promise<PracticeSessionRow> {
      const { data, error } = await client
        .from('practice_sessions')
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) throw error
      return data as PracticeSessionRow
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
  }
}

export type PracticeRepository = ReturnType<typeof createPracticeRepository>
