import {
  createLawHubClient,
  type LawHubClient,
} from '../_shared/lawhub-client.ts'
import { parseLawHubEnv } from '../_shared/lawhub-env.ts'
import type { LsacStudentPayload } from './users.mapper.ts'
import {
  mapLawHubStudentRecordToProfileUpsert,
  mapLsacStudentToProfileUpsert,
} from './users.mapper.ts'
import type { UsersRepository } from './users.repository.ts'

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export type UsersServiceDeps = {
  repository: UsersRepository
  fetchImpl?: typeof fetch
  /** Omit to build from `Deno.env`; pass a mock in tests. */
  lawHub?: LawHubClient | null
}

export type AccessState = 'AUTH_REQUIRED' | 'LSAC_REQUIRED' | 'FULL_ACCESS'

export type UserEntitlementState = {
  isAuthenticated: boolean
  isLsacLinked: boolean
  isLsacEligible: boolean
  hasActiveCore: boolean
  accessState: AccessState
}

function resolveLawHub(
  deps: UsersServiceDeps,
): LawHubClient | null {
  if (deps.lawHub !== undefined) return deps.lawHub
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch
  const env = parseLawHubEnv(Deno.env.toObject())
  if (!env) return null
  return createLawHubClient({ getEnv: () => env, fetchImpl })
}

