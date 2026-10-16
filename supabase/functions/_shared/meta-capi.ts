export type MetaCapiAttribution = {
  fbp?: string | null
  fbc?: string | null
  gclid?: string | null
  fbclid?: string | null
  [key: string]: unknown
}

export type SendMetaCompleteRegistrationInput = {
  email: string | null | undefined
  userId: string
  eventId: string
  eventSourceUrl?: string | null
  clientUserAgent?: string | null
  clientIpAddress?: string | null
  attribution?: MetaCapiAttribution | null
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch
  /** Injected for tests; defaults to Deno.env.get. */
  getEnv?: (key: string) => string | undefined
}

function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  return crypto.subtle.digest('SHA-256', data).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  )
}

async function hashEmail(email: string | null | undefined): Promise<string | null> {
  const normalized = email?.trim().toLowerCase()
  if (!normalized) return null
  return await sha256Hex(normalized)
}

/**
 * Send Meta Conversions API CompleteRegistration.
 * No-ops when META_PIXEL_ID or META_CAPI_ACCESS_TOKEN is unset. Never throws.
 */
export async function sendMetaCompleteRegistration(
  input: SendMetaCompleteRegistrationInput,
): Promise<boolean> {
  const getEnv = input.getEnv ?? ((key: string) => Deno.env.get(key) ?? undefined)
  const pixelId = getEnv('META_PIXEL_ID')?.trim()
  const accessToken = getEnv('META_CAPI_ACCESS_TOKEN')?.trim()
  if (!pixelId || !accessToken || !input.userId.trim() || !input.eventId.trim()) return false

  const fetchImpl = input.fetchImpl ?? fetch
  const hashedEmail = await hashEmail(input.email)
  const attr = input.attribution ?? {}
  const userData: Record<string, unknown> = {
    external_id: input.userId,
  }
  if (hashedEmail) userData.em = [hashedEmail]
  if (typeof attr.fbp === 'string' && attr.fbp.trim()) userData.fbp = attr.fbp.trim()
  if (typeof attr.fbc === 'string' && attr.fbc.trim()) userData.fbc = attr.fbc.trim()
  if (input.clientUserAgent?.trim()) userData.client_user_agent = input.clientUserAgent.trim()
  if (input.clientIpAddress?.trim()) userData.client_ip_address = input.clientIpAddress.trim()

  const event: Record<string, unknown> = {
    event_name: 'CompleteRegistration',
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: 'website',
    user_data: userData,
  }
  if (input.eventSourceUrl?.trim()) event.event_source_url = input.eventSourceUrl.trim()

  const body: Record<string, unknown> = {
    data: [event],
  }
  const testCode = getEnv('META_TEST_EVENT_CODE')?.trim()
  if (testCode) body.test_event_code = testCode

  try {
    const url =
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events` +
      `?access_token=${encodeURIComponent(accessToken)}`
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.warn('Meta CAPI CompleteRegistration failed:', response.status, text)
      return false
    }
    return true
  } catch (error) {
    console.warn('Meta CAPI CompleteRegistration error:', error)
    return false
  }
}
