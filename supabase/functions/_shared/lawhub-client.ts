import type { LawHubRuntimeEnv } from './lawhub-env.ts'
import { fetchLawHubAccessToken } from './lsac-token.ts'

export type LawHubInviteStudentRequest = {
  emailAddress: string
  firstName: string
  lastName: string
  isPrepPlusRequired: boolean
  isPrepPlusIncludedFromVendor: boolean
}

export type LawHubLogRequest = {
  studentCoachingId: string
  emailAddress: string
  eventType: string
  eventDate: string
  vendorSystem?: string
  metadata?: Record<string, unknown>
}

export type LawHubClientDeps = {
  getEnv: () => LawHubRuntimeEnv
  fetchImpl?: typeof fetch
}

type TokenCache = { accessToken: string; expiresAtMs: number }

/** Test hook: clear cached bearer token. */
let tokenCache: TokenCache | null = null
export function resetLawHubTokenCacheForTests() {
  tokenCache = null
}

const SKEW_MS = 60_000
const MAX_RETRIES = 2
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])

export class LawHubApiError extends Error {
  status: number
  body: string
  method: string
  path: string

  constructor(input: { status: number; body: string; method: string; path: string }) {
    super(`${input.method} ${input.path}: HTTP ${input.status} ${input.body}`)
    this.name = 'LawHubApiError'
    this.status = input.status
    this.body = input.body
    this.method = input.method
    this.path = input.path
  }
}

/** LawHub returns 404 when no student exists for the email — not a transport failure. */
export function isLawHubStudentEmailNotFoundError(error: unknown): boolean {
  if (!(error instanceof LawHubApiError)) return false
  if (error.status !== 404) return false
  const body = error.body.toLowerCase()
  return body.includes('not found') && (body.includes('student') || body.includes('email'))
}

function normalizeStudentEmailLookupResult(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data != null && typeof data === 'object') return [data]
  return []
}

async function getBearerToken(
  env: LawHubRuntimeEnv,
  fetchImpl: typeof fetch,
): Promise<string> {
  const now = Date.now()
  if (tokenCache && tokenCache.expiresAtMs > now + SKEW_MS) {
    return tokenCache.accessToken
  }

  const { accessToken, expiresInSeconds } = await fetchLawHubAccessToken(
    env,
    fetchImpl,
  )
  tokenCache = {
    accessToken,
    expiresAtMs: now + expiresInSeconds * 1000,
  }
  return accessToken
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * LawHub Provider HTTP client (vendor APIs).
 * @see LawHub Provider API Technical Documentation
 */
export function createLawHubClient(deps: LawHubClientDeps) {
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch

  async function apiFetch(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const env = deps.getEnv()
    const url = `${env.LSAC_BASE_URL}${path}`
    let attempt = 0

    while (true) {
      const token = await getBearerToken(env, fetchImpl)
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      }
      const init: RequestInit = { method, headers }
      if (body !== undefined) {
        headers['Content-Type'] = 'application/json'
        init.body = JSON.stringify(body)
      }

      const res = await fetchImpl(url, init)
      const text = await res.text()
      if (res.ok) {
        if (!text) return null
        try {
          return JSON.parse(text) as unknown
        } catch {
          throw new Error(`${method} ${path}: invalid JSON body`)
        }
      }

      const error = new LawHubApiError({
        status: res.status,
        body: text,
        method,
        path,
      })

      // Token may be expired/invalid. Force one refresh and retry once.
      if (res.status === 401 && attempt === 0) {
        tokenCache = null
        attempt++
        continue
      }

      const canRetry = RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES
      if (canRetry) {
        const backoffMs = 250 * 2 ** attempt
        await sleep(backoffMs)
        attempt++
        continue
      }
      throw error
    }
  }

  const v = () => deps.getEnv().LSAC_VENDOR_ID

  return {
    async ensureToken(): Promise<void> {
      await getBearerToken(deps.getEnv(), fetchImpl)
    },

    addOrInviteStudent(payload: LawHubInviteStudentRequest): Promise<unknown> {
      return apiFetch('POST', `/api/vendor/${v()}/students`, payload)
    },

    listVendorStudents(): Promise<unknown> {
      return apiFetch('GET', `/api/vendor/${v()}/students`)
    },

    getStudentByCoachingId(coachingId: string): Promise<unknown> {
      return apiFetch('GET', `/api/vendor/${v()}/students/${encodeURIComponent(coachingId)}`)
    },

    getStudentsByEmail(email: string): Promise<unknown> {
      const encoded = encodeURIComponent(email)
      return apiFetch('GET', `/api/vendor/${v()}/studentEmails/${encoded}`)
    },

    /** Email lookup; returns [] when LawHub has no student for that address (HTTP 404). */
    async findStudentsByEmail(email: string): Promise<unknown[]> {
      try {
        const data = await this.getStudentsByEmail(email)
        return normalizeStudentEmailLookupResult(data)
      } catch (error) {
        if (isLawHubStudentEmailNotFoundError(error)) return []
        throw error
      }
    },

    upgradeStudent(coachingId: string): Promise<unknown> {
      return apiFetch(
        'POST',
        `/api/vendor/${v()}/upgradeStudent/${encodeURIComponent(coachingId)}`,
      )
    },

    getTestInstances(coachingId: string): Promise<unknown> {
      return apiFetch(
        'GET',
        `/api/vendor/${v()}/students/${encodeURIComponent(coachingId)}/instances`,
      )
    },

    logContentAccess(payload: LawHubLogRequest): Promise<unknown> {
      const env = deps.getEnv()
      const body = {
        vendorId: env.LSAC_VENDOR_ID,
        type: payload.eventType,
        emailAddress: payload.emailAddress,
        studentCoachingId: payload.studentCoachingId,
        eventType: payload.eventType,
        eventDate: payload.eventDate,
        vendorSystem: payload.vendorSystem ?? env.LSAC_VENDOR_SYSTEM ?? 'BetterLSAT',
        ...(payload.metadata ? { metadata: payload.metadata } : {}),
      }
      return apiFetch('POST', `/api/vendor/${v()}/log`, body)
    },
  }
}

export type LawHubClient = ReturnType<typeof createLawHubClient>
