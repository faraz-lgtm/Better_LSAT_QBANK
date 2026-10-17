/** Resolved visitor geography for signup conversion / Slack alerts. */
export type SignupLocation = {
  country: string | null
  region: string | null
  city: string | null
  /** Where the values came from. */
  source: 'vercel' | 'cloudflare' | 'ip_lookup' | 'none'
}

export type ResolveSignupGeoInput = {
  headers: Headers
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch
  /** Lookup timeout in ms (default 2500). */
  timeoutMs?: number
}

const UNKNOWN_COUNTRY_CODES = new Set(['XX', 'T1'])

function trimOrNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

/** Normalizes ISO country codes; treats Cloudflare XX/T1 (unknown/Tor) as missing. */
export function normalizeCountryCode(country: string | null | undefined): string | null {
  const trimmed = trimOrNull(country)
  if (!trimmed) return null
  const upper = trimmed.toUpperCase()
  if (UNKNOWN_COUNTRY_CODES.has(upper)) return null
  return upper
}

export function readClientIp(headers: Headers): string | null {
  const cf = trimOrNull(headers.get('cf-connecting-ip'))
  if (cf) return cf
  const xff = trimOrNull(headers.get('x-forwarded-for'))
  if (!xff) return null
  return trimOrNull(xff.split(',')[0] ?? null)
}

function readHeaderLocation(headers: Headers): SignupLocation | null {
  const vercelCountry = normalizeCountryCode(headers.get('x-vercel-ip-country'))
  const vercelRegion = trimOrNull(headers.get('x-vercel-ip-country-region'))
  const vercelCity = trimOrNull(headers.get('x-vercel-ip-city'))
  if (vercelCountry) {
    return {
      country: vercelCountry,
      region: vercelRegion,
      city: vercelCity,
      source: 'vercel',
    }
  }

  const cfCountry = normalizeCountryCode(headers.get('cf-ipcountry'))
  if (cfCountry) {
    return {
      country: cfCountry,
      region: null,
      city: null,
      source: 'cloudflare',
    }
  }

  return null
}

type IpWhoResponse = {
  success?: boolean
  country_code?: string
  region?: string
  regionCode?: string
  city?: string
}

async function lookupIpGeo(
  ip: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<Omit<SignupLocation, 'source'> | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const body = (await response.json()) as IpWhoResponse
    if (body.success === false) return null
    const country = normalizeCountryCode(body.country_code)
    const region = trimOrNull(body.regionCode) ?? trimOrNull(body.region)
    const city = trimOrNull(body.city)
    if (!country && !region && !city) return null
    return { country, region, city }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Resolve signup geo from edge request headers, with IP lookup fallback.
 * Prefer Vercel headers, then Cloudflare country, then ipwho.is for the client IP.
 */
export async function resolveSignupGeo(input: ResolveSignupGeoInput): Promise<SignupLocation> {
  const fromHeaders = readHeaderLocation(input.headers)
  if (fromHeaders?.country) {
    return fromHeaders
  }

  const ip = readClientIp(input.headers)
  if (!ip) {
    return { country: null, region: null, city: null, source: 'none' }
  }

  const lookedUp = await lookupIpGeo(
    ip,
    input.fetchImpl ?? fetch,
    input.timeoutMs ?? 2500,
  )
  if (!lookedUp) {
    return { country: null, region: null, city: null, source: 'none' }
  }

  return { ...lookedUp, source: 'ip_lookup' }
}

/** Compact location for Slack / display: "Toronto, ON, CA". */
export function formatSignupLocation(
  location: { country?: string | null; region?: string | null; city?: string | null } | null | undefined,
): string {
  if (!location || typeof location !== 'object') return 'unknown'
  const city = trimOrNull(location.city)
  const region = trimOrNull(location.region)
  const country = normalizeCountryCode(location.country)
  const parts = [city, region, country].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(', ') : 'unknown'
}

/** Pull signup_location from persisted attribution jsonb. */
export function readSignupLocationFromAttribution(
  attribution: Record<string, unknown> | null | undefined,
): SignupLocation | null {
  if (!attribution || typeof attribution !== 'object') return null
  const raw = attribution.signup_location
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const loc = raw as Record<string, unknown>
  const country = normalizeCountryCode(typeof loc.country === 'string' ? loc.country : null)
  const region = trimOrNull(typeof loc.region === 'string' ? loc.region : null)
  const city = trimOrNull(typeof loc.city === 'string' ? loc.city : null)
  if (!country && !region && !city) return null
  return { country, region, city, source: 'none' }
}
