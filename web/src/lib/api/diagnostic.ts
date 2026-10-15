import type { SupabaseClient } from '@supabase/supabase-js'

import { handleUsersInvokeError } from '@/lib/auth/handle-unauthorized-session'

export type MiniDiagnosticExplanationChoice = {
  letter: string
  text: string
  explanation: string | null
}

export type MiniDiagnosticExplanation = {
  sourceItemId: string
  questionNumber: number
  questionType: string | null
  difficulty: number | null
  stimulusText: string | null
  stemText: string
  correctAnswer: string | null
  explanationHtml: string | null
  videoUrl: string | null
  choices: MiniDiagnosticExplanationChoice[]
}

export type DiagnosticVideoUrl = {
  sourceItemId: string
  videoUrl: string
  /** CSS aspect-ratio from Gumlet oEmbed when available. */
  aspectRatio?: string | null
}

export type MiniDiagnosticExplanationsResponse = {
  explanationsLocked: boolean
  explanations: MiniDiagnosticExplanation[]
  /** Mini + Section diagnostic videos for Video Explanation tab visibility. */
  videoUrls?: DiagnosticVideoUrl[]
}

export type MailerLiteDiagnosticType = 'mini' | 'full'

export type DiagnosticSyncMailerliteInput = {
  diagnosticDone: boolean
  diagnosticType?: MailerLiteDiagnosticType | null
  /** Guest intent id (`mini` | `quick` | `full`); mapped server-side when type omitted. */
  intentId?: string | null
  /** Scaled / final diagnostic LSAT score (typically 120–180). */
  diagnosticScore?: number | null
}

export type DiagnosticSyncMailerliteResponse = {
  synced: boolean
}

export function createDiagnosticApi(supabase: SupabaseClient) {
  async function invokeDiagnosticPost<T>(
    functionName: string,
    body?: Record<string, unknown>,
  ): Promise<{ data: T | null; error: unknown }> {
    const maybeAuth = (supabase as unknown as {
      auth?: { getSession?: () => Promise<{ data: { session: { access_token?: string } | null } }> }
    }).auth
    const sessionResult = maybeAuth?.getSession ? await maybeAuth.getSession() : null
    const accessToken = sessionResult?.data?.session?.access_token
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
    const result = await supabase.functions.invoke<T>(functionName, {
      method: 'POST',
      body: body ?? {},
      headers,
    })
    if (result.error) await handleUsersInvokeError(supabase, result.error)
    return result
  }

  return {
    async getMiniDiagnosticExplanations(): Promise<MiniDiagnosticExplanationsResponse> {
      const { data, error } = await invokeDiagnosticPost<MiniDiagnosticExplanationsResponse>(
        'diagnostic-get-mini-explanations',
      )
      if (error) throw error
      if (!data) throw new Error('No diagnostic explanations payload returned')
      return data
    },

    /** Upserts MailerLite custom fields: email, diagnostic_done, diagnostic_type, diagnostic_score. */
    async syncMailerlite(input: DiagnosticSyncMailerliteInput): Promise<DiagnosticSyncMailerliteResponse> {
      const { data, error } = await invokeDiagnosticPost<DiagnosticSyncMailerliteResponse>(
        'diagnostic-sync-mailerlite',
        {
          diagnosticDone: input.diagnosticDone,
          diagnosticType: input.diagnosticType ?? undefined,
          intentId: input.intentId ?? undefined,
          diagnosticScore: input.diagnosticScore ?? undefined,
        },
      )
      if (error) throw error
      if (!data) throw new Error('No MailerLite diagnostic sync payload returned')
      return data
    },
  }
}
