import type { SupabaseClient } from '@supabase/supabase-js'

import { handleUsersInvokeError } from '@/lib/auth/handle-unauthorized-session'

export type LsacDeepLinkInput = {
  testId: string
  sectionId?: string
  itemId?: string
}

/**
 * LawHub Provider integration API (deep links). Server-side LSAC credentials only.
 */
export function createLsacApi(supabase: SupabaseClient) {
  async function invokeLsacPost<T>(
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
    async getDeepLinkUrl(input: LsacDeepLinkInput): Promise<string> {
      const { data, error } = await invokeLsacPost<{ url: string }>('lsac-deeplink', { ...input })
      if (error) throw error
      if (!data?.url) throw new Error('No deep link URL in response')
      return data.url
    },
  }
}
