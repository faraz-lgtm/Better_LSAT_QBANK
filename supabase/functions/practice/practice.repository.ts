import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

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

const drillQuestionSelect = `
  id,
  question_number,
  source_group_id,
  stimulus_text,
  stem_text,
  choices,
  correct_answer,
  admin_sections (
    id,
    section_type,
    section_number,
    title,
    admin_passages ( id, source_group_id, content, topic_tag )
  )
`

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
          admin_sections!inner ( section_type )
        `,
        )
        .eq('admin_sections.section_type', input.sectionType)

      if (input.questionTypeId) {
        q = q.eq('question_type_id', input.questionTypeId)
      }

      if (input.difficulty === 'easy') {
        q = q.lte('difficulty', 2)
      } else if (input.difficulty === 'hard') {
        q = q.gte('difficulty', 4)
      }

      const { data, error } = await q
      if (error) throw error

      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        section_id: row.section_id != null ? String(row.section_id) : null,
        source_group_id: row.source_group_id != null ? String(row.source_group_id) : null,
        difficulty: typeof row.difficulty === 'number' ? row.difficulty : null,
        question_type_id: row.question_type_id != null ? String(row.question_type_id) : null,
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
          admin_prep_tests ( id, title, module_id ),
          admin_questions (count)
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
        const questions = row.admin_questions
        const questionCount = questionCountFromRelation(questions)
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

    async listQuestionIdsBySectionId(sectionId: string): Promise<string[]> {
      const { data, error } = await client
        .from('admin_questions')
        .select('id')
        .eq('section_id', sectionId)
        .order('question_number', { ascending: true, nullsFirst: false })
      if (error) throw error
      return ((data ?? []) as { id: string }[]).map((r) => r.id)
    },

    async getDrillQuestionRowsByIds(questionIds: string[]): Promise<DrillQuestionRow[]> {
      if (questionIds.length === 0) return []
      const { data, error } = await client
        .from('admin_questions')
        .select(drillQuestionSelect)
        .in('id', questionIds)
      if (error) throw error
      const rows = (data as DrillQuestionRow[]) ?? []
      const byId = new Map(rows.map((r) => [r.id, r]))
      return questionIds.map((id) => byId.get(id)).filter((r): r is DrillQuestionRow => Boolean(r))
    },

    async listPrepTestPoolRows(): Promise<PrepTestPoolRow[]> {
      const { data, error } = await client
        .from('admin_prep_tests')
        .select(
          `
          id,
          module_id,
          title,
          admin_sections (
            id,
            section_type,
            admin_questions (count)
          )
        `,
        )
        .order('module_id', { ascending: true })
      if (error) throw error

      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
        const sectionsRaw = row.admin_sections
        const sectionsArr = Array.isArray(sectionsRaw) ? sectionsRaw : sectionsRaw ? [sectionsRaw] : []
        const sections = sectionsArr.map((s) => {
          const sec = s as Record<string, unknown>
          const questions = sec.admin_questions
          const questionCount = questionCountFromRelation(questions)
          return {
            id: String(sec.id),
            sectionType: sec.section_type as 'LR' | 'RC' | 'LG',
            questionCount,
          }
        })
        return {
          id: String(row.id),
          moduleId: String(row.module_id),
          title: row.title != null ? String(row.title) : null,
          sections,
        }
      })
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
            admin_questions ( id )
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
          const questions = sec.admin_questions
          const questionCount = Array.isArray(questions) ? questions.length : 0
          return {
            id: String(sec.id),
            sectionId: sec.section_id != null ? String(sec.section_id) : null,
            sectionNumber: typeof sec.section_number === 'number' ? sec.section_number : null,
            sectionType: sec.section_type as 'LR' | 'RC' | 'LG',
            title: sec.title != null ? String(sec.title) : null,
            questionCount,
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

    async listUserSessionsForPrepTest(userId: string, prepTestId: string): Promise<PracticeSessionRow[]> {
      const { data, error } = await client
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('prep_test_id', prepTestId)
        .in('kind', ['PREPTEST', 'SECTION'])
        .order('started_at', { ascending: false })
      if (error) throw error
      return (data as PracticeSessionRow[]) ?? []
    },

    async listUserSessionsForPrepTests(userId: string): Promise<PracticeSessionRow[]> {
      const { data, error } = await client
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('prep_test_id', 'is', null)
        .in('kind', ['PREPTEST', 'SECTION'])
        .order('started_at', { ascending: false })
      if (error) throw error
      return (data as PracticeSessionRow[]) ?? []
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
