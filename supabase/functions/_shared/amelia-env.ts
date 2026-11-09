export type AmeliaEnv = {
  apiBaseUrl: string
  apiKey: string
  defaultServiceId: number
  defaultLocationId: number | null
  defaultProviderId: number | null
  webhookSecret: string | null
}

function parsePositiveInt(raw: string | undefined): number | null {
  if (!raw?.trim()) return null
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) return null
  return n
}

/** Returns null when Amelia is not configured (API optional until secrets are set). */
export function parseAmeliaEnv(
  getEnv: (key: string) => string | undefined = (k) => Deno.env.get(k),
): AmeliaEnv | null {
  const apiBaseUrl = getEnv('AMELIA_API_BASE_URL')?.trim() ?? ''
  const apiKey = getEnv('AMELIA_API_KEY')?.trim() ?? ''
  const defaultServiceId = parsePositiveInt(getEnv('AMELIA_DEFAULT_SERVICE_ID'))
  if (!apiBaseUrl || !apiKey || !defaultServiceId) return null

  return {
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
    apiKey,
    defaultServiceId,
    defaultLocationId: parsePositiveInt(getEnv('AMELIA_DEFAULT_LOCATION_ID')),
    defaultProviderId: parsePositiveInt(getEnv('AMELIA_DEFAULT_PROVIDER_ID')),
    webhookSecret: getEnv('AMELIA_WEBHOOK_SECRET')?.trim() || null,
  }
}
