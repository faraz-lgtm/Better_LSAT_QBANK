import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const MINI_DIAGNOSTIC_MODULE_ID = 'DIAG-MINI'
export const MINI_DIAGNOSTIC_SECTION_ID = 'DIAG-MINI-LR-1'

export type MiniDiagnosticQuestionRow = {
  source_item_id: string
  question_number: number | null
  stimulus_text: string | null
  stem_text: string | null
  choices: unknown
  correct_answer: string | null
  explanation: string | null
  difficulty: number | null
  source_label: string | null
}

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

export function createDiagnosticRepository(client: SupabaseClient) {
  return {
    async listMiniDiagnosticQuestions(): Promise<MiniDiagnosticQuestionRow[]> {
      const { data: section, error: sectionError } = await client
        .from('admin_sections')
        .select('id')
        .eq('module_id', MINI_DIAGNOSTIC_MODULE_ID)
        .eq('section_id', MINI_DIAGNOSTIC_SECTION_ID)
        .maybeSingle()

      if (sectionError) throw sectionError
      if (!section?.id) return []

      const { data, error } = await client
        .from('admin_questions')
        .select(
          'source_item_id, question_number, stimulus_text, stem_text, choices, correct_answer, explanation, difficulty, source_label',
        )
        .eq('section_id', section.id)
        .order('question_number', { ascending: true })

      if (error) throw error
      return (data ?? []) as MiniDiagnosticQuestionRow[]
    },
  }
}

export type DiagnosticRepository = ReturnType<typeof createDiagnosticRepository>
