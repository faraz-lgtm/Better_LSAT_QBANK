/**
 * LawHub Provider API — OAuth 2.0 client credentials (Azure AD).
 * Secrets: LSAC_TENANT_ID, LSAC_CLIENT_ID, LSAC_CLIENT_SECRET, LSAC_SCOPE.
 */

export type LsacTokenEnv = {
  LSAC_TENANT_ID?: string
  LSAC_CLIENT_ID?: string
  LSAC_CLIENT_SECRET?: string
  LSAC_SCOPE?: string
}

export type LsacTokenResponse = {
  access_token: string
  /** Azure may return a string (e.g. `"3599"`). */
  expires_in: number | string
}

function tokenEndpoint(tenantId: string): string {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
}

/** Fetches a bearer token for server-to-server LawHub calls. */
export async function fetchLawHubAccessToken(
  env: LsacTokenEnv,
  fetchImpl: typeof fetch,
): Promise<{ accessToken: string; expiresInSeconds: number }> {
  const tenantId = env.LSAC_TENANT_ID
  const clientId = env.LSAC_CLIENT_ID
  const clientSecret = env.LSAC_CLIENT_SECRET
  const scope = env.LSAC_SCOPE

  if (!tenantId || !clientId || !clientSecret || !scope) {
    throw new Error('Missing LSAC OAuth env: LSAC_TENANT_ID, LSAC_CLIENT_ID, LSAC_CLIENT_SECRET, LSAC_SCOPE')
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  })

  const res = await fetchImpl(tokenEndpoint(tenantId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LSAC token request failed: ${res.status} ${text}`)
  }

  const json = (await res.json()) as LsacTokenResponse
  if (!json.access_token || json.expires_in == null) {
    throw new Error('LSAC token response missing access_token or expires_in')
  }

  const expiresInSeconds =
    typeof json.expires_in === 'string'
      ? Number.parseInt(json.expires_in, 10)
      : json.expires_in
  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error('LSAC token response has invalid expires_in')
  }

  return {
    accessToken: json.access_token,
    expiresInSeconds,
  }
}
