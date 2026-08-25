import {
  createLawHubClient,
  type LawHubClient,
} from '../_shared/lawhub-client.ts'
import { shouldRequireLsacLinkWall } from '../_shared/lsac-link-wall.ts'
import { parseLawHubEnv } from '../_shared/lawhub-env.ts'
import {
  assertLawHubEmailAllowed,
  isLawHubIdentityError,
  joinLawHubFullName,
  requireLawHubNameParts,
} from '../_shared/lawhub-student-identity.ts'
import { parseStripeEnv } from '../_shared/stripe-env.ts'
import type { LsacStudentPayload } from './users.mapper.ts'
import {
  mapLawHubStudentRecordToProfileUpsert,
  mapLsacStudentToProfileUpsert,
  mapOfficialScoreRow,
  mapStudyPreferencesRow,
  parseLsatScoreValue,
  type OfficialLsatScoreDto,
  type StudentStudyPreferencesDto,
} from './users.mapper.ts'
import type { LawHubInviteStatus, ProfileRow, UsersRepository } from './users.repository.ts'

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

export type AccessState = 'AUTH_REQUIRED' | 'PAYMENT_REQUIRED' | 'LSAC_REQUIRED' | 'FULL_ACCESS'

export type UserEntitlementState = {
  isAuthenticated: boolean
  isLsacLinked: boolean
  isLsacEligible: boolean
  hasActiveCore: boolean
  accessState: AccessState
}

export type LawHubCheckoutInviteContext = {
  userId: string
  email: string | null
  includeLawHub: boolean
  customerName?: string | null
}

