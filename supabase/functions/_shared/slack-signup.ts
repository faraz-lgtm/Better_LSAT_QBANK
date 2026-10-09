export type SlackSignupNotifyInput = {
  email: string
  userId?: string
  provider?: string
  createdAt?: string

  fetchImpl?: typeof fetch
  
  getEnv?: (key: string) => string | undefined
}

export type AuthUsersInsertPayload = {
  type: string
  table: string
  schema: string
  record: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

export type ParsedSignupInsert = {
  email: string
  userId: string
  provider: string
  createdAt: string | null
}


export async function notifySlackSignup(input: SlackSignupNotifyInput): Promise<boolean> {
  const getEnv = input.getEnv ?? ((key: string) => Deno.env.get(key) ?? undefined)
  const webhookUrl = getEnv('SLACK_SIGNUP_WEBHOOK_URL')?.trim()
  const email = input.email.trim()
  if (!webhookUrl || !email) return false

  const fetchImpl = input.fetchImpl ?? fetch
  const lines = [
    '🎉 *New LSAT signup*',
    `• Email: \`${email}\``,
    `• Provider: ${input.provider?.trim() || 'unknown'}`,
  ]
  if (input.userId?.trim()) lines.push(`• User ID: \`${input.userId.trim()}\``)
  if (input.createdAt?.trim()) lines.push(`• Created: ${input.createdAt.trim()}`)

  try {
    const response = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
    })
    return response.ok
  } catch (error) {
    console.warn('Slack signup notify failed:', error)
    return false
  }
}

export function authorizeSignupWebhook(
  req: Request,
  getEnv: (key: string) => string | undefined = (key) => Deno.env.get(key) ?? undefined,
): boolean {
  const expected = getEnv('SIGNUP_WEBHOOK_SECRET')?.trim()
  if (!expected) return false

  const headerSecret = req.headers.get('x-signup-webhook-secret')?.trim()
  if (headerSecret && headerSecret === expected) return true

  const auth = req.headers.get('Authorization')?.trim() ?? ''
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  return Boolean(bearer && bearer === expected)
}

function readProvider(record: Record<string, unknown>): string {
  const appMeta = record.raw_app_meta_data
  if (appMeta && typeof appMeta === 'object' && !Array.isArray(appMeta)) {
    const provider = (appMeta as Record<string, unknown>).provider
    if (typeof provider === 'string' && provider.trim()) return provider.trim()
    const providers = (appMeta as Record<string, unknown>).providers
    if (Array.isArray(providers) && typeof providers[0] === 'string' && providers[0].trim()) {
      return providers[0].trim()
    }
  }
  return 'unknown'
}


export function parseAuthUsersSignupInsert(body: unknown): ParsedSignupInsert | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const payload = body as AuthUsersInsertPayload
  if (payload.type !== 'INSERT') return null
  if (payload.table !== 'users') return null
  if (payload.schema !== 'auth') return null
  if (!payload.record || typeof payload.record !== 'object') return null

  const record = payload.record
  const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : ''
  const userId = typeof record.id === 'string' ? record.id.trim() : ''
  if (!email || !userId) return null

  const createdAt =
    typeof record.created_at === 'string' && record.created_at.trim()
      ? record.created_at.trim()
      : null

  return {
    email,
    userId,
    provider: readProvider(record),
    createdAt,
  }
}
