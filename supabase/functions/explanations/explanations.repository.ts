import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

export type PrepTestRow = {
  id: string
  module_id: string
  title: string | null
  imported_at: string | null
}

export type PrepTestTreeQuestionRow = {
  id: string
  question_number: number | null
  source_group_id: string | null
  stem_text: string | null
  stimulus_text: string | null
  explanation: string | null
  video_url: string | null
  difficulty: number | null
}

export type PrepTestTreePassageRow = {
  id: string
  source_group_id: string | null
  content: string | null
  topic_tag: string | null
}

export type PrepTestTreeLogicGameRow = {
  id: string
  source_group_id: string | null
  setup_text: string | null
  rules_text: string | null
}

export type PrepTestTreeSectionRow = {
  id: string
  section_id: string | null
  section_number: number | null
  section_type: 'LR' | 'RC' | 'LG' | null
  title: string | null
  admin_passages?: PrepTestTreePassageRow[] | null
  admin_logic_games?: PrepTestTreeLogicGameRow[] | null
  admin_questions?: PrepTestTreeQuestionRow[] | null
}

export type PrepTestTreePrepTestRow = {
  id: string
  module_id: string
  title: string | null
  admin_sections?: PrepTestTreeSectionRow[] | null
}

export type QuestionDetailRow = {
  id: string
  question_number: number | null
  source_group_id: string | null
  stimulus_text: string | null
  stem_text: string | null
  choices: unknown
  correct_answer: string | null
  explanation: string | null
  video_url: string | null
  difficulty: number | null
  question_types: { name: string } | { name: string }[] | null
  admin_sections: {
    id: string
    section_type: 'LR' | 'RC' | 'LG' | null
    section_number: number | null
    title: string | null
    admin_prep_tests: { id: string; title: string; module_id: string } | { id: string; title: string; module_id: string }[] | null
    admin_passages?: PrepTestTreePassageRow[] | null
    admin_logic_games?: PrepTestTreeLogicGameRow[] | null
  } | {
    id: string
    section_type: 'LR' | 'RC' | 'LG' | null
    section_number: number | null
    title: string | null
    admin_prep_tests: { id: string; title: string; module_id: string } | { id: string; title: string; module_id: string }[] | null
    admin_passages?: PrepTestTreePassageRow[] | null
    admin_logic_games?: PrepTestTreeLogicGameRow[] | null
  }[] | null
}

const prepTestTreeSelect = `
  id,
  module_id,
  title,
  admin_sections (
    id,
    section_id,
    section_number,
    section_type,
    title,
    admin_passages ( id, source_group_id, content, topic_tag ),
    admin_logic_games ( id, source_group_id, setup_text, rules_text ),
    admin_questions (
      id,
      question_number,
      source_group_id,
      stem_text,
      stimulus_text,
      explanation,
      video_url,
      difficulty
    )
  )
`

const questionDetailSelect = `
  id,
  question_number,
  source_group_id,
  stimulus_text,
  stem_text,
  choices,
  correct_answer,
  explanation,
  video_url,
  difficulty,
  question_types ( name ),
  admin_sections (
    id,
    section_type,
    section_number,
    title,
    admin_prep_tests ( id, title, module_id ),
    admin_passages ( id, source_group_id, content, topic_tag ),
    admin_logic_games ( id, source_group_id, setup_text, rules_text )
  )
`