export type LawHubCheckoutInviteResult = {
  invited: boolean
  reason?: 'already_linked' | 'no_email' | 'no_name' | 'lawhub_not_configured' | 'invite_failed'
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
        'LawHub is not configured: set LAWHUB_SANDBOX (or LSAC_BASE_URL), LSAC_VENDOR_ID, LSAC_CLIENT_ID, LSAC_CLIENT_SECRET',
      )
    }
    return lawHub
  }

  async function recordLawHubInviteOutcome(
    userId: string,
    status: LawHubInviteStatus,
    error?: string | null,
  ): Promise<void> {
    await deps.repository.setLawHubInviteOutcome(userId, { status, error })
  }

  async function syncRecordFromLawHub(
    userId: string,
    record: Record<string, unknown>,
  ) {
    const row = mapLawHubStudentRecordToProfileUpsert(userId, record)
    const profile = await deps.repository.upsertProfile(row)
    await persistSnapshot(userId, record)
    return profile
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

  async function resolveHasActiveCore(userId: string, _profile: ProfileRow | null): Promise<boolean> {
    const stripeConfigured = parseStripeEnv(Deno.env.toObject()) !== null
    if (!stripeConfigured) return true
    return await deps.repository.hasActiveSubscription(userId)
  }

  async function requireActiveSubscription(userId: string): Promise<void> {
    const stripeConfigured = parseStripeEnv(Deno.env.toObject()) !== null
    if (!stripeConfigured) return
    const hasSubscription = await deps.repository.hasActiveSubscription(userId)
    if (!hasSubscription) {
      throw new Error('Active subscription required before linking LawHub')
    }
  }

  /** @deprecated Use requireActiveSubscription */
  async function requireVendorSubscription(userId: string): Promise<void> {
    await requireActiveSubscription(userId)
  }

  function isLawHubRecordLinked(record: Record<string, unknown>): boolean {
    return record.linked === true
  }

  async function linkLawHubWithFlags(
    userId: string,
    sessionEmail: string,
    input: { firstName: string; lastName: string },
    flags: { isPrepPlusRequired: boolean; isPrepPlusIncludedFromVendor: boolean },
  ) {
    const email = assertLawHubEmailAllowed(sessionEmail)
    const nameParts = requireLawHubNameParts(input)
    if (skipLawHubCalls) {
      return await deps.repository.upsertProfile({
        id: userId,
        email,
        full_name: joinLawHubFullName(nameParts.firstName, nameParts.lastName),
        first_name: nameParts.firstName,
        last_name: nameParts.lastName,
        student_coaching_id: placeholderCoachingId(userId),
      })
    }

    const rows = await requireLawHub().findStudentsByEmail(email)
    if (rows.length > 0) {
      const first = rows[0] as Record<string, unknown>
      if (isLawHubRecordLinked(first)) {
        return await syncRecordFromLawHub(userId, first)
      }
      // Unlinked existing student: POST /students renews coaching and re-sends invite email.
    }

    const invited = await requireLawHub().addOrInviteStudent({
      emailAddress: email,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      isPrepPlusRequired: flags.isPrepPlusRequired,
      isPrepPlusIncludedFromVendor: flags.isPrepPlusIncludedFromVendor,
    })
    return await syncRecordFromLawHub(userId, invited as Record<string, unknown>)
  }

  return {
    async getEntitlementState(userId: string): Promise<UserEntitlementState> {
      const profile = await deps.repository.getProfileById(userId)
      const isLsacLinked = Boolean(profile?.student_coaching_id?.trim())
      const snapshot = await deps.repository.getLatestStudentSnapshotByUserId(userId)

      const linkedInSnapshot = snapshot?.linked === true
      const isLsacEligible = isLsacLinked && linkedInSnapshot
      const hasActiveCore = await resolveHasActiveCore(userId, profile)

      let accessState: AccessState
      if (!hasActiveCore) {
        accessState = 'PAYMENT_REQUIRED'
      } else if (!isLsacEligible && shouldRequireLsacLinkWall()) {
        accessState = 'LSAC_REQUIRED'
      } else {
        accessState = 'FULL_ACCESS'
      }

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

    async updateAccountProfile(
      userId: string,
      input: {
        firstName?: string
        lastName?: string
        email?: string
        phone?: string
      },
    ) {
      const existing = await deps.repository.getProfileById(userId)
      const hasNameInput = input.firstName !== undefined || input.lastName !== undefined
      let firstName = existing?.first_name?.trim() || ''
      let lastName = existing?.last_name?.trim() || ''
      let fullName = existing?.full_name?.trim() || joinLawHubFullName(firstName, lastName)

      if (hasNameInput) {
        const nameParts = requireLawHubNameParts({
          firstName: input.firstName,
          lastName: input.lastName,
        })
        firstName = nameParts.firstName
        lastName = nameParts.lastName
        fullName = joinLawHubFullName(firstName, lastName)
      }

      const email = input.email?.trim().toLowerCase() || existing?.email || null
      const phone =
        input.phone !== undefined
          ? input.phone.trim() || null
          : existing?.phone ?? null

      return await deps.repository.upsertProfile({
        id: userId,
        email,
        full_name: fullName || null,
        first_name: firstName || null,
        last_name: lastName || null,
        phone,
        student_coaching_id: existing?.student_coaching_id ?? null,
      })
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
      const normalizedEmail = assertLawHubEmailAllowed(email)
      if (skipLawHubCalls) {
        return await deps.repository.upsertProfile({
          id: userId,
          email: normalizedEmail,
          full_name: null,
          student_coaching_id: placeholderCoachingId(userId),
        })
      }
      const rows = await requireLawHub().findStudentsByEmail(normalizedEmail)
      if (rows.length === 0) {
        throw new Error('No LawHub student records found for this email')
      }
      const first = rows[0] as Record<string, unknown>
      return await syncRecordFromLawHub(userId, first)
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
      return await syncRecordFromLawHub(userId, record)
    },

    /** Invite with PrepPlus included (doc §5 scenario 1). */
    async inviteStudentWithPrepPlusIncluded(
      userId: string,
      sessionEmail: string,
      input: { firstName: string; lastName: string },
    ) {
      return await this.inviteSelfViaLawHub(userId, sessionEmail, {
        firstName: input.firstName,
        lastName: input.lastName,
        isPrepPlusRequired: true,
        isPrepPlusIncludedFromVendor: true,
      })
    },

    /**
     * Vendor-included PrepPlus (doc §5 scenario 1). Requires active Stripe subscription.
     */
    async linkLawHubWithVendorPrepPlus(
      userId: string,
      sessionEmail: string,
      input: { firstName: string; lastName: string },
    ) {
      await requireVendorSubscription(userId)
      await linkLawHubWithFlags(userId, sessionEmail, input, {
        isPrepPlusRequired: true,
        isPrepPlusIncludedFromVendor: true,
      })
      return await this.refreshProfileFromLawHubCoachingId(userId)
    },

    /**
     * Existing LawHub PrepPlus (doc §5 scenario 2). Requires active Better LSAT subscription.
     */
    async linkLawHubWithExistingPrepPlus(
      userId: string,
      sessionEmail: string,
      input: { firstName: string; lastName: string },
    ) {
      await requireActiveSubscription(userId)
      await deps.repository.setPrepPlusSource(userId, 'existing_lsac')
      await linkLawHubWithFlags(userId, sessionEmail, input, {
        isPrepPlusRequired: true,
        isPrepPlusIncludedFromVendor: false,
      })
      return await this.refreshProfileFromLawHubCoachingId(userId)
    },

    /** @deprecated Use linkLawHubWithVendorPrepPlus or linkLawHubWithExistingPrepPlus */
    async linkLawHubAccount(
      userId: string,
      sessionEmail: string,
      input: { firstName: string; lastName: string },
    ) {
      return await this.linkLawHubWithVendorPrepPlus(userId, sessionEmail, input)
    },

    /**
     * After Stripe checkout: invite student via LawHub POST /students (idempotent).
     * Never throws — webhook must return 200 even when invite is skipped or fails.
     */
    async autoInviteLawHubAfterCheckout(
      ctx: LawHubCheckoutInviteContext,
    ): Promise<LawHubCheckoutInviteResult> {
      if (!skipLawHubCalls && !lawHub) {
        console.warn('LawHub not configured; skipping auto-invite after checkout')
        await recordLawHubInviteOutcome(ctx.userId, 'skipped', 'lawhub_not_configured')
        return { invited: false, reason: 'lawhub_not_configured' }
      }

      const profile = await deps.repository.getProfileById(ctx.userId)
      if (profile?.student_coaching_id?.trim()) {
        const snapshot = await deps.repository.getLatestStudentSnapshotByUserId(ctx.userId)
        if (snapshot?.linked === true) {
          await recordLawHubInviteOutcome(ctx.userId, 'skipped', 'already_linked')
          return { invited: false, reason: 'already_linked' }
        }
      }

      let email: string
      try {
        email = assertLawHubEmailAllowed(
          ctx.email?.trim().toLowerCase() ?? profile?.email?.trim().toLowerCase() ?? null,
        )
      } catch (error) {
        const reason = isLawHubIdentityError(error) && error.code === 'LAWHUB_EMAIL_PLUS_NOT_ALLOWED'
          ? 'invite_failed'
          : 'no_email'
        console.warn(`LawHub auto-invite skipped: ${reason} for user ${ctx.userId}`)
        await recordLawHubInviteOutcome(
          ctx.userId,
          'failed',
          isLawHubIdentityError(error) ? error.message : 'no_email',
        )
        return { invited: false, reason }
      }

      let nameInput: { firstName: string; lastName: string }
      try {
        nameInput = requireLawHubNameParts({
          firstName: profile?.first_name,
          lastName: profile?.last_name,
          fullName: profile?.full_name,
        })
      } catch {
        try {
          nameInput = requireLawHubNameParts({ fullName: ctx.customerName })
        } catch (error) {
          console.warn(`LawHub auto-invite skipped: no name for user ${ctx.userId}`)
          await recordLawHubInviteOutcome(
            ctx.userId,
            'failed',
            isLawHubIdentityError(error) ? error.message : 'no_name',
          )
          return { invited: false, reason: 'no_name' }
        }
      }

      try {
        await requireActiveSubscription(ctx.userId)
        if (ctx.includeLawHub) {
          await linkLawHubWithFlags(ctx.userId, email, nameInput, {
            isPrepPlusRequired: true,
            isPrepPlusIncludedFromVendor: true,
          })
        } else {
          await deps.repository.setPrepPlusSource(ctx.userId, 'existing_lsac')
          await linkLawHubWithFlags(ctx.userId, email, nameInput, {
            isPrepPlusRequired: true,
            isPrepPlusIncludedFromVendor: false,
          })
        }
        console.info(`LawHub auto-invite succeeded for user ${ctx.userId} (${email})`)
        await recordLawHubInviteOutcome(ctx.userId, 'invited')
        return { invited: true }
      } catch (error) {
        console.error(`LawHub auto-invite failed for user ${ctx.userId}:`, error)
        await recordLawHubInviteOutcome(
          ctx.userId,
          'failed',
          error instanceof Error ? error.message : 'invite_failed',
        )
        return { invited: false, reason: 'invite_failed' }
      }
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
      const email = assertLawHubEmailAllowed(sessionEmail)
      const nameParts = requireLawHubNameParts(input)
      if (skipLawHubCalls) {
        return await deps.repository.upsertProfile({
          id: userId,
          email,
          full_name: joinLawHubFullName(nameParts.firstName, nameParts.lastName),
          first_name: nameParts.firstName,
          last_name: nameParts.lastName,
          student_coaching_id: placeholderCoachingId(userId),
        })
      }
      const data = await requireLawHub().addOrInviteStudent({
        emailAddress: email,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        isPrepPlusRequired: input.isPrepPlusRequired,
        isPrepPlusIncludedFromVendor: input.isPrepPlusIncludedFromVendor,
      })
      const record = data as Record<string, unknown>
      return await syncRecordFromLawHub(userId, record)
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
      await requireLawHub().upgradeStudent(coachingId)
      const refreshed = await this.refreshProfileFromLawHubCoachingId(userId)
      return { upgraded: true, profile: refreshed }
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
    async logLawHubContentAccess(
      userId: string,
      eventType: string,
      input?: { emailAddress?: string; metadata?: Record<string, unknown> },
    ) {
      if (skipLawHubCalls) {
        return
      }
      const profile = await deps.repository.getProfileById(userId)
      const coachingId = profile?.student_coaching_id
      if (!coachingId) {
        throw new Error('No student_coaching_id on profile')
      }
      const emailAddress =
        input?.emailAddress?.trim().toLowerCase() ??
        profile?.email?.trim().toLowerCase() ??
        null
      if (!emailAddress) {
        throw new Error('Email address is required for LawHub content access logging')
      }
      const eventDate = new Date().toISOString()
      const metadata = input?.metadata
      const requestPayload: Record<string, unknown> = {
        studentCoachingId: coachingId,
        emailAddress,
        eventType,
        eventDate,
      }
      if (metadata && Object.keys(metadata).length > 0) {
        requestPayload.metadata = metadata
      }
      try {
        const response =
          (await requireLawHub().logContentAccess({
            studentCoachingId: coachingId,
            emailAddress,
            eventType,
            eventDate,
            metadata,
          })) as Record<string, unknown> | null
        await deps.repository.insertLogEvent({
          userId,
          studentCoachingId: coachingId,
          eventType,
          statusCode: 200,
          success: true,
          requestPayload,
          responsePayload: response,
        })
      } catch (error) {
        await deps.repository.insertLogEvent({
          userId,
          studentCoachingId: coachingId,
          eventType,
          statusCode: null,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestPayload,
          responsePayload: null,
        })
        throw error
      }
    },

    async logLawHubLogin(
      userId: string,
      sessionEmail: string,
      metadata?: Record<string, unknown>,
    ) {
      return await this.logLawHubContentAccess(userId, 'Login', {
        emailAddress: sessionEmail,
        metadata,
      })
    },

    async saveOnboarding(
      userId: string,
      input: {
        firstName?: string
        lastName?: string
        /** @deprecated Prefer firstName + lastName */
        fullName?: string
        username?: string | null
        plannedLsatWindow?: string | null
        plannedLsatDate?: string | null
        lawSchoolCycle?: string | null
        goalScore?: unknown
        startingScore?: unknown
        studyDays?: string[]
        studyHoursLabel?: string | null
        wantsLessons?: boolean
      },
    ): Promise<{ profile: ProfileRow; preferences: StudentStudyPreferencesDto }> {
      const goalScore = parseLsatScoreValue(input.goalScore)
      const startingScore = parseLsatScoreValue(input.startingScore)
      const nameParts = requireLawHubNameParts({
        firstName: input.firstName,
        lastName: input.lastName,
        fullName: input.fullName,
      })

      const existing = await deps.repository.getProfileById(userId)
      const profile = await deps.repository.upsertProfile({
        id: userId,
        email: existing?.email ?? null,
        full_name: joinLawHubFullName(nameParts.firstName, nameParts.lastName),
        first_name: nameParts.firstName,
        last_name: nameParts.lastName,
        student_coaching_id: existing?.student_coaching_id ?? null,
      })

      const preferencesRow = await deps.repository.upsertStudyPreferences({
        userId,
        username: input.username?.trim() || null,
        plannedLsatWindow: input.plannedLsatWindow ?? null,
        plannedLsatDate: input.plannedLsatDate ?? null,
        lawSchoolCycle: input.lawSchoolCycle?.trim() || null,
        goalScore,
        startingScore,
        studyDays: input.studyDays ?? [],
        studyHoursLabel: input.studyHoursLabel ?? null,
        wantsLessons: input.wantsLessons ?? false,
      })

      if (startingScore != null) {
        const existing = await deps.repository.listOfficialLsatScores(userId)
        const hasStarting = existing.some((s) => s.test_label === 'Starting score')
        if (!hasStarting) {
          await deps.repository.upsertOfficialLsatScore({
            userId,
            testLabel: 'Starting score',
            scaledScore: startingScore,
            sortOrder: 0,
          })
        }
      }

      return {
        profile,
        preferences: mapStudyPreferencesRow(preferencesRow),
      }
    },

    async getStudyContext(userId: string): Promise<{
      preferences: StudentStudyPreferencesDto | null
      officialScores: OfficialLsatScoreDto[]
    }> {
      const [preferencesRow, scoreRows] = await Promise.all([
        deps.repository.getStudyPreferencesByUserId(userId),
        deps.repository.listOfficialLsatScores(userId),
      ])
      return {
        preferences: preferencesRow ? mapStudyPreferencesRow(preferencesRow) : null,
        officialScores: scoreRows.map(mapOfficialScoreRow),
      }
    },

    async updateStudyPreferences(
      userId: string,
      input: {
        plannedLsatDate?: string | null
        plannedLsatWindow?: string | null
        lawSchoolCycle?: string | null
        goalScore?: number | null
      },
    ): Promise<StudentStudyPreferencesDto> {
      const row = await deps.repository.upsertStudyPreferences({
        userId,
        plannedLsatDate: input.plannedLsatDate,
        plannedLsatWindow: input.plannedLsatWindow,
        lawSchoolCycle: input.lawSchoolCycle,
        goalScore: input.goalScore,
      })
      return mapStudyPreferencesRow(row)
    },

    async upsertOfficialScore(
      userId: string,
      input: {
        id?: string
        testLabel: string
        testDate?: string | null
        scaledScore?: number | null
        sortOrder?: number
      },
    ): Promise<OfficialLsatScoreDto> {
      const label = input.testLabel.trim()
      if (!label) throw new Error('testLabel is required')
      const row = await deps.repository.upsertOfficialLsatScore({
        userId,
        id: input.id,
        testLabel: label,
        testDate: input.testDate ?? null,
        scaledScore: input.scaledScore ?? null,
        sortOrder: input.sortOrder,
      })
      return mapOfficialScoreRow(row)
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
