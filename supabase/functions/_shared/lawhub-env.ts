import type { LsacTokenEnv } from './lsac-token.ts'

/** All env vars needed to call LawHub Provider APIs (OAuth + vendor routes). */
export type LawHubRuntimeEnv = LsacTokenEnv & {
  LSAC_BASE_URL: string
  LSAC_VENDOR_ID: string
  /** Shown in logging API as vendorSystem (optional). */
  LSAC_VENDOR_SYSTEM?: string
}

/** Returns null if any required LawHub variable is missing (app runs without LSAC). */
export function parseLawHubEnv(
  raw: Record<string, string | undefined>,
): LawHubRuntimeEnv | null {
  const base = raw.LSAC_BASE_URL?.replace(/\/$/, '')
  const vendorId = raw.LSAC_VENDOR_ID
  const tenantId = raw.LSAC_TENANT_ID
  const clientId = raw.LSAC_CLIENT_ID
  const clientSecret = raw.LSAC_CLIENT_SECRET
  const scope = raw.LSAC_SCOPE

  if (!base || !vendorId || !tenantId || !clientId || !clientSecret || !scope) {
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
  }
}
