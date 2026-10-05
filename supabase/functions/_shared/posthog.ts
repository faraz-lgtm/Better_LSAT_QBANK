export type CapturePostHogEventInput = {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch
  /** Injected for tests; defaults to Deno.env.get. */
  getEnv?: (key: string) => string | undefined
}

/**
 * Capture a PostHog event via the HTTP Capture API.
 * No-ops when POSTHOG_PROJECT_TOKEN is unset. Never throws.
 */
export async function capturePostHogEvent(input: CapturePostHogEventInput): Promise<boolean> {
  const getEnv = input.getEnv ?? ((key: string) => Deno.env.get(key) ?? undefined)
  const token = getEnv('POSTHOG_PROJECT_TOKEN')?.trim()
  if (!token || !input.distinctId.trim() || !input.event.trim()) return false

  const host = (getEnv('POSTHOG_HOST')?.trim() || 'https://e.bettermcat.com').replace(/\/$/, '')
  const fetchImpl = input.fetchImpl ?? fetch

  try {
    const response = await fetchImpl(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: token,
        event: input.event,
        distinct_id: input.distinctId,
        properties: {
          ...input.properties,
          $lib: 'betterlsat-edge',
        },
      }),
    })
    return response.ok
  } catch (error) {
    console.warn('PostHog capture failed:', error)
    return false
  }
}
