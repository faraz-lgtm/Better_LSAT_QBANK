/**
 * First-touch marketing attribution for signup conversion.
 *
 * Cookie `bl_attr` is set on `.betterlsat.com` so `app.betterlsat.com` and the apex
 * share it when both set the same cookie. If marketing traffic lands on apex outside
 * this SPA, that site must set `bl_attr` the same way.
 */

export const BL_ATTR_COOKIE = "bl_attr"
export const BL_ATTR_MAX_AGE_SECONDS = 90 * 24 * 60 * 60

export type SignupAttribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  gclid?: string
  fbclid?: string
  fbp?: string
  fbc?: string
  gcl_aw?: string
  captured_at?: string
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const
const CLICK_KEYS = ["gclid", "fbclid"] as const

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

function cookieDomain(): string | undefined {
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return undefined
  if (host.endsWith(".betterlsat.com") || host === "betterlsat.com") return ".betterlsat.com"
  return undefined
}

export function parseCookieValue(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";").map((p) => p.trim())
  for (const part of parts) {
    const eq = part.indexOf("=")
    if (eq <= 0) continue
    const key = part.slice(0, eq)
    if (key !== name) continue
    return decodeURIComponent(part.slice(eq + 1))
  }
  return null
}

export function readCookie(name: string): string | null {
  if (!isBrowser()) return null
  return parseCookieValue(document.cookie, name)
}

export function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) return
  const domain = cookieDomain()
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAgeSeconds}`,
    "Path=/",
    "SameSite=Lax",
  ]
  if (window.location.protocol === "https:") parts.push("Secure")
  if (domain) parts.push(`Domain=${domain}`)
  document.cookie = parts.join("; ")
}

function pickParams(search: string): Partial<SignupAttribution> {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`)
  const out: Partial<SignupAttribution> = {}
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim()
    if (value) out[key] = value
  }
  for (const key of CLICK_KEYS) {
    const value = params.get(key)?.trim()
    if (value) out[key] = value
  }
  return out
}

export function parseBlAttrCookie(raw: string | null): SignupAttribution | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
    return parsed as SignupAttribution
  } catch {
    return null
  }
}

/** First-touch: keep existing bl_attr keys; only fill missing from the URL. */
export function mergeFirstTouch(
  existing: SignupAttribution | null,
  fromUrl: Partial<SignupAttribution>,
): SignupAttribution {
  const merged: SignupAttribution = { ...(existing ?? {}) }
  for (const [key, value] of Object.entries(fromUrl)) {
    if (!value) continue
    const current = merged[key as keyof SignupAttribution]
    if (current == null || current === "") {
      ;(merged as Record<string, string>)[key] = value
    }
  }
  if (!merged.captured_at) merged.captured_at = new Date().toISOString()
  return merged
}

/**
 * Capture URL params into `bl_attr` (first-touch). Call once on app boot.
 */
export function captureAttributionFromUrl(search = isBrowser() ? window.location.search : ""): SignupAttribution | null {
  if (!isBrowser()) return null
  const fromUrl = pickParams(search)
  if (Object.keys(fromUrl).length === 0) {
    return parseBlAttrCookie(readCookie(BL_ATTR_COOKIE))
  }
  const existing = parseBlAttrCookie(readCookie(BL_ATTR_COOKIE))
  const merged = mergeFirstTouch(existing, fromUrl)
  writeCookie(BL_ATTR_COOKIE, JSON.stringify(merged), BL_ATTR_MAX_AGE_SECONDS)
  return merged
}

/**
 * Full attribution for signup stamping / conversion push:
 * bl_attr plus Meta/Google click cookies when present.
 */
export function readAttribution(): SignupAttribution {
  const fromBl = parseBlAttrCookie(readCookie(BL_ATTR_COOKIE)) ?? {}
  const fbp = readCookie("_fbp")?.trim()
  const fbc = readCookie("_fbc")?.trim()
  const gclAw = readCookie("_gcl_aw")?.trim()
  const out: SignupAttribution = { ...fromBl }
  if (fbp) out.fbp = fbp
  if (fbc) out.fbc = fbc
  if (gclAw) out.gcl_aw = gclAw
  return out
}
