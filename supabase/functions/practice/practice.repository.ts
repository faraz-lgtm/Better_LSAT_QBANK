import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

import { isStudentVisiblePrepTest } from '../_shared/prep-test-visibility.ts'

import type { DrillQuestionRow } from './practice.mapper.ts'

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
  blind_review_raw_score: number | null
  blind_review_scaled_score: number | null
  blind_review_percentile: number | null
  blind_review_completed_at: string | null
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
  time_spent_seconds?: number | null
}

export type QuestionDetailRow = {
  id: string
  correct_answer: string | null
  difficulty: number | null
  question_type_id: string | null
  section_id: string | null
  admin_sections: { section_type: 'LR' | 'RC' | 'LG' | null; prep_test_id: string } | null
}

export type DrillPoolQuestionRow = {
  id: string
  section_id: string | null
  source_group_id: string | null
  difficulty: number | null
  question_type_id: string | null
  prep_test_id: string | null
  module_id: string | null
}

/** Richer pool row for the Pick-my-own question browser. */
export type DrillPickerPoolQuestionRow = DrillPoolQuestionRow & {
  question_number: number | null
  section_number: number | null
  stimulus_text: string | null
  stem_text: string | null
  tag_label: string | null
  search_text?: string | null
}

export type DrillPickerAnswerSummary = {
  question_id: string
  is_correct: boolean
  time_spent_seconds: number | null
  created_at: string
}

export type PrepTestPoolOverrideRow = {
  prep_test_id: string
  in_drills: boolean
  in_sections: boolean
  in_tests: boolean
}

export type PrepTestFreshnessRow = {
  prepTestId: string
  totalQuestions: number
  answeredQuestions: number
}

export type SectionPoolRow = {
  id: string
  sectionId: string | null
  sectionNumber: number | null
  sectionType: 'LR' | 'RC' | 'LG'
  title: string | null
  moduleId: string | null
  prepTestId: string
  prepTestTitle: string | null
  questionCount: number
}

export type SectionDetailRow = {
  id: string
  section_id: string | null
  section_number: number | null
  section_type: 'LR' | 'RC' | 'LG' | null
  title: string | null
  module_id: string | null
  prep_test_id: string
  admin_prep_tests: { id: string; title: string | null; module_id: string } | null
}

export type PrepTestPoolRow = {
  id: string
  moduleId: string
  title: string | null
  sections: Array<{
    id: string
    sectionType: 'LR' | 'RC' | 'LG'
    questionCount: number
  }>
}

export type PrepTestDetailRow = {
  id: string
  moduleId: string
  title: string | null
  sections: Array<{
    id: string
    sectionId: string | null
    sectionNumber: number | null
    sectionType: 'LR' | 'RC' | 'LG'
    title: string | null
    questionCount: number
    isExperimental?: boolean
  }>
}

function questionCountFromRelation(questions: unknown): number {
  if (!Array.isArray(questions)) return 0
  if (questions.length === 0) return 0
  const first = questions[0]
  if (first && typeof first === 'object' && first !== null && 'count' in first) {
    const n = Number((first as { count: number }).count)
    return Number.isFinite(n) ? n : 0
  }
  return questions.length
}

export function sectionQuestionCount(row: { question_count?: unknown; admin_questions?: unknown }): number {
  if (typeof row.question_count === 'number' && Number.isFinite(row.question_count)) {
    return Math.max(0, Math.floor(row.question_count))
  }
  return questionCountFromRelation(row.admin_questions)
}

/** Questions only — passages load once per section (avoids RC content × N duplication). */
const drillQuestionSelect = `
  id,
  question_number,
  source_group_id,
  stimulus_text,
  stem_text,
  choices,
  correct_answer,
  difficulty,
  admin_sections (
    id,
    section_type,
    section_number,
    title
  )
`

type PassageDbRow = {
  id: string
  section_id: string
  source_group_id: string | null
  content: string | null
  topic_tag: string | null
}

function sectionIdFromQuestionRow(row: DrillQuestionRow): string | null {
  const sec = row.admin_sections
  const one = Array.isArray(sec) ? sec[0] : sec
  return one?.id ?? null
}

function isRcQuestionRow(row: DrillQuestionRow): boolean {
  const sec = row.admin_sections
  const one = Array.isArray(sec) ? sec[0] : sec
  return one?.section_type === 'RC'
}

