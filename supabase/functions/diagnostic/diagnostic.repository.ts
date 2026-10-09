import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const MINI_DIAGNOSTIC_MODULE_ID = 'DIAG-MINI'
export const MINI_DIAGNOSTIC_SECTION_ID = 'DIAG-MINI-LR-1'
export const SECTION_DIAGNOSTIC_MODULE_ID = 'DIAG-SEC'
export const SECTION_DIAGNOSTIC_SECTION_ID = 'DIAG-SEC-LR-1'

export type MiniDiagnosticQuestionRow = {
  source_item_id: string
  question_number: number | null
  stimulus_text: string | null
  stem_text: string | null
  choices: unknown
  correct_answer: string | null
  explanation: string | null
  video_url: string | null
  difficulty: number | null
  source_label: string | null
}

export type DiagnosticVideoUrlRow = {
  source_item_id: string
  video_url: string | null
}

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

async function listQuestionsForSection(
  client: SupabaseClient,
  moduleId: string,
  sectionId: string,
): Promise<MiniDiagnosticQuestionRow[]> {
  const { data: section, error: sectionError } = await client
    .from('admin_sections')
    .select('id')
    .eq('module_id', moduleId)
    .eq('section_id', sectionId)
    .maybeSingle()

  if (sectionError) throw sectionError
  if (!section?.id) return []

  const { data, error } = await client
    .from('admin_questions')
    .select(
      'source_item_id, question_number, stimulus_text, stem_text, choices, correct_answer, explanation, video_url, difficulty, source_label',
    )
    .eq('section_id', section.id)
    .order('question_number', { ascending: true })

  if (error) throw error
  return (data ?? []) as MiniDiagnosticQuestionRow[]
}

export function createDiagnosticRepository(client: SupabaseClient) {
  return {
    async listMiniDiagnosticQuestions(): Promise<MiniDiagnosticQuestionRow[]> {
      return await listQuestionsForSection(client, MINI_DIAGNOSTIC_MODULE_ID, MINI_DIAGNOSTIC_SECTION_ID)
    },

    /** Mini + Section diagnostic video URLs for explanation tab visibility. */
    async listDiagnosticVideoUrls(): Promise<DiagnosticVideoUrlRow[]> {
      const [mini, section] = await Promise.all([
        listQuestionsForSection(client, MINI_DIAGNOSTIC_MODULE_ID, MINI_DIAGNOSTIC_SECTION_ID),
        listQuestionsForSection(client, SECTION_DIAGNOSTIC_MODULE_ID, SECTION_DIAGNOSTIC_SECTION_ID),
      ])
      return [...mini, ...section].map((row) => ({
        source_item_id: row.source_item_id,
        video_url: row.video_url,
      }))
    },
  }
}

export type DiagnosticRepository = ReturnType<typeof createDiagnosticRepository>
