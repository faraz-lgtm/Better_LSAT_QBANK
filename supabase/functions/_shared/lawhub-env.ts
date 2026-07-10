import type { LsacTokenEnv } from './lsac-token.ts'

/** Integration (sandbox) — LawHub Provider API doc §2. */
export const LAWHUB_SANDBOX_BASE_URL = 'https://providers-api-sandbox.lawhub.org'
export const LAWHUB_SANDBOX_SCOPE =
  'https://lawpathb2b.onmicrosoft.com/06b7d783-8a46-43de-a375-07059967cb3b/.default'

/** Production — LawHub Provider API doc §2. */
export const LAWHUB_PRODUCTION_BASE_URL = 'https://providers-api.lawhub.org'
export const LAWHUB_PRODUCTION_SCOPE =
  'https://lawpathb2b.onmicrosoft.com/8ffc1f28-b505-42f3-8691-986e25fdd942/.default'

/** Same tenant ID for integration and production per LSAC doc. */
export const LAWHUB_DEFAULT_TENANT_ID = '09e2500c-c284-4e32-9f4b-1c3c47823cba'

/** All env vars needed to call LawHub Provider APIs (OAuth + vendor routes). */
export type LawHubRuntimeEnv = LsacTokenEnv & {
  LSAC_BASE_URL: string
  LSAC_VENDOR_ID: string
  /** Shown in logging API as vendorSystem (optional). */
  LSAC_VENDOR_SYSTEM?: string
  /** Resolved from LAWHUB_SANDBOX / LawHubSandbox when env is parsed. */
  isSandbox: boolean
}

function readSandboxFlag(raw: Record<string, string | undefined>): boolean {
  const value = raw.LAWHUB_SANDBOX ?? raw.LawHubSandbox
  if (value == null || value === '') return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1'
}

function resolveBaseUrl(
  raw: Record<string, string | undefined>,
  isSandbox: boolean,
): string | null {
  const explicit = raw.LSAC_BASE_URL?.replace(/\/$/, '')
  if (explicit) return explicit
  return isSandbox ? LAWHUB_SANDBOX_BASE_URL : LAWHUB_PRODUCTION_BASE_URL
}

function resolveScope(
  raw: Record<string, string | undefined>,
  isSandbox: boolean,
): string | null {
  const explicit = raw.LSAC_SCOPE?.trim()
  if (explicit) return explicit
  return isSandbox ? LAWHUB_SANDBOX_SCOPE : LAWHUB_PRODUCTION_SCOPE
}

/** Returns null if any required LawHub variable is missing (app runs without LSAC). */
export function parseLawHubEnv(
  raw: Record<string, string | undefined>,
): LawHubRuntimeEnv | null {
  const isSandbox = readSandboxFlag(raw)
  const base = resolveBaseUrl(raw, isSandbox)
  const vendorId = raw.LSAC_VENDOR_ID
  const tenantId = raw.LSAC_TENANT_ID?.trim() || LAWHUB_DEFAULT_TENANT_ID
  const clientId = raw.LSAC_CLIENT_ID
  const clientSecret = raw.LSAC_CLIENT_SECRET
  const scope = resolveScope(raw, isSandbox)

  if (!base || !vendorId || !clientId || !clientSecret || !scope) {
    return null
  }

  return {
    LSAC_BASE_URL: base,
    LSAC_VENDOR_ID: vendorId,
    LSAC_TENANT_ID: tenantId,
    LSAC_CLIENT_ID: clientId,
    LSAC_CLIENT_SECRET: clientSecret,
    LSAC_SCOPE: scope,
    LSAC_VENDOR_SYSTEM: raw.LSAC_VENDOR_SYSTEM,
    isSandbox,
  }
}