export function createExplanationsRepository(client: SupabaseClient) {
  return {
    async listAllPrepTestRows(): Promise<PrepTestRow[]> {
      const { data, error } = await client
        .from('admin_prep_tests')
        .select('id,module_id,title,imported_at')
      if (error) throw error
      return (data as PrepTestRow[]) ?? []
    },

    async resolvePrepTestGroup(prepTestId: string): Promise<{
      primary: PrepTestRow
      prepTestIds: string[]
      baseModuleId: string
    }> {
      const { data: primary, error: primaryErr } = await client
        .from('admin_prep_tests')
        .select('id,module_id,title,imported_at')
        .eq('id', prepTestId)
        .single()
      if (primaryErr) throw primaryErr

      const moduleId = String(primary.module_id ?? '')
      const isSplitModule = /^LSAC\d+:.+$/i.test(moduleId)
      if (!isSplitModule) {
        return {
          primary: primary as PrepTestRow,
          prepTestIds: [String(primary.id)],
          baseModuleId: moduleId,
        }
      }

      const baseModuleId = moduleId.split(':')[0] ?? moduleId
      const { data: groupedRows, error: groupedErr } = await client
        .from('admin_prep_tests')
        .select('id,module_id,title,imported_at')
        .ilike('module_id', `${baseModuleId}:%`)
        .order('module_id', { ascending: true })
      if (groupedErr) throw groupedErr

      const rows = (groupedRows ?? []) as PrepTestRow[]
      return {
        primary: primary as PrepTestRow,
        prepTestIds: rows.length > 0 ? rows.map((row) => String(row.id)) : [String(primary.id)],
        baseModuleId,
      }
    },

    async fetchPrepTestTreeRows(prepTestIds: string[]): Promise<PrepTestTreePrepTestRow[]> {
      const { data, error } = await client
        .from('admin_prep_tests')
        .select(prepTestTreeSelect)
        .in('id', prepTestIds)
      if (error) throw error
      return (data as PrepTestTreePrepTestRow[]) ?? []
    },

    async fetchQuestionStatsForPrepTestIds(prepTestIds: string[]): Promise<{
      questionCount: number
      explainedCount: number
    }> {
      if (prepTestIds.length === 0) return { questionCount: 0, explainedCount: 0 }

      const { data: sections, error: secErr } = await client
        .from('admin_sections')
        .select('id')
        .in('prep_test_id', prepTestIds)
      if (secErr) throw secErr
      const sectionIds = ((sections ?? []) as { id: string }[]).map((s) => s.id)
      if (sectionIds.length === 0) return { questionCount: 0, explainedCount: 0 }

      const { data: questions, error: qErr } = await client
        .from('admin_questions')
        .select('id,explanation,video_url')
        .in('section_id', sectionIds)
      if (qErr) throw qErr

      const rows = (questions ?? []) as { id: string; explanation: string | null; video_url: string | null }[]
      let explainedCount = 0
      for (const q of rows) {
        const hasExpl = (q.explanation?.trim() ?? '').length > 0
        const hasVid = (q.video_url?.trim() ?? '').length > 0
        if (hasExpl || hasVid) explainedCount += 1
      }
      return { questionCount: rows.length, explainedCount }
    },

    async getQuestionDetail(questionId: string): Promise<QuestionDetailRow | null> {
      const { data, error } = await client
        .from('admin_questions')
        .select(questionDetailSelect)
        .eq('id', questionId)
        .maybeSingle()
      if (error) throw error
      return (data as QuestionDetailRow | null) ?? null
    },

    async listLsatCatalogQuestionIds(): Promise<string[]> {
      const { data: prepRows, error: ptErr } = await client
        .from('admin_prep_tests')
        .select('id')
        .ilike('module_id', 'LSAC%')
      if (ptErr) throw ptErr
      const prepTestIds = ((prepRows ?? []) as { id: string }[]).map((r) => r.id)
      if (prepTestIds.length === 0) return []

      const sectionIds: string[] = []
      const chunkSize = 100
      for (let i = 0; i < prepTestIds.length; i += chunkSize) {
        const chunk = prepTestIds.slice(i, i + chunkSize)
        const { data: sections, error: secErr } = await client
          .from('admin_sections')
          .select('id')
          .in('prep_test_id', chunk)
        if (secErr) throw secErr
        sectionIds.push(...((sections ?? []) as { id: string }[]).map((s) => s.id))
      }
      if (sectionIds.length === 0) return []

      const questionIds: string[] = []
      for (let i = 0; i < sectionIds.length; i += chunkSize) {
        const chunk = sectionIds.slice(i, i + chunkSize)
        const { data: questions, error: qErr } = await client
          .from('admin_questions')
          .select('id')
          .in('section_id', chunk)
        if (qErr) throw qErr
        questionIds.push(...((questions ?? []) as { id: string }[]).map((q) => q.id))
      }
      return questionIds
    },

    async listDistinctAnsweredQuestionIdsForUser(userId: string): Promise<string[]> {
      const pageSize = 1000
      const out = new Set<string>()
      let from = 0
      while (true) {
        const { data, error } = await client
          .from('answer_events')
          .select('question_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1)
        if (error) throw error
        const rows = (data ?? []) as { question_id: string }[]
        for (const row of rows) out.add(row.question_id)
        if (rows.length < pageSize) break
        from += pageSize
      }
      return [...out]
    },

    async listPrepTestQuestionProgress(userId: string): Promise<{
      seenQuestionIds: string[]
      inProcessQuestionIds: string[]
      answeredQuestionIds: string[]
    }> {
      const { data: sessions, error: sessionErr } = await client
        .from('practice_sessions')
        .select('metadata')
        .eq('user_id', userId)
        .not('prep_test_id', 'is', null)
        .in('kind', ['SECTION', 'PREPTEST'])
      if (sessionErr) throw sessionErr

      const seenRaw = new Set<string>()
      for (const row of (sessions ?? []) as { metadata: Record<string, unknown> | null }[]) {
        const ids = row.metadata?.seenQuestionIds
        if (!Array.isArray(ids)) continue
        for (const id of ids) {
          if (typeof id === 'string' && id.length > 0) seenRaw.add(id)
        }
      }

      const { data: events, error: eventErr } = await client
        .from('answer_events')
        .select('question_id, created_at, practice_sessions!inner(prep_test_id, completed_at, kind)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (eventErr) throw eventErr

      type EventRow = {
        question_id: string
        created_at: string
        practice_sessions:
          | { prep_test_id: string | null; completed_at: string | null; kind: string }
          | { prep_test_id: string | null; completed_at: string | null; kind: string }[]
      }

      const latestAnswerByQuestion = new Map<string, boolean>()
      for (const row of (events ?? []) as EventRow[]) {
        const session = Array.isArray(row.practice_sessions)
          ? row.practice_sessions[0]
          : row.practice_sessions
        if (!session?.prep_test_id) continue
        if (session.kind !== 'SECTION' && session.kind !== 'PREPTEST') continue
        if (latestAnswerByQuestion.has(row.question_id)) continue
        latestAnswerByQuestion.set(row.question_id, session.completed_at != null)
      }

      const answeredQuestionIds: string[] = []
      const inProcessQuestionIds: string[] = []
      for (const [questionId, completed] of latestAnswerByQuestion) {
        if (completed) answeredQuestionIds.push(questionId)
        else inProcessQuestionIds.push(questionId)
      }

      const answeredSet = new Set(answeredQuestionIds)
      const inProcessSet = new Set(inProcessQuestionIds)
      const seenQuestionIds = [...seenRaw].filter(
        (id) => !answeredSet.has(id) && !inProcessSet.has(id),
      )

      return { seenQuestionIds, inProcessQuestionIds, answeredQuestionIds }
    },

    async listLatestAnswerStatusByQuestionIds(
      userId: string,
      questionIds: string[],
    ): Promise<Map<string, 'answered' | 'in_process'>> {
      const out = new Map<string, 'answered' | 'in_process'>()
      if (questionIds.length === 0) return out

      const { data, error } = await client
        .from('answer_events')
        .select('question_id, practice_session_id, created_at')
        .eq('user_id', userId)
        .in('question_id', questionIds)
        .order('created_at', { ascending: false })
      if (error) throw error

      const seen = new Set<string>()
      for (const row of (data ?? []) as { question_id: string; practice_session_id: string }[]) {
        if (seen.has(row.question_id)) continue
        seen.add(row.question_id)
        out.set(row.question_id, 'answered')
      }
      return out
    },

    /** Latest submitted answer per user for platform-wide popularity on one question. */
    async listLatestAnswerSelectionsForQuestion(questionId: string): Promise<string[]> {
      const pageSize = 1000
      const latestByUser = new Map<string, string>()
      let from = 0
      while (true) {
        const { data, error } = await client
          .from('answer_events')
          .select('user_id, selected_answer, created_at')
          .eq('question_id', questionId)
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1)
        if (error) throw error
        const rows = (data ?? []) as { user_id: string; selected_answer: string }[]
        for (const row of rows) {
          if (latestByUser.has(row.user_id)) continue
          const answer = row.selected_answer?.trim()
          if (answer) latestByUser.set(row.user_id, answer)
        }
        if (rows.length < pageSize) break
        from += pageSize
      }
      return [...latestByUser.values()]
    },
  }
}

export type ExplanationsRepository = ReturnType<typeof createExplanationsRepository>