/** Orchestrates profiles + LawHub Provider API (LSAC). */
export function createUsersService(deps: UsersServiceDeps) {
  const lawHub = resolveLawHub(deps)
  const skipLawHubCalls = Deno.env.get('LSAC_SKIP_CALLS') === 'true'
  const placeholderCoachingId = (userId: string) => `pending-${userId}`

  function requireLawHub(): LawHubClient {
    if (!lawHub) {
      throw new Error(
        'LawHub is not configured: set LSAC_BASE_URL, LSAC_VENDOR_ID, LSAC_TENANT_ID, LSAC_CLIENT_ID, LSAC_CLIENT_SECRET, LSAC_SCOPE',
      )
    }
    return lawHub
  }

  async function persistSnapshot(
    userId: string,
    record: Record<string, unknown>,
  ): Promise<void> {
    const coachingId =
      typeof record.studentCoachingId === 'string'
        ? record.studentCoachingId.trim()
        : ''
    if (!coachingId) return
    await deps.repository.insertStudentSnapshot({
      userId,
      studentCoachingId: coachingId,
      rawPayload: record,
    })
  }

  return {
    async getEntitlementState(userId: string): Promise<UserEntitlementState> {
      const profile = await deps.repository.getProfileById(userId)
      const isLsacLinked = Boolean(profile?.student_coaching_id)
      const snapshot = await deps.repository.getLatestStudentSnapshotByUserId(userId)

      const linkedInSnapshot = snapshot?.linked === true
      const subscriptionType = snapshot?.subscription_type?.trim().toLowerCase() ?? null
      const hasKnownEligibleSubscription = subscriptionType
        ? subscriptionType.includes('advantage') || subscriptionType.includes('prep')
        : false
      const isLsacEligible = isLsacLinked && (linkedInSnapshot || hasKnownEligibleSubscription)
      // Pricing/billing integration is deferred; all students are Core-active in v1.
      const hasActiveCore = true
      const accessState: AccessState = isLsacEligible && hasActiveCore
        ? 'FULL_ACCESS'
        : 'LSAC_REQUIRED'

      return {
        isAuthenticated: true,
        isLsacLinked,
        isLsacEligible,
        hasActiveCore,
        accessState,
      }
    },

    isLawHubConfigured(): boolean {
      return skipLawHubCalls || lawHub !== null
    },

    async getProfile(userId: string) {
      return await deps.repository.getProfileById(userId)
    },

    async markFirstTimeLoginComplete(userId: string) {
      return await deps.repository.markFirstTimeLogin(userId, false)
    },

    async requireAdmin(userId: string) {
      const profile = await deps.repository.getProfileById(userId)
      if (!profile || profile.role !== 'admin') {
        throw new AuthorizationError('Admin access required')
      }
      return profile
    },

    /** Merge a LawHub-shaped payload without calling LawHub (dev / manual sync). */
    async syncProfileFromLsacPayload(userId: string, lsac: LsacStudentPayload) {
      const row = mapLsacStudentToProfileUpsert(userId, lsac)
      return await deps.repository.upsertProfile(row)
    },

    async checkLawHubConnection() {
      if (skipLawHubCalls) return
      await requireLawHub().ensureToken()
    },

    /** GET studentEmails/{email} for the signed-in email only; upserts profile. */
    async syncProfileFromLawHubEmail(userId: string, email: string) {
      if (skipLawHubCalls) {
        return await deps.repository.upsertProfile({
          id: userId,
          email: email.trim().toLowerCase(),
          full_name: null,
          student_coaching_id: placeholderCoachingId(userId),
        })
      }
      const data = await requireLawHub().getStudentsByEmail(email)
      const rows = Array.isArray(data) ? data : []
      if (rows.length === 0) {
        throw new Error('No LawHub student records found for this email')
      }
      const first = rows[0] as Record<string, unknown>
      const row = mapLawHubStudentRecordToProfileUpsert(userId, first)
      const profile = await deps.repository.upsertProfile(row)
      await persistSnapshot(userId, first)
      return profile
    },

    /** GET students/{coachingId} using coaching id stored on the profile. */
    async refreshProfileFromLawHubCoachingId(userId: string) {
      if (skipLawHubCalls) {
        return await deps.repository.upsertProfile({
          id: userId,
          email: null,
          full_name: null,
          student_coaching_id: placeholderCoachingId(userId),
        })
      }
      const profile = await deps.repository.getProfileById(userId)
      const coachingId = profile?.student_coaching_id
      if (!coachingId) {
        throw new Error(
          'No student_coaching_id on profile; use lawhub-lookup-email or lawhub-invite first',
        )
      }
      const data = await requireLawHub().getStudentByCoachingId(coachingId)
      const record = data as Record<string, unknown>
      const row = mapLawHubStudentRecordToProfileUpsert(userId, record)
      const updated = await deps.repository.upsertProfile(row)
      await persistSnapshot(userId, record)
      return updated
    },

    /** POST students — email must match the authenticated user (enforced in controller). */
    async inviteSelfViaLawHub(
      userId: string,
      sessionEmail: string,
      input: {
        firstName: string
        lastName: string
        isPrepPlusRequired: boolean
        isPrepPlusIncludedFromVendor: boolean
      },
    ) {
      if (skipLawHubCalls) {
        return await deps.repository.upsertProfile({
          id: userId,
          email: sessionEmail.trim().toLowerCase(),
          full_name: `${input.firstName} ${input.lastName}`.trim(),
          student_coaching_id: placeholderCoachingId(userId),
        })
      }
      const data = await requireLawHub().addOrInviteStudent({
        emailAddress: sessionEmail,
        firstName: input.firstName,
        lastName: input.lastName,
        isPrepPlusRequired: input.isPrepPlusRequired,
        isPrepPlusIncludedFromVendor: input.isPrepPlusIncludedFromVendor,
      })
      const record = data as Record<string, unknown>
      const row = mapLawHubStudentRecordToProfileUpsert(userId, record)
      const updated = await deps.repository.upsertProfile(row)
      await persistSnapshot(userId, record)
      return updated
    },

    /** POST upgradeStudent/{coachingId} for the current user's linked coaching id only. */
    async upgradeSelfInLawHub(userId: string) {
      if (skipLawHubCalls) {
        return {
          skipped: true,
          reason: 'LSAC_SKIP_CALLS=true',
          userId,
        }
      }
      const profile = await deps.repository.getProfileById(userId)
      const coachingId = profile?.student_coaching_id
      if (!coachingId) {
        throw new Error('No student_coaching_id on profile')
      }
      return await requireLawHub().upgradeStudent(coachingId)
    },

    async getLawHubTestInstancesForUser(userId: string) {
      if (skipLawHubCalls) {
        return []
      }
      const profile = await deps.repository.getProfileById(userId)
      const coachingId = profile?.student_coaching_id
      if (!coachingId) {
        throw new Error('No student_coaching_id on profile')
      }
      const data = await requireLawHub().getTestInstances(coachingId)
      const instances = Array.isArray(data) ? data : []
      await deps.repository.upsertTestInstances({
        userId,
        studentCoachingId: coachingId,
        instances,
      })
      return data
    },

    /** Required when exposing Official LSAC content after login. */
    async logLawHubLogin(userId: string) {
      if (skipLawHubCalls) {
        return
      }
      const profile = await deps.repository.getProfileById(userId)
      const coachingId = profile?.student_coaching_id
      if (!coachingId) {
        throw new Error('No student_coaching_id on profile')
      }
      const requestPayload = {
        studentCoachingId: coachingId,
        eventType: 'Login',
        eventDate: new Date().toISOString(),
      }
      try {
        const response =
          (await requireLawHub().logContentAccess(requestPayload)) as
            | Record<string, unknown>
            | null
        await deps.repository.insertLogEvent({
          userId,
          studentCoachingId: coachingId,
          eventType: 'Login',
          statusCode: 200,
          success: true,
          requestPayload,
          responsePayload: response,
        })
      } catch (error) {
        await deps.repository.insertLogEvent({
          userId,
          studentCoachingId: coachingId,
          eventType: 'Login',
          statusCode: null,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestPayload,
          responsePayload: null,
        })
        throw error
      }
    },

    async adminListProfiles(userId: string, limit = 200) {
      await this.requireAdmin(userId)
      return await deps.repository.listProfiles(limit)
    },

    async adminListLsacStudentSnapshots(userId: string, limit = 200) {
      await this.requireAdmin(userId)
      return await deps.repository.listLsacStudentSnapshots(limit)
    },

    async adminListLsacTestInstances(userId: string, limit = 200) {
      await this.requireAdmin(userId)
      return await deps.repository.listLsacTestInstances(limit)
    },

    async adminListLsacLogEvents(userId: string, limit = 200) {
      await this.requireAdmin(userId)
      return await deps.repository.listLsacLogEvents(limit)
    },
  }
}

export type UsersService = ReturnType<typeof createUsersService>
