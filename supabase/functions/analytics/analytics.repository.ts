import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

import { isStudentVisiblePrepTest } from '../_shared/prep-test-visibility.ts'

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
  admin_prep_tests: { title: string; module_id?: string } | { title: string; module_id?: string }[] | null
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
    admin_prep_tests: { title: string; module_id?: string } | { title: string; module_id?: string }[] | null
  } | {
    section_type: 'LR' | 'RC' | 'LG' | null
    section_number: number | null
    admin_prep_tests: { title: string; module_id?: string } | { title: string; module_id?: string }[] | null
  }[] | null
}

export function createAnalyticsRepository(client: SupabaseClient) {
  function prepTestModuleFromJoin(
    adminPrepTests: { module_id?: string } | { module_id?: string }[] | null | undefined,
  ): string | null {
    if (adminPrepTests == null) return null
    const row = Array.isArray(adminPrepTests) ? adminPrepTests[0] : adminPrepTests
    return row?.module_id ?? null
  }

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
    async listStudentVisiblePrepTestIds(): Promise<string[]> {
      const { data, error } = await client
        .from('admin_prep_tests')
        .select('id, module_id')
        .ilike('module_id', 'LSAC%')
      if (error) throw error
      return ((data ?? []) as { id: string; module_id: string }[])
        .filter((row) => isStudentVisiblePrepTest(row.module_id))
        .map((row) => row.id)
    },

    async resolveQuestionVisibility(
      questionIds: string[],
    ): Promise<Map<string, boolean>> {
      const out = new Map<string, boolean>()
      if (questionIds.length === 0) return out
      const unique = [...new Set(questionIds)]
      const chunkSize = 100
      for (let i = 0; i < unique.length; i += chunkSize) {
        const chunk = unique.slice(i, i + chunkSize)
        const { data, error } = await client
          .from('admin_questions')
          .select('id, admin_sections ( module_id, admin_prep_tests ( module_id ) )')
          .in('id', chunk)
        if (error) throw error
        for (const row of (data ?? []) as Array<Record<string, unknown>>) {
          const secRaw = row.admin_sections
          const sec = Array.isArray(secRaw) ? secRaw[0] : secRaw
          const secObj = sec as
            | {
                module_id?: string | null
                admin_prep_tests?: { module_id?: string } | { module_id?: string }[] | null
              }
            | null
            | undefined
          const moduleId =
            prepTestModuleFromJoin(secObj?.admin_prep_tests) ?? secObj?.module_id ?? null
          out.set(String(row.id), isStudentVisiblePrepTest(moduleId))
        }
      }
      for (const id of unique) {
        if (!out.has(id)) out.set(id, false)
      }
      return out
    },

    async countAnswerEvents(
      userId: string,
      opts?: { completedSince?: string },
    ): Promise<number> {
      const { data, error } = await client.rpc('count_user_visible_answer_events', {
        p_user_id: userId,
        p_completed_since: opts?.completedSince ?? null,
        p_session_kind: null,
      })
      if (error) throw error
      return parseStudyMinutesRpcValue(data)
    },

    async sumCompletedSessionStudyMinutes(
      userId: string,
      opts?: { completedSince?: string },
    ): Promise<number> {
      const { data, error } = await client.rpc('sum_user_practice_study_minutes', {
        p_user_id: userId,
        p_completed_since: opts?.completedSince ?? null,
      })
      if (error) throw error
      return parseStudyMinutesRpcValue(data)
    },

    async sumCompletedLessonStudyMinutes(
      userId: string,
      opts?: { completedSince?: string },
    ): Promise<number> {
      const { data, error } = await client.rpc('sum_user_lesson_study_minutes', {
        p_user_id: userId,
        p_completed_since: opts?.completedSince ?? null,
      })
      if (error) throw error
      return parseStudyMinutesRpcValue(data)
    },

    async countDrillAnswerEvents(
      userId: string,
      opts?: { completedSince?: string },
    ): Promise<{ correct: number; total: number }> {
      const { data, error } = await client.rpc('count_user_visible_drill_answer_events', {
        p_user_id: userId,
        p_completed_since: opts?.completedSince ?? null,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      const parsed = (row ?? {}) as { correct?: unknown; total?: unknown }
      return {
        correct: parseStudyMinutesRpcValue(parsed.correct),
        total: parseStudyMinutesRpcValue(parsed.total),
      }
    },

    async getOverviewCountStats(
      userId: string,
      opts?: { completedSince?: string },
    ): Promise<{
      totalQuestionsAnswered: number
      drillCorrect: number
      drillTotal: number
      practiceStudyMinutes: number
      lessonStudyMinutes: number
    }> {
      const { data, error } = await client.rpc('user_overview_count_stats', {
        p_user_id: userId,
        p_completed_since: opts?.completedSince ?? null,
      })
      if (error) throw error
      const row = (Array.isArray(data) ? data[0] : data) as {
        total_questions_answered?: unknown
        drill_correct?: unknown
        drill_total?: unknown
        practice_study_minutes?: unknown
        lesson_study_minutes?: unknown
      } | null
      return {
        totalQuestionsAnswered: parseStudyMinutesRpcValue(row?.total_questions_answered),
        drillCorrect: parseStudyMinutesRpcValue(row?.drill_correct),
        drillTotal: parseStudyMinutesRpcValue(row?.drill_total),
        practiceStudyMinutes: parseStudyMinutesRpcValue(row?.practice_study_minutes),
        lessonStudyMinutes: parseStudyMinutesRpcValue(row?.lesson_study_minutes),
      }
    },

    async listCompletedPreptests(
      userId: string,
      opts?: { completedSince?: string },
    ): Promise<CompletedPreptestRow[]> {
      let query = client
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
      if (opts?.completedSince) {
        query = query.gte('completed_at', opts.completedSince)
      }
      const { data, error } = await query.order('completed_at', { ascending: true })
      if (error) throw error
      return ((data as unknown as CompletedPreptestRow[]) ?? []).filter((row) =>
        isStudentVisiblePrepTest(prepTestModuleFromJoin(row.admin_prep_tests)),
      )
    },

    async listAnswerEventsForSessions(sessionIds: string[], userId: string) {
      if (sessionIds.length === 0) return []
      const { data, error } = await client
        .from('answer_events')
        .select(
          'practice_session_id, question_id, is_correct, selected_answer, section_type, created_at, time_spent_seconds',
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
        time_spent_seconds?: number | null
      }[]) ?? []
    },

    async getUserGoalScore(userId: string): Promise<number | null> {
      const { data, error } = await client
        .from('student_study_preferences')
        .select('goal_score')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      const score = (data as { goal_score: number | null } | null)?.goal_score
      return typeof score === 'number' && Number.isFinite(score) ? score : null
    },

    async listExcludedSessionIds(userId: string): Promise<Set<string>> {
      const { data, error } = await client
        .from('practice_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('excluded', true)
      if (error) throw error
      return new Set(((data as { id: string }[]) ?? []).map((row) => row.id))
    },

    async listAnswerEventsWithTypes(userId: string) {
      const { data, error } = await client.rpc('list_user_visible_answer_events_with_types', {
        p_user_id: userId,
      })
      if (error) throw error
      return ((data ?? []) as {
        question_type_id: string
        is_correct: boolean
        question_id: string
        session_kind: PracticeSessionKind
      }[]).map((row) => ({
        question_type_id: String(row.question_type_id),
        is_correct: Boolean(row.is_correct),
        question_id: String(row.question_id),
        session_kind: row.session_kind,
      }))
    },

    async listAnswerEventsForQuestionType(userId: string, questionTypeId: string) {
      const { data, error } = await client
        .from('answer_events')
        .select(
          `
          id,
          question_id,
          practice_session_id,
          is_correct,
          selected_answer,
          difficulty,
          section_type,
          session_kind,
          created_at
        `,
        )
        .eq('user_id', userId)
        .eq('question_type_id', questionTypeId)
        .order('created_at', { ascending: false })
      if (error) throw error
      const rows = (data as {
        id: string
        question_id: string
        practice_session_id: string
        is_correct: boolean
        selected_answer: string
        difficulty: number | null
        section_type: 'LR' | 'RC' | 'LG' | null
        session_kind: PracticeSessionKind
        created_at: string
      }[]) ?? []
      if (rows.length === 0) return []
      const visibility = await this.resolveQuestionVisibility(rows.map((row) => row.question_id))
      return rows.filter((row) => visibility.get(row.question_id) === true)
    },

    async listAnswerEventsWithTypeDifficulty(userId: string) {
      const { data, error } = await client.rpc('list_user_visible_answer_events_with_type_difficulty', {
        p_user_id: userId,
      })
      if (error) throw error
      return ((data ?? []) as { question_type_id: string; difficulty: number | null }[]).map((row) => ({
        question_type_id: String(row.question_type_id),
        difficulty: typeof row.difficulty === 'number' ? row.difficulty : null,
      }))
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

    async listCompletedSectionSessions(
      userId: string,
      opts?: { completedSince?: string },
    ) {
      const { data, error } = await client.rpc('list_user_completed_section_sessions_slim', {
        p_user_id: userId,
        p_completed_since: opts?.completedSince ?? null,
      })
      if (error) throw error
      type SectionSessionRow = {
        id: string
        prep_test_id: string | null
        section_id: string | null
        started_at: string
        completed_at: string
        raw_score: number | null
        metadata: Record<string, unknown>
        admin_sections: {
          is_experimental: boolean | null
          section_type?: 'LR' | 'RC' | 'LG' | null
          question_count?: number | null
        } | null
      }
      return ((data ?? []) as Array<{
        id: string
        prep_test_id: string | null
        section_id: string | null
        started_at: string
        completed_at: string
        raw_score: number | null
        is_experimental: boolean | null
        section_type: 'LR' | 'RC' | 'LG' | null
        question_count: number | null
      }>).map((row): SectionSessionRow => ({
        id: row.id,
        prep_test_id: row.prep_test_id,
        section_id: row.section_id,
        started_at: row.started_at,
        completed_at: row.completed_at,
        raw_score: row.raw_score,
        /** Slim RPC omits metadata; helpers read section_type / question_count from admin_sections. */
        metadata: {},
        admin_sections: {
          is_experimental: row.is_experimental,
          section_type: row.section_type,
          question_count: row.question_count ?? null,
        },
      }))
    },

    async listScoreRowsForRaw(
      pairs: Array<{ prepTestId: string; rawScore: number }>,
    ): Promise<Map<string, { scaled_score: number | null; percentile: number | null } | null>> {
      const out = new Map<string, { scaled_score: number | null; percentile: number | null } | null>()
      if (pairs.length === 0) return out

      const prepTestIds = [...new Set(pairs.map((pair) => pair.prepTestId))]
      const rawScores = [...new Set(pairs.map((pair) => pair.rawScore))]
      const { data: tables, error: tableErr } = await client
        .from('admin_score_tables')
        .select('id, prep_test_id')
        .in('prep_test_id', prepTestIds)
      if (tableErr) throw tableErr

      const tableIdByPrepTest = new Map<string, string>()
      for (const table of (tables ?? []) as Array<{ id: string; prep_test_id: string }>) {
        tableIdByPrepTest.set(String(table.prep_test_id), String(table.id))
      }

      const tableIds = [...new Set(tableIdByPrepTest.values())]
      const byTableRaw = new Map<string, { scaled_score: number | null; percentile: number | null }>()
      if (tableIds.length > 0) {
        const { data: rows, error } = await client
          .from('admin_score_rows')
          .select('score_table_id, raw_score, scaled_score, percentile')
          .in('score_table_id', tableIds)
          .in('raw_score', rawScores)
        if (error) throw error
        for (const row of (rows ?? []) as Array<{
          score_table_id: string
          raw_score: number
          scaled_score: number | null
          percentile: number | null
        }>) {
          byTableRaw.set(`${row.score_table_id}:${row.raw_score}`, {
            scaled_score: row.scaled_score,
            percentile: row.percentile,
          })
        }
      }

      for (const pair of pairs) {
        const key = `${pair.prepTestId}:${pair.rawScore}`
        const tableId = tableIdByPrepTest.get(pair.prepTestId)
        out.set(key, tableId ? byTableRaw.get(`${tableId}:${pair.rawScore}`) ?? null : null)
      }
      return out
    },

    async getScoreRowForRaw(prepTestId: string, rawScore: number): Promise<{
      scaled_score: number | null
      percentile: number | null
    } | null> {
      const { data, error } = await client
        .from('admin_score_rows')
        .select('scaled_score, percentile, admin_score_tables!inner(prep_test_id)')
        .eq('admin_score_tables.prep_test_id', prepTestId)
        .eq('raw_score', rawScore)
        .maybeSingle()
      if (error) throw error
      const row = data as { scaled_score: number | null; percentile: number | null } | null
      return row ? { scaled_score: row.scaled_score, percentile: row.percentile } : null
    },

    async getScoreRowForScaled(prepTestId: string, scaledScore: number): Promise<{
      scaled_score: number | null
      percentile: number | null
    } | null> {
      const lookup = await this.listScoreRowsForScaled([{ prepTestId, scaledScore }])
      return lookup.get(`${prepTestId}:${Math.round(scaledScore)}`) ?? null
    },

    async listScoreRowsForScaled(
      pairs: Array<{ prepTestId: string; scaledScore: number }>,
    ): Promise<Map<string, { scaled_score: number | null; percentile: number | null } | null>> {
      const out = new Map<string, { scaled_score: number | null; percentile: number | null } | null>()
      if (pairs.length === 0) return out

      const normalized = pairs.map((pair) => ({
        prepTestId: pair.prepTestId,
        scaledScore: Math.round(pair.scaledScore),
      }))
      const prepTestIds = [...new Set(normalized.map((pair) => pair.prepTestId))]
      const scaledScores = [...new Set(normalized.map((pair) => pair.scaledScore))]

      const { data: tables, error: tableErr } = await client
        .from('admin_score_tables')
        .select('id, prep_test_id')
        .in('prep_test_id', prepTestIds)
      if (tableErr) throw tableErr

      const tableIdByPrepTest = new Map<string, string>()
      for (const table of (tables ?? []) as Array<{ id: string; prep_test_id: string }>) {
        tableIdByPrepTest.set(String(table.prep_test_id), String(table.id))
      }

      const tableIds = [...new Set(tableIdByPrepTest.values())]
      /** Lowest raw_score wins when multiple rows share a scaled_score (matches prior .order/.limit(1)). */
      const byTableScaled = new Map<
        string,
        { scaled_score: number | null; percentile: number | null; raw_score: number }
      >()
      if (tableIds.length > 0 && scaledScores.length > 0) {
        const { data: rows, error } = await client
          .from('admin_score_rows')
          .select('score_table_id, raw_score, scaled_score, percentile')
          .in('score_table_id', tableIds)
          .in('scaled_score', scaledScores)
        if (error) throw error
        for (const row of (rows ?? []) as Array<{
          score_table_id: string
          raw_score: number
          scaled_score: number | null
          percentile: number | null
        }>) {
          const key = `${row.score_table_id}:${row.scaled_score}`
          const existing = byTableScaled.get(key)
          if (!existing || row.raw_score < existing.raw_score) {
            byTableScaled.set(key, {
              scaled_score: row.scaled_score,
              percentile: row.percentile,
              raw_score: row.raw_score,
            })
          }
        }
      }

      for (const pair of normalized) {
        const key = `${pair.prepTestId}:${pair.scaledScore}`
        const tableId = tableIdByPrepTest.get(pair.prepTestId)
        const hit = tableId ? byTableScaled.get(`${tableId}:${pair.scaledScore}`) : undefined
        out.set(
          key,
          hit
            ? { scaled_score: hit.scaled_score, percentile: hit.percentile }
            : null,
        )
      }
      return out
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
            prep_test_id,
            is_experimental
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
      /** When true, only completed sessions, ordered by completed_at desc. */
      completedOnly?: boolean
      /** When true, only sessions with completed_at null (in progress). */
      incompleteOnly?: boolean
      limit: number
      offset: number
    }): Promise<PracticeSessionListRow[]> {
      const needsPrepVisibility = input.kind !== 'DRILL'
      const visiblePrepTestIds = needsPrepVisibility
        ? await this.listStudentVisiblePrepTestIds()
        : []
      if (
        (input.kind === 'PREPTEST' || input.kind === 'SECTION') &&
        visiblePrepTestIds.length === 0
      ) {
        return []
      }
      const orderColumn = input.completedOnly ? 'completed_at' : 'started_at'
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
          admin_prep_tests ( title, module_id ),
          admin_sections ( title, section_type )
        `,
        )
        .eq('user_id', input.userId)
        .order(orderColumn, { ascending: false })

      if (input.completedOnly) {
        q = q.not('completed_at', 'is', null)
      } else if (input.incompleteOnly) {
        q = q.is('completed_at', null)
      }

      if (input.kind === 'PREPTEST' || input.kind === 'SECTION') {
        q = q.in('prep_test_id', visiblePrepTestIds)
      } else if (input.kind === 'DRILL') {
        q = q.eq('kind', 'DRILL')
      }

      if (input.kind) {
        q = q.eq('kind', input.kind)
      }
      if (input.bookmarked === true) {
        q = q.eq('bookmarked', true)
      }

      q = q.range(input.offset, input.offset + Math.max(0, input.limit) - 1)

      const { data, error } = await q
      if (error) throw error
      return (data as unknown as PracticeSessionListRow[]) ?? []
    },

    async countSessions(input: {
      userId: string
      kind?: PracticeSessionKind
      bookmarked?: boolean
      completedOnly?: boolean
      incompleteOnly?: boolean
    }): Promise<number> {
      let q = client
        .from('practice_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', input.userId)
      if (input.kind === 'PREPTEST' || input.kind === 'SECTION') {
        const visiblePrepTestIds = await this.listStudentVisiblePrepTestIds()
        if (visiblePrepTestIds.length === 0) return 0
        q = q.eq('kind', input.kind).in('prep_test_id', visiblePrepTestIds)
      } else if (input.kind) {
        q = q.eq('kind', input.kind)
      }
      if (input.completedOnly) q = q.not('completed_at', 'is', null)
      else if (input.incompleteOnly) q = q.is('completed_at', null)
      if (input.bookmarked === true) q = q.eq('bookmarked', true)
      const { count, error } = await q
      if (error) throw error
      return count ?? 0
    },

    async countAnswerEventsByKind(userId: string, sessionKind: PracticeSessionKind): Promise<number> {
      const { data, error } = await client.rpc('count_user_visible_answer_events', {
        p_user_id: userId,
        p_completed_since: null,
        p_session_kind: sessionKind,
      })
      if (error) throw error
      return parseStudyMinutesRpcValue(data)
    },

    async fetchKindSectionAccuracy(userId: string, sessionKind: PracticeSessionKind) {
      const { data, error } = await client.rpc('list_user_visible_kind_section_accuracy', {
        p_user_id: userId,
        p_session_kind: sessionKind,
      })
      if (error) throw error
      return ((data ?? []) as {
        section_type: 'LR' | 'RC' | 'LG' | null
        is_correct: boolean
      }[]).map((row) => ({
        section_type: row.section_type,
        is_correct: Boolean(row.is_correct),
      }))
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
            module_id,
            admin_prep_tests ( title, module_id )
          )
        `,
        )
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return ((data as QuestionExplanationMetaRow[]) ?? []).filter((row) => {
        const sec = Array.isArray(row.admin_sections) ? row.admin_sections[0] : row.admin_sections
        const moduleId =
          prepTestModuleFromJoin(sec?.admin_prep_tests) ??
          (sec as { module_id?: string | null } | null | undefined)?.module_id ??
          null
        return isStudentVisiblePrepTest(moduleId)
      })
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
            admin_prep_tests ( title, module_id )
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

    /**
     * Latest submitted answer per user for each question (platform-wide popularity).
     * Events are read newest-first so the first row per (question, user) wins.
     */
    async listLatestAnswerSelectionsByQuestionIds(
      questionIds: string[],
    ): Promise<Map<string, string[]>> {
      const unique = [...new Set(questionIds.map((id) => id.trim()).filter(Boolean))]
      const result = new Map<string, string[]>()
      for (const id of unique) result.set(id, [])
      if (unique.length === 0) return result

      const seen = new Set<string>()
      const chunkSize = 40
      const pageSize = 1000
      for (let i = 0; i < unique.length; i += chunkSize) {
        const chunk = unique.slice(i, i + chunkSize)
        let from = 0
        while (true) {
          const { data, error } = await client
            .from('answer_events')
            .select('question_id, user_id, selected_answer')
            .in('question_id', chunk)
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1)
          if (error) throw error
          const rows = (data ?? []) as {
            question_id: string
            user_id: string
            selected_answer: string | null
          }[]
          for (const row of rows) {
            const key = `${row.question_id}\0${row.user_id}`
            if (seen.has(key)) continue
            const answer = row.selected_answer?.trim()
            if (!answer) continue
            seen.add(key)
            result.get(row.question_id)?.push(answer)
          }
          if (rows.length < pageSize) break
          from += pageSize
        }
      }
      return result
    },
  }
}

export type AnalyticsRepository = ReturnType<typeof createAnalyticsRepository>
