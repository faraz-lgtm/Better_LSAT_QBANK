const PLACEHOLDER_HOSTS = new Set([
  'your-production-app-url.com',
  'example.com',
])

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, '')
}

function isSupabaseApiHost(hostname: string): boolean {
  return hostname.endsWith('.supabase.co') || hostname === 'kong' || hostname.endsWith('.kong')
}

/** Reject placeholder or API hosts unsuitable for Stripe Checkout browser redirects. */
export function isValidAppBaseUrl(raw: string | null | undefined): raw is string {
  if (!raw?.trim()) return false
  try {
    const url = new URL(normalizeBaseUrl(raw))
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    if (url.pathname !== '' && url.pathname !== '/') return false
    if (url.search || url.hash) return false
    if (isSupabaseApiHost(url.hostname)) return false
    if (PLACEHOLDER_HOSTS.has(url.hostname)) return false
    if (url.hostname.includes('your-') || url.hostname.includes('<')) return false
    return true
  } catch {
    return false
  }
}

/** Allowed frontend origins for checkout redirects (matches Supabase Auth redirect allow-list). */
export function isAllowedAppOrigin(origin: string): boolean {
  if (!isValidAppBaseUrl(origin)) return false
  try {
    const { hostname, protocol } = new URL(origin)
    if (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true
    }
    if (protocol !== 'https:') return false
    if (hostname === 'better-lsat-qbank.vercel.app') return true
    if (hostname.endsWith('.vercel.app')) return true
    return false
  } catch {
    return false
  }
}

export function resolveAppBaseUrlFromEnv(): string | null {
  const candidates = [
    Deno.env.get('APP_BASE_URL'),
    Deno.env.get('WEB_APP_URL'),
  ]
  for (const candidate of candidates) {
    if (isValidAppBaseUrl(candidate)) {
      return normalizeBaseUrl(candidate!)
    }
  }
  return null
}

/**
 * Prefer explicit env; otherwise use validated Origin / body appBaseUrl from the browser.
 */
export function resolveAppBaseUrlForCheckout(
  request: Request,
  bodyAppBaseUrl?: unknown,
): string {
  const fromEnv = resolveAppBaseUrlFromEnv()
  if (fromEnv) return fromEnv

  const origin = request.headers.get('Origin')?.trim()
  if (origin && isAllowedAppOrigin(origin)) {
    return normalizeBaseUrl(origin)
  }

  if (typeof bodyAppBaseUrl === 'string' && isAllowedAppOrigin(bodyAppBaseUrl)) {
    return normalizeBaseUrl(bodyAppBaseUrl)
  }

  throw new Error(
    'APP_BASE_URL is not configured. Set APP_BASE_URL on the server or call checkout from an allowed app origin.',
  )
}