function attachPassagesToQuestionRows(
  rows: DrillQuestionRow[],
  passagesBySectionId: Map<string, PassageDbRow[]>,
): DrillQuestionRow[] {
  if (passagesBySectionId.size === 0) return rows
  return rows.map((row) => {
    const sectionId = sectionIdFromQuestionRow(row)
    if (!sectionId || !isRcQuestionRow(row)) return row
    const passages = passagesBySectionId.get(sectionId)
    if (!passages?.length) return row
    const sec = row.admin_sections
    const one = Array.isArray(sec) ? sec[0] : sec
    if (!one) return row
    return {
      ...row,
      admin_sections: {
        ...one,
        admin_passages: passages.map((p) => ({
          id: p.id,
          source_group_id: p.source_group_id,
          content: p.content,
          topic_tag: p.topic_tag,
        })),
      },
    }
  })
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
  async function listPassagesBySectionIds(sectionIds: string[]): Promise<Map<string, PassageDbRow[]>> {
    const unique = [...new Set(sectionIds.filter(Boolean))]
    const bySection = new Map<string, PassageDbRow[]>()
    if (unique.length === 0) return bySection
    const { data, error } = await client
      .from('admin_passages')
      .select('id, section_id, source_group_id, content, topic_tag')
      .in('section_id', unique)
    if (error) throw error
    for (const row of (data as PassageDbRow[]) ?? []) {
      const list = bySection.get(row.section_id) ?? []
      list.push(row)
      bySection.set(row.section_id, list)
    }
    return bySection
  }

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

    async findPrepTestIdByModuleId(moduleId: string): Promise<string | null> {
      const base = (moduleId.split(':')[0] ?? moduleId).trim()
      if (!/^LSAC\d+$/i.test(base)) return null
      const { data, error } = await client
        .from('admin_prep_tests')
        .select('id,module_id')
        .or(`module_id.eq.${base},module_id.ilike.${base}:%`)
      if (error) throw error
      const rows = (data ?? []) as Array<{ id: string; module_id: string }>
      if (rows.length === 0) return null
      const exact = rows.find((row) => row.module_id.toUpperCase() === base.toUpperCase())
      return exact?.id ?? rows[0]?.id ?? null
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
      timeSpentSeconds?: number | null
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
          time_spent_seconds: input.timeSpentSeconds ?? null,
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

    async listAnswerEventsForSessions(sessionIds: string[], userId: string): Promise<AnswerEventRow[]> {
      if (sessionIds.length === 0) return []
      const { data, error } = await client
        .from('answer_events')
        .select('*')
        .eq('user_id', userId)
        .in('practice_session_id', sessionIds)
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
        blind_review_raw_score?: number | null
        blind_review_scaled_score?: number | null
        blind_review_percentile?: number | null
        blind_review_completed_at?: string | null
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

    async listDrillPoolQuestions(input: {
      sectionType: 'LR' | 'RC'
      questionTypeId?: string | null
      questionTypeIds?: string[] | null
      difficulty?: 'adaptive' | 'easy' | 'hard' | null
    }): Promise<DrillPoolQuestionRow[]> {
      let q = client
        .from('admin_questions')
        .select(
          `
          id,
          section_id,
          source_group_id,
          difficulty,
          question_type_id,
          admin_sections!inner (
            section_type,
            module_id,
            prep_test_id,
            admin_prep_tests ( id, module_id )
          )
        `,
        )
        .eq('admin_sections.section_type', input.sectionType)

      const typeIds = Array.isArray(input.questionTypeIds)
        ? input.questionTypeIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        : []
      if (typeIds.length > 0) {
        q = q.in('question_type_id', typeIds)
      } else if (input.questionTypeId) {
        q = q.eq('question_type_id', input.questionTypeId)
      }

      if (input.difficulty === 'easy') {
        q = q.lte('difficulty', 2)
      } else if (input.difficulty === 'hard') {
        q = q.gte('difficulty', 4)
      }

      const { data, error } = await q
      if (error) throw error

      return ((data ?? []) as Array<Record<string, unknown>>)
        .filter((row) => {
          const secRaw = row.admin_sections
          const sec = Array.isArray(secRaw) ? secRaw[0] : secRaw
          const secObj = sec as
            | {
                module_id?: string | null
                prep_test_id?: string | null
                admin_prep_tests?:
                  | { id?: string; module_id?: string }
                  | { id?: string; module_id?: string }[]
                  | null
              }
            | null
            | undefined
          const ptRaw = secObj?.admin_prep_tests
          const pt = Array.isArray(ptRaw) ? ptRaw[0] : ptRaw
          const moduleId = pt?.module_id ?? secObj?.module_id ?? null
          return isStudentVisiblePrepTest(moduleId)
        })
        .map((row) => {
          const secRaw = row.admin_sections
          const sec = Array.isArray(secRaw) ? secRaw[0] : secRaw
          const secObj = sec as
            | {
                prep_test_id?: string | null
                module_id?: string | null
                admin_prep_tests?:
                  | { id?: string; module_id?: string }
                  | { id?: string; module_id?: string }[]
                  | null
              }
            | null
            | undefined
          const ptRaw = secObj?.admin_prep_tests
          const pt = Array.isArray(ptRaw) ? ptRaw[0] : ptRaw
          const prepTestId = pt?.id ?? secObj?.prep_test_id ?? null
          const moduleId = pt?.module_id ?? secObj?.module_id ?? null
          return {
            id: String(row.id),
            section_id: row.section_id != null ? String(row.section_id) : null,
            source_group_id: row.source_group_id != null ? String(row.source_group_id) : null,
            difficulty: typeof row.difficulty === 'number' ? row.difficulty : null,
            question_type_id: row.question_type_id != null ? String(row.question_type_id) : null,
            prep_test_id: prepTestId != null ? String(prepTestId) : null,
            module_id: moduleId != null ? String(moduleId) : null,
          }
        })
    },

    async listDrillPickerPoolQuestions(input: {
      sectionType: 'LR' | 'RC'
    }): Promise<DrillPickerPoolQuestionRow[]> {
      const { data, error } = await client.rpc('list_drill_picker_pool_questions', {
        p_section_type: input.sectionType,
      })
      if (error) throw error
      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        section_id: row.section_id != null ? String(row.section_id) : null,
        source_group_id: row.source_group_id != null ? String(row.source_group_id) : null,
        difficulty: typeof row.difficulty === 'number' ? row.difficulty : null,
        question_type_id: row.question_type_id != null ? String(row.question_type_id) : null,
        prep_test_id: row.prep_test_id != null ? String(row.prep_test_id) : null,
        module_id: row.module_id != null ? String(row.module_id) : null,
        question_number: typeof row.question_number === 'number' ? row.question_number : null,
        section_number: typeof row.section_number === 'number' ? row.section_number : null,
        stimulus_text: null,
        stem_text: null,
        tag_label: row.tag_label != null ? String(row.tag_label) : null,
        search_text: row.search_text != null ? String(row.search_text) : null,
      }))
    },

    async listLatestAnswerSummariesForUser(userId: string): Promise<DrillPickerAnswerSummary[]> {
      const { data, error } = await client.rpc('latest_answer_summaries_for_user', {
        p_user_id: userId,
      })
      if (error) throw error
      const coerceSeconds = (value: unknown): number | null => {
        if (typeof value === 'number' && Number.isFinite(value)) return value
        if (typeof value === 'string' && value.trim()) {
          const n = Number(value)
          return Number.isFinite(n) ? n : null
        }
        return null
      }
      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        question_id: String(row.question_id),
        is_correct: Boolean(row.is_correct),
        time_spent_seconds: coerceSeconds(row.time_spent_seconds),
        created_at: typeof row.created_at === 'string' ? row.created_at : '',
      }))
    },

    async listUserPrepTestPoolOverrides(userId: string): Promise<PrepTestPoolOverrideRow[]> {
      const { data, error } = await client
        .from('student_prep_test_pool_overrides')
        .select('prep_test_id, in_drills, in_sections, in_tests')
        .eq('user_id', userId)
      if (error) throw error
      return ((data ?? []) as PrepTestPoolOverrideRow[]).map((row) => ({
        prep_test_id: String(row.prep_test_id),
        in_drills: Boolean(row.in_drills),
        in_sections: Boolean(row.in_sections),
        in_tests: Boolean(row.in_tests),
      }))
    },

    async upsertUserPrepTestPoolOverrides(
      userId: string,
      rows: PrepTestPoolOverrideRow[],
    ): Promise<void> {
      if (rows.length === 0) return
      const payload = rows.map((row) => ({
        user_id: userId,
        prep_test_id: row.prep_test_id,
        in_drills: row.in_drills,
        in_sections: row.in_sections,
        in_tests: row.in_tests,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await client
        .from('student_prep_test_pool_overrides')
        .upsert(payload, { onConflict: 'user_id,prep_test_id' })
      if (error) throw error
    },

    async deleteUserPrepTestPoolOverrides(userId: string): Promise<void> {
      const { error } = await client
        .from('student_prep_test_pool_overrides')
        .delete()
        .eq('user_id', userId)
      if (error) throw error
    },

    async listPrepTestFreshnessRows(userId: string): Promise<PrepTestFreshnessRow[]> {
      const { data, error } = await client.rpc('prep_test_freshness_for_user', {
        p_user_id: userId,
      })
      if (error) throw error
      return ((data ?? []) as Array<{ prep_test_id: string; total: number; answered: number }>).map((row) => ({
        prepTestId: String(row.prep_test_id),
        totalQuestions: Number(row.total) || 0,
        answeredQuestions: Number(row.answered) || 0,
      }))
    },

    async listUserAnsweredQuestionIds(userId: string): Promise<string[]> {
      const { data, error } = await client
        .from('answer_events')
        .select('question_id')
        .eq('user_id', userId)
      if (error) throw error
      const ids = new Set<string>()
      for (const row of (data ?? []) as { question_id: string }[]) {
        ids.add(row.question_id)
      }
      return [...ids]
    },

    async listSectionPoolRows(input: { sectionType?: 'LR' | 'RC' }): Promise<SectionPoolRow[]> {
      let q = client
        .from('admin_sections')
        .select(
          `
          id,
          section_id,
          section_number,
          section_type,
          title,
          module_id,
          prep_test_id,
          question_count,
          admin_prep_tests ( id, title, module_id )
        `,
        )
        .in('section_type', ['LR', 'RC'])
        .order('module_id', { ascending: true })
        .order('section_number', { ascending: true })

      if (input.sectionType) {
        q = q.eq('section_type', input.sectionType)
      }

      const { data, error } = await q
      if (error) throw error

      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
        const questionCount = sectionQuestionCount(row)
        const ptRaw = row.admin_prep_tests
        const pt = Array.isArray(ptRaw) ? ptRaw[0] : ptRaw
        const ptObj = pt as { id: string; title: string | null; module_id: string } | null | undefined
        return {
          id: String(row.id),
          sectionId: row.section_id != null ? String(row.section_id) : null,
          sectionNumber: typeof row.section_number === 'number' ? row.section_number : null,
          sectionType: row.section_type as 'LR' | 'RC' | 'LG',
          title: row.title != null ? String(row.title) : null,
          moduleId: row.module_id != null ? String(row.module_id) : null,
          prepTestId: String(row.prep_test_id),
          prepTestTitle: ptObj?.title ?? ptObj?.module_id ?? null,
          questionCount,
        }
      })
    },

    async getSectionDetail(sectionId: string): Promise<SectionDetailRow | null> {
      const { data, error } = await client
        .from('admin_sections')
        .select(
          `
          id,
          section_id,
          section_number,
          section_type,
          title,
          module_id,
          prep_test_id,
          admin_prep_tests ( id, title, module_id )
        `,
        )
        .eq('id', sectionId)
        .maybeSingle()
      if (error) throw error
      return (data as SectionDetailRow | null) ?? null
    },

    async listQuestionIdsBySectionId(
      sectionId: string,
      difficulty?: 'adaptive' | 'easy' | 'hard' | null,
    ): Promise<string[]> {
      let q = client
        .from('admin_questions')
        .select('id')
        .eq('section_id', sectionId)
        .order('question_number', { ascending: true, nullsFirst: false })

      if (difficulty === 'easy') {
        q = q.lte('difficulty', 2)
      } else if (difficulty === 'hard') {
        q = q.gte('difficulty', 4)
      }

      const { data, error } = await q
      if (error) throw error
      return ((data ?? []) as { id: string }[]).map((r) => r.id)
    },

    listPassagesBySectionIds,

    /**
     * Loads drill/section questions. RC passage HTML is fetched once per section
     * (optionally in parallel when `passageSectionIds` is known).
     */
    async getDrillQuestionRowsByIds(
      questionIds: string[],
      options?: { passageSectionIds?: string[] },
    ): Promise<DrillQuestionRow[]> {
      if (questionIds.length === 0) return []

      const knownPassageSectionIds = options?.passageSectionIds?.filter(Boolean) ?? []
      const questionsQuery = client
        .from('admin_questions')
        .select(drillQuestionSelect)
        .in('id', questionIds)

      const [questionsResult, knownPassages] = await Promise.all([
        questionsQuery,
        knownPassageSectionIds.length > 0
          ? listPassagesBySectionIds(knownPassageSectionIds)
          : Promise.resolve(new Map<string, PassageDbRow[]>()),
      ])

      if (questionsResult.error) throw questionsResult.error
      const rows = (questionsResult.data as DrillQuestionRow[]) ?? []
      const byId = new Map(rows.map((r) => [r.id, r]))
      const ordered = questionIds.map((id) => byId.get(id)).filter((r): r is DrillQuestionRow => Boolean(r))

      let passagesBySectionId = knownPassages
      if (passagesBySectionId.size === 0) {
        const rcSectionIds = [
          ...new Set(
            ordered.filter(isRcQuestionRow).map(sectionIdFromQuestionRow).filter((id): id is string => Boolean(id)),
          ),
        ]
        if (rcSectionIds.length > 0) {
          passagesBySectionId = await listPassagesBySectionIds(rcSectionIds)
        }
      }

      return attachPassagesToQuestionRows(ordered, passagesBySectionId)
    },

    async listStudentPrepTestPoolPage(input: {
      userId: string
      filter: 'fresh' | 'in_progress' | 'completed' | 'blind_review' | null
      page: number
      pageSize: number
      sort: 'newest' | 'oldest'
    }): Promise<{
      prepTests: Array<Record<string, unknown>>
      total: number
      page: number
      pageSize: number
      statusCounts: {
        all: number
        fresh: number
        in_progress: number
        completed: number
        blind_review: number
      }
    } | null> {
      const { data, error } = await client.rpc('list_student_prep_test_pool', {
        p_user_id: input.userId,
        p_filter: input.filter,
        p_page: input.page,
        p_page_size: input.pageSize,
        p_sort: input.sort,
      })
      if (error) {
        const message = String(error.message ?? '')
        // Older environments may not have the RPC yet — fall back to the JS path.
        if (
          error.code === 'PGRST202' ||
          /could not find the function|does not exist/i.test(message)
        ) {
          return null
        }
        throw error
      }
      if (!data || typeof data !== 'object') return null
      const payload = data as Record<string, unknown>
      const statusCountsRaw = (payload.statusCounts ?? {}) as Record<string, unknown>
      const prepTests = Array.isArray(payload.prepTests)
        ? (payload.prepTests as Array<Record<string, unknown>>)
        : []
      return {
        prepTests,
        total: typeof payload.total === 'number' ? payload.total : prepTests.length,
        page: typeof payload.page === 'number' ? payload.page : input.page,
        pageSize: typeof payload.pageSize === 'number' ? payload.pageSize : input.pageSize,
        statusCounts: {
          all: typeof statusCountsRaw.all === 'number' ? statusCountsRaw.all : 0,
          fresh: typeof statusCountsRaw.fresh === 'number' ? statusCountsRaw.fresh : 0,
          in_progress:
            typeof statusCountsRaw.in_progress === 'number' ? statusCountsRaw.in_progress : 0,
          completed: typeof statusCountsRaw.completed === 'number' ? statusCountsRaw.completed : 0,
          blind_review:
            typeof statusCountsRaw.blind_review === 'number' ? statusCountsRaw.blind_review : 0,
        },
      }
    },

    async listPrepTestPoolRows(): Promise<PrepTestPoolRow[]> {
      const catalog = await client.rpc('list_visible_prep_test_pool_catalog')
      if (!catalog.error && Array.isArray(catalog.data)) {
        return (catalog.data as Array<{
          id: string
          module_id: string
          title: string | null
          sections: unknown
        }>).map((row) => {
          const sectionsRaw = Array.isArray(row.sections) ? row.sections : []
          return {
            id: String(row.id),
            moduleId: String(row.module_id),
            title: row.title != null ? String(row.title) : null,
            sections: sectionsRaw
              .map((section) => {
                const sec = section as Record<string, unknown>
                const sectionType = sec.sectionType ?? sec.section_type
                const id = sec.id
                if (typeof id !== 'string' || typeof sectionType !== 'string') return null
                const questionCountRaw = sec.questionCount ?? sec.question_count
                return {
                  id: String(id),
                  sectionType: sectionType as 'LR' | 'RC' | 'LG',
                  questionCount:
                    typeof questionCountRaw === 'number' ? Math.max(0, questionCountRaw) : 0,
                }
              })
              .filter((section): section is PrepTestPoolRow['sections'][number] => Boolean(section)),
          }
        })
      }

      // Fallback for environments that have not applied the catalog RPC yet.
      const { data, error } = await client.rpc('list_visible_prep_test_pool_rows')
      if (error) throw error

      const byId = new Map<string, PrepTestPoolRow>()
      for (const row of (data ?? []) as Array<{
        id: string
        module_id: string
        title: string | null
        section_id: string | null
        section_type: string | null
        question_count: number | null
      }>) {
        const id = String(row.id)
        let entry = byId.get(id)
        if (!entry) {
          entry = {
            id,
            moduleId: String(row.module_id),
            title: row.title != null ? String(row.title) : null,
            sections: [],
          }
          byId.set(id, entry)
        }
        if (row.section_id && row.section_type) {
          entry.sections.push({
            id: String(row.section_id),
            sectionType: row.section_type as 'LR' | 'RC' | 'LG',
            questionCount: typeof row.question_count === 'number' ? Math.max(0, row.question_count) : 0,
          })
        }
      }
      return [...byId.values()]
    },

    async getPrepTestDetailRow(prepTestId: string): Promise<PrepTestDetailRow | null> {
      const { data, error } = await client
        .from('admin_prep_tests')
        .select(
          `
          id,
          module_id,
          title,
          admin_sections (
            id,
            section_id,
            section_number,
            section_type,
            title,
            is_experimental,
            question_count
          )
        `,
        )
        .eq('id', prepTestId)
        .maybeSingle()
      if (error) throw error
      if (!data) return null

      const row = data as Record<string, unknown>
      const sectionsRaw = row.admin_sections
      const sectionsArr = Array.isArray(sectionsRaw) ? sectionsRaw : sectionsRaw ? [sectionsRaw] : []
      const sections = sectionsArr
        .map((s) => {
          const sec = s as Record<string, unknown>
          const questionCount = sectionQuestionCount(sec)
          return {
            id: String(sec.id),
            sectionId: sec.section_id != null ? String(sec.section_id) : null,
            sectionNumber: typeof sec.section_number === 'number' ? sec.section_number : null,
            sectionType: sec.section_type as 'LR' | 'RC' | 'LG',
            title: sec.title != null ? String(sec.title) : null,
            questionCount,
            isExperimental: sec.is_experimental === true,
          }
        })
        .sort((a, b) => (a.sectionNumber ?? 0) - (b.sectionNumber ?? 0))

      return {
        id: String(row.id),
        moduleId: String(row.module_id),
        title: row.title != null ? String(row.title) : null,
        sections,
      }
    },

    /**
     * Single-round-trip hub payload. Returns null when the RPC is missing or the
     * id is not a visible admin_prep_tests.id (caller should fall back).
     */
    async getPrepTestHubDetail(
      userId: string,
      prepTestId: string,
    ): Promise<{ row: PrepTestDetailRow; sessions: PracticeSessionRow[] } | null> {
      const { data, error } = await client.rpc('get_student_prep_test_hub_detail', {
        p_user_id: userId,
        p_prep_test_id: prepTestId,
      })
      if (error) {
        const message = String(error.message ?? '')
        if (
          error.code === 'PGRST202' ||
          error.code === '22P02' || // invalid uuid input
          /could not find the function|does not exist|invalid input syntax for type uuid/i.test(
            message,
          )
        ) {
          return null
        }
        throw error
      }
      if (!data || typeof data !== 'object') return null

      const payload = data as Record<string, unknown>
      const rowRaw = payload.row
      if (!rowRaw || typeof rowRaw !== 'object') return null
      const rowObj = rowRaw as Record<string, unknown>
      const sectionsRaw = Array.isArray(rowObj.sections) ? rowObj.sections : []
      const sections = sectionsRaw.map((s) => {
        const sec = s as Record<string, unknown>
        return {
          id: String(sec.id),
          sectionId: sec.sectionId != null ? String(sec.sectionId) : null,
          sectionNumber: typeof sec.sectionNumber === 'number' ? sec.sectionNumber : null,
          sectionType: sec.sectionType as 'LR' | 'RC' | 'LG',
          title: sec.title != null ? String(sec.title) : null,
          questionCount: typeof sec.questionCount === 'number' ? Math.max(0, sec.questionCount) : 0,
          isExperimental: sec.isExperimental === true,
        }
      })

      const sessionsRaw = Array.isArray(payload.sessions) ? payload.sessions : []
      const sessions: PracticeSessionRow[] = sessionsRaw.map((raw) => {
        const s = raw as Record<string, unknown>
        return {
          id: String(s.id),
          user_id: String(s.user_id ?? userId),
          kind: s.kind as PracticeSessionKind,
          prep_test_id: s.prep_test_id != null ? String(s.prep_test_id) : null,
          section_id: s.section_id != null ? String(s.section_id) : null,
          started_at: String(s.started_at),
          completed_at: s.completed_at != null ? String(s.completed_at) : null,
          raw_score: typeof s.raw_score === 'number' ? s.raw_score : null,
          scaled_score: typeof s.scaled_score === 'number' ? s.scaled_score : null,
          percentile: typeof s.percentile === 'number' ? s.percentile : null,
          blind_review_raw_score:
            typeof s.blind_review_raw_score === 'number' ? s.blind_review_raw_score : null,
          blind_review_scaled_score:
            typeof s.blind_review_scaled_score === 'number' ? s.blind_review_scaled_score : null,
          blind_review_percentile:
            typeof s.blind_review_percentile === 'number' ? s.blind_review_percentile : null,
          blind_review_completed_at:
            s.blind_review_completed_at != null ? String(s.blind_review_completed_at) : null,
          bookmarked: s.bookmarked === true,
          excluded: s.excluded === true,
          metadata: (s.metadata ?? {}) as Record<string, unknown>,
          created_at: s.created_at != null ? String(s.created_at) : String(s.started_at),
          updated_at: s.updated_at != null ? String(s.updated_at) : String(s.started_at),
        }
      })

      return {
        row: {
          id: String(rowObj.id),
          moduleId: String(rowObj.moduleId),
          title: rowObj.title != null ? String(rowObj.title) : null,
          sections,
        },
        sessions,
      }
    },

    async listUserSessionsForPrepTest(userId: string, prepTestId: string): Promise<PracticeSessionRow[]> {
      // Hub/detail only needs SECTION progress counts — not full answer metadata blobs.
      // Fetch PREPTEST (full metadata for config/BR flags) + SECTION (slim) in parallel.
      const prepTestSelect = `
          id,
          user_id,
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
          blind_review_completed_at,
          bookmarked,
          excluded,
          metadata,
          created_at,
          updated_at
        `
      const sectionSelect = `
          id,
          user_id,
          kind,
          prep_test_id,
          section_id,
          started_at,
          completed_at,
          raw_score,
          scaled_score,
          answered_question_ids:metadata->answeredQuestionIds,
          question_ids:metadata->questionIds
        `

      const [prepTests, sections] = await Promise.all([
        client
          .from('practice_sessions')
          .select(prepTestSelect)
          .eq('user_id', userId)
          .eq('prep_test_id', prepTestId)
          .eq('kind', 'PREPTEST')
          .order('started_at', { ascending: false }),
        client
          .from('practice_sessions')
          .select(sectionSelect)
          .eq('user_id', userId)
          .eq('prep_test_id', prepTestId)
          .eq('kind', 'SECTION')
          .order('started_at', { ascending: false }),
      ])

      if (prepTests.error) throw prepTests.error
      if (sections.error) throw sections.error

      const normalizePrepTest = (row: Record<string, unknown>): PracticeSessionRow => ({
        id: String(row.id),
        user_id: String(row.user_id ?? userId),
        kind: 'PREPTEST',
        prep_test_id: row.prep_test_id != null ? String(row.prep_test_id) : null,
        section_id: row.section_id != null ? String(row.section_id) : null,
        started_at: String(row.started_at),
        completed_at: row.completed_at != null ? String(row.completed_at) : null,
        raw_score: typeof row.raw_score === 'number' ? row.raw_score : null,
        scaled_score: typeof row.scaled_score === 'number' ? row.scaled_score : null,
        percentile: typeof row.percentile === 'number' ? row.percentile : null,
        blind_review_raw_score:
          typeof row.blind_review_raw_score === 'number' ? row.blind_review_raw_score : null,
        blind_review_scaled_score:
          typeof row.blind_review_scaled_score === 'number' ? row.blind_review_scaled_score : null,
        blind_review_percentile:
          typeof row.blind_review_percentile === 'number' ? row.blind_review_percentile : null,
        blind_review_completed_at:
          row.blind_review_completed_at != null ? String(row.blind_review_completed_at) : null,
        bookmarked: row.bookmarked === true,
        excluded: row.excluded === true,
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
        created_at: row.created_at != null ? String(row.created_at) : String(row.started_at),
        updated_at: row.updated_at != null ? String(row.updated_at) : String(row.started_at),
      })

      const normalizeSection = (row: Record<string, unknown>): PracticeSessionRow => ({
        id: String(row.id),
        user_id: String(row.user_id ?? userId),
        kind: 'SECTION',
        prep_test_id: row.prep_test_id != null ? String(row.prep_test_id) : null,
        section_id: row.section_id != null ? String(row.section_id) : null,
        started_at: String(row.started_at),
        completed_at: row.completed_at != null ? String(row.completed_at) : null,
        raw_score: typeof row.raw_score === 'number' ? row.raw_score : null,
        scaled_score: typeof row.scaled_score === 'number' ? row.scaled_score : null,
        percentile: null,
        blind_review_raw_score: null,
        blind_review_scaled_score: null,
        blind_review_percentile: null,
        blind_review_completed_at: null,
        bookmarked: false,
        excluded: false,
        metadata: {
          answeredQuestionIds: Array.isArray(row.answered_question_ids) ? row.answered_question_ids : [],
          questionIds: Array.isArray(row.question_ids) ? row.question_ids : [],
        },
        created_at: String(row.started_at),
        updated_at: String(row.started_at),
      })

      const prepTestRows = ((prepTests.data ?? []) as Record<string, unknown>[]).map(normalizePrepTest)
      const sectionRows = ((sections.data ?? []) as Record<string, unknown>[]).map(normalizeSection)

      return [...prepTestRows, ...sectionRows].sort(
        (a, b) => Date.parse(b.started_at) - Date.parse(a.started_at),
      )
    },

    async listUserSessionsForPrepTests(userId: string): Promise<PracticeSessionRow[]> {
      // Pool listing only needs SECTION identity/scores — not multi-hundred-KB answer
      // metadata. Fetch PREPTEST + SECTION in parallel with different column sets.
      const prepTestSelect = `
          id,
          user_id,
          kind,
          prep_test_id,
          section_id,
          started_at,
          completed_at,
          raw_score,
          scaled_score,
          blind_review_raw_score,
          blind_review_scaled_score,
          blind_review_completed_at,
          metadata
        `
      const sectionSelect = `
          id,
          user_id,
          kind,
          prep_test_id,
          section_id,
          started_at,
          completed_at,
          raw_score,
          scaled_score
        `

      const [prepTests, sections] = await Promise.all([
        client
          .from('practice_sessions')
          .select(prepTestSelect)
          .eq('user_id', userId)
          .not('prep_test_id', 'is', null)
          .eq('kind', 'PREPTEST')
          .order('started_at', { ascending: false }),
        client
          .from('practice_sessions')
          .select(sectionSelect)
          .eq('user_id', userId)
          .not('prep_test_id', 'is', null)
          .eq('kind', 'SECTION')
          .order('started_at', { ascending: false }),
      ])

      if (prepTests.error) throw prepTests.error
      if (sections.error) throw sections.error

      const normalize = (
        row: Record<string, unknown>,
        kind: PracticeSessionKind,
      ): PracticeSessionRow => ({
        id: String(row.id),
        user_id: String(row.user_id ?? userId),
        kind,
        prep_test_id: row.prep_test_id != null ? String(row.prep_test_id) : null,
        section_id: row.section_id != null ? String(row.section_id) : null,
        started_at: String(row.started_at),
        completed_at: row.completed_at != null ? String(row.completed_at) : null,
        raw_score: typeof row.raw_score === 'number' ? row.raw_score : null,
        scaled_score: typeof row.scaled_score === 'number' ? row.scaled_score : null,
        percentile: typeof row.percentile === 'number' ? row.percentile : null,
        blind_review_raw_score:
          typeof row.blind_review_raw_score === 'number' ? row.blind_review_raw_score : null,
        blind_review_scaled_score:
          typeof row.blind_review_scaled_score === 'number' ? row.blind_review_scaled_score : null,
        blind_review_percentile:
          typeof row.blind_review_percentile === 'number' ? row.blind_review_percentile : null,
        blind_review_completed_at:
          row.blind_review_completed_at != null ? String(row.blind_review_completed_at) : null,
        bookmarked: row.bookmarked === true,
        excluded: row.excluded === true,
        metadata: ((row.metadata ?? {}) as Record<string, unknown>),
        created_at: row.created_at != null ? String(row.created_at) : String(row.started_at),
        updated_at: row.updated_at != null ? String(row.updated_at) : String(row.started_at),
      })

      const prepTestRows = ((prepTests.data ?? []) as Record<string, unknown>[]).map((row) =>
        normalize(row, 'PREPTEST'),
      )
      const sectionRows = ((sections.data ?? []) as Record<string, unknown>[]).map((row) =>
        normalize(row, 'SECTION'),
      )

      return [...prepTestRows, ...sectionRows].sort(
        (a, b) => Date.parse(b.started_at) - Date.parse(a.started_at),
      )
    },

    async getPublishedPrepLessonById(lessonId: string): Promise<{
      id: string
      slug: string
      title: string
      lesson_type: string
      summary: string | null
      text_content: string | null
      is_published: boolean
    } | null> {
      const { data, error } = await client
        .from('prep_lessons')
        .select('id,slug,title,lesson_type,summary,text_content,is_published')
        .eq('id', lessonId)
        .maybeSingle()
      if (error) throw error
      const row = data as {
        id: string
        slug: string
        title: string
        lesson_type: string
        summary: string | null
        text_content: string | null
        is_published: boolean
      } | null
      return row ?? null
    },

    async resolveQuestionIdFromReference(input: string): Promise<string | null> {
      const value = input.trim()
      if (!value) return null

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(value)) {
        const { data, error } = await client
          .from('admin_questions')
          .select('id')
          .eq('id', value)
          .maybeSingle()
        if (error) throw error
        return data?.id ? String(data.id) : null
      }

      const refMatch = value.match(/PT\s*0*(\d+)\D+S\s*(\d+)\D+Q\s*(\d+)/i)
      if (!refMatch) return null
      const prepTestNumber = Number(refMatch[1])
      const sectionNumber = Number(refMatch[2])
      const questionNumber = Number(refMatch[3])
      if (!Number.isFinite(prepTestNumber) || !Number.isFinite(sectionNumber) || !Number.isFinite(questionNumber)) {
        return null
      }

      const moduleId = `LSAC${String(prepTestNumber).padStart(3, '0')}`
      const { data: prepTests, error: prepErr } = await client
        .from('admin_prep_tests')
        .select('id,module_id')
        .or(`module_id.eq.${moduleId},module_id.ilike.${moduleId}:%`)
      if (prepErr) throw prepErr
      if (!prepTests || prepTests.length === 0) return null

      const prepTestIds = prepTests.map((row) => String((row as { id: string }).id))
      const { data: sections, error: sectionErr } = await client
        .from('admin_sections')
        .select('id,section_number')
        .in('prep_test_id', prepTestIds)
        .eq('section_number', sectionNumber)
      if (sectionErr) throw sectionErr
      if (!sections || sections.length === 0) return null

      const sectionIds = sections.map((row) => String((row as { id: string }).id))
      const { data: question, error: questionErr } = await client
        .from('admin_questions')
        .select('id')
        .in('section_id', sectionIds)
        .eq('question_number', questionNumber)
        .maybeSingle()
      if (questionErr) throw questionErr
      return question?.id ? String(question.id) : null
    },

    async listLessonQuestionIds(lessonId: string): Promise<string[]> {
      const { data, error } = await client
        .from('lesson_questions')
        .select('question_id,sort_order')
        .eq('lesson_id', lessonId)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return ((data ?? []) as { question_id: string }[])
        .map((row) => String(row.question_id))
        .filter((id) => id.length > 0)
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
      const rows = await this.listScoreRowsForRaw([{ prepTestId, rawScore }])
      return rows.get(`${prepTestId}:${rawScore}`) ?? null
    },
  }
}

export type PracticeRepository = ReturnType<typeof createPracticeRepository>
