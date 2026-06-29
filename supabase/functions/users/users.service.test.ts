import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import { isLawHubStudentEmailNotFoundError, LawHubApiError, type LawHubClient } from '../_shared/lawhub-client.ts'
import type {
  LatestLsacSnapshotRow,
  LsacLogEventRow,
  LsacStudentSnapshotRow,
  LsacTestInstanceRow,
  ProfileRow,
  UsersRepository,
} from './users.repository.ts'
import { createUsersService } from './users.service.ts'

/** Test doubles often only mock getStudentsByEmail; wire findStudentsByEmail for service code. */
function withEmailLookup(
  lawHub: Record<string, unknown> & {
    getStudentsByEmail?: (email: string) => Promise<unknown>
    findStudentsByEmail?: (email: string) => Promise<unknown[]>
  },
): LawHubClient {
  const getStudentsByEmail =
    lawHub.getStudentsByEmail ?? (async () => {
      throw new Error('getStudentsByEmail not mocked')
    })
  return {
    ...lawHub,
    async findStudentsByEmail(email: string) {
      if (lawHub.findStudentsByEmail) return lawHub.findStudentsByEmail(email)
      try {
        const data = await getStudentsByEmail(email)
        if (Array.isArray(data)) return data
        if (data != null && typeof data === 'object') return [data]
        return []
      } catch (error) {
        if (isLawHubStudentEmailNotFoundError(error)) return []
        throw error
      }
    },
  } as unknown as LawHubClient
}

const STRIPE_TEST_ENV: Record<string, string> = {
  STRIPE_SECRET_KEY_TEST: 'sk_test',
  STRIPE_WEBHOOK_SECRET_TEST: 'whsec',
  STRIPE_PUBLISHABLE_KEY_TEST: 'pk_test',
  STRIPE_PRICE_ID_CORE_TEST: 'price_core_test',
  STRIPE_PRICE_ID_LIVE_MONTHLY_TEST: 'price_live_test',
  STRIPE_PRICE_ID_LSAC_YEARLY_TEST: 'price_lsac_test',
  SUPABASE_URL: 'https://abc.supabase.co',
}

async function withStripeTestEnv(run: () => Promise<void>): Promise<void> {
  const previous = { ...Deno.env.toObject() }
  for (const [key, value] of Object.entries(STRIPE_TEST_ENV)) {
    Deno.env.set(key, value)
  }
  try {
    await run()
  } finally {
    for (const key of Object.keys(STRIPE_TEST_ENV)) {
      Deno.env.delete(key)
    }
    for (const [key, value] of Object.entries(previous)) {
      if (value != null) Deno.env.set(key, value)
    }
  }
}

function mockRepo(overrides: Record<string, unknown> = {}): UsersRepository {
  const baseRow: ProfileRow = {
    id: 'x',
    email: null,
    full_name: null,
    role: 'student',
    student_coaching_id: null,
    stripe_customer_id: null,
    prep_plus_source: null,
    is_first_time_login: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  return {
    getProfileById:
      (overrides.getProfileById as UsersRepository['getProfileById']) ??
      (async (id: string) => ({ ...baseRow, id })),
    upsertProfile:
      (overrides.upsertProfile as UsersRepository['upsertProfile']) ??
      (async (row) => ({ ...baseRow, ...row } as ProfileRow)),
    insertStudentSnapshot:
      (overrides.insertStudentSnapshot as UsersRepository['insertStudentSnapshot']) ??
      (async () => {}),
    upsertTestInstances:
      (overrides.upsertTestInstances as UsersRepository['upsertTestInstances']) ??
      (async () => {}),
    insertLogEvent:
      (overrides.insertLogEvent as UsersRepository['insertLogEvent']) ??
      (async () => {}),
    listProfiles:
      (overrides.listProfiles as UsersRepository['listProfiles']) ??
      (async () => []),
    listLsacStudentSnapshots:
      (overrides.listLsacStudentSnapshots as UsersRepository['listLsacStudentSnapshots']) ??
      (async () => []),
    listLsacTestInstances:
      (overrides.listLsacTestInstances as UsersRepository['listLsacTestInstances']) ??
      (async () => []),
    listLsacLogEvents:
      (overrides.listLsacLogEvents as UsersRepository['listLsacLogEvents']) ??
      (async () => []),
    getLatestStudentSnapshotByUserId:
      (overrides.getLatestStudentSnapshotByUserId as UsersRepository['getLatestStudentSnapshotByUserId']) ??
      (async () => null),
    markFirstTimeLogin:
      (overrides.markFirstTimeLogin as UsersRepository['markFirstTimeLogin']) ??
      (async (userId, isFirstTimeLogin) => ({ ...baseRow, id: userId, is_first_time_login: isFirstTimeLogin })),
    getStudyPreferencesByUserId:
      (overrides.getStudyPreferencesByUserId as UsersRepository['getStudyPreferencesByUserId']) ??
      (async () => null),
    upsertStudyPreferences:
      (overrides.upsertStudyPreferences as UsersRepository['upsertStudyPreferences']) ??
      (async (input) => ({
        user_id: input.userId,
        username: input.username ?? null,
        planned_lsat_window: input.plannedLsatWindow ?? null,
        planned_lsat_date: input.plannedLsatDate ?? null,
        law_school_cycle: input.lawSchoolCycle ?? null,
        goal_score: input.goalScore ?? null,
        starting_score: input.startingScore ?? null,
        study_days: input.studyDays ?? [],
        study_hours_label: input.studyHoursLabel ?? null,
        wants_lessons: input.wantsLessons ?? false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      })),
    listOfficialLsatScores:
      (overrides.listOfficialLsatScores as UsersRepository['listOfficialLsatScores']) ??
      (async () => []),
    upsertOfficialLsatScore:
      (overrides.upsertOfficialLsatScore as UsersRepository['upsertOfficialLsatScore']) ??
      (async (input) => ({
        id: input.id ?? 'score-1',
        user_id: input.userId,
        test_label: input.testLabel,
        test_date: input.testDate ?? null,
        scaled_score: input.scaledScore ?? null,
        sort_order: input.sortOrder ?? 0,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      })),
    setPrepPlusSource:
      (overrides.setPrepPlusSource as UsersRepository['setPrepPlusSource']) ??
      (async () => {}),
    hasActiveSubscription:
      (overrides.hasActiveSubscription as UsersRepository['hasActiveSubscription']) ??
      (async () => false),
  } as UsersRepository
}

Deno.test('createUsersService.getProfile delegates to repository', async () => {
  let seenId: string | undefined
  const repository = mockRepo({
    getProfileById: async (id) => {
      seenId = id
      return {
        id,
        email: 'a@b.com',
        full_name: 'Test',
        role: 'student',
        student_coaching_id: null,
        is_first_time_login: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }
    },
  })

  const service = createUsersService({ repository })
  const profile = await service.getProfile('user-1')

  assertEquals(seenId, 'user-1')
  assertEquals(profile?.email, 'a@b.com')
})

Deno.test('createUsersService.getEntitlementState returns full access when linked and eligible', async () => {
  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: 'student@example.com',
      full_name: 'Student',
      role: 'student',
      student_coaching_id: 'coach-1',
      is_first_time_login: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
    getLatestStudentSnapshotByUserId: async () => ({
      student_coaching_id: 'coach-1',
      linked: true,
      subscription_type: 'LawHub Advantage',
      fetched_at: '2026-01-02T00:00:00Z',
    }),
  })
  const service = createUsersService({ repository })
  const entitlement = await service.getEntitlementState('user-1')
  assertEquals(entitlement.isLsacLinked, true)
  assertEquals(entitlement.isLsacEligible, true)
  assertEquals(entitlement.hasActiveCore, true)
  assertEquals(entitlement.accessState, 'FULL_ACCESS')
})

Deno.test('createUsersService.getEntitlementState blocks when LSAC snapshot is missing', async () => {
  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: 'student@example.com',
      full_name: 'Student',
      role: 'student',
      student_coaching_id: 'coach-1',
      is_first_time_login: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
    getLatestStudentSnapshotByUserId: async () => null,
  })
  const service = createUsersService({ repository })
  const entitlement = await service.getEntitlementState('user-1')
  assertEquals(entitlement.isLsacLinked, true)
  assertEquals(entitlement.isLsacEligible, false)
  assertEquals(entitlement.accessState, 'LSAC_REQUIRED')
})

Deno.test('createUsersService.syncProfileFromLsacPayload upserts mapped row', async () => {
  let upserted: import('./users.mapper.ts').ProfileUpsertInput | undefined
  const repository = mockRepo({
    upsertProfile: async (row) => {
      upserted = row
      return {
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: 'student',
        student_coaching_id: row.student_coaching_id,
        is_first_time_login: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }
    },
  })

  const service = createUsersService({ repository })
  await service.syncProfileFromLsacPayload('uid', {
    emailAddress: 'E@E.COM',
    firstName: 'F',
    lastName: 'L',
    studentCoachingId: 'scid',
  })

  assertEquals(upserted?.id, 'uid')
  assertEquals(upserted?.email, 'e@e.com')
  assertEquals(upserted?.student_coaching_id, 'scid')
})

Deno.test('createUsersService with lawHub null cannot call LawHub', async () => {
  const service = createUsersService({
    repository: mockRepo(),
    lawHub: null,
  })
  assertEquals(service.isLawHubConfigured(), false)
  await assertRejects(
    () => service.checkLawHubConnection(),
    Error,
    'LawHub is not configured',
  )
})

Deno.test('createUsersService.syncProfileFromLawHubEmail uses LawHub client', async () => {
  let upserted: import('./users.mapper.ts').ProfileUpsertInput | undefined
  let snapshotCoachingId: string | undefined
  const lawHub = {
    async ensureToken() {},
    async getStudentsByEmail(email: string) {
      assertEquals(email, 'stu@example.com')
      return [
        {
          studentCoachingId: 'c-1',
          emailAddress: 'STU@EXAMPLE.COM',
          firstName: 'Sam',
          lastName: 'Student',
        },
      ]
    },
    async getStudentByCoachingId() {
      throw new Error('not used')
    },
    async addOrInviteStudent() {
      throw new Error('not used')
    },
    async listVendorStudents() {
      throw new Error('not used')
    },
    async upgradeStudent() {
      throw new Error('not used')
    },
    async getTestInstances() {
      throw new Error('not used')
    },
    async logContentAccess() {
      throw new Error('not used')
    },
  }

  const repository = mockRepo({
    upsertProfile: async (row) => {
      upserted = row
      return {
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: 'student',
        student_coaching_id: row.student_coaching_id,
        is_first_time_login: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }
    },
    insertStudentSnapshot: async (input) => {
      snapshotCoachingId = input.studentCoachingId
    },
  })

  const service = createUsersService({ repository, lawHub: withEmailLookup(lawHub) })
  await service.syncProfileFromLawHubEmail('user-9', 'stu@example.com')

  assertEquals(upserted?.student_coaching_id, 'c-1')
  assertEquals(upserted?.email, 'stu@example.com')
  assertEquals(upserted?.full_name, 'Sam Student')
  assertEquals(snapshotCoachingId, 'c-1')
})

Deno.test('createUsersService.getLawHubTestInstancesForUser persists instances', async () => {
  let upsertCount = 0
  const lawHub = {
    async ensureToken() {},
    async getStudentsByEmail() {
      throw new Error('not used')
    },
    async getStudentByCoachingId() {
      throw new Error('not used')
    },
    async addOrInviteStudent() {
      throw new Error('not used')
    },
    async listVendorStudents() {
      throw new Error('not used')
    },
    async upgradeStudent() {
      throw new Error('not used')
    },
    async getTestInstances() {
      return [{ testInstanceId: 'ti-1', isCompleted: true }]
    },
    async logContentAccess() {
      throw new Error('not used')
    },
  } as unknown as LawHubClient

  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: null,
      full_name: null,
      role: 'student',
      student_coaching_id: 'coach-1',
      is_first_time_login: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
    upsertTestInstances: async () => {
      upsertCount += 1
    },
  })
  const service = createUsersService({ repository, lawHub })
  await service.getLawHubTestInstancesForUser('u-1')
  assertEquals(upsertCount, 1)
})

Deno.test('createUsersService.adminListProfiles rejects non-admin users', async () => {
  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: 'student@example.com',
      full_name: 'Student',
      role: 'student',
      student_coaching_id: 'coach-1',
      is_first_time_login: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
  })
  const service = createUsersService({ repository })
  await assertRejects(
    () => service.adminListProfiles('user-1'),
    Error,
    'Admin access required',
  )
})

Deno.test('createUsersService.adminListProfiles allows admin users', async () => {
  let listCalled = false
  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: 'admin@example.com',
      full_name: 'Admin',
      role: 'admin',
      student_coaching_id: null,
      is_first_time_login: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
    listProfiles: async () => {
      listCalled = true
      return []
    },
  })
  const service = createUsersService({ repository })
  const rows = await service.adminListProfiles('admin-1', 10)
  assertEquals(listCalled, true)
  assertEquals(rows.length, 0)
})

Deno.test('createUsersService.inviteSelfViaLawHub skips outbound call when LSAC_SKIP_CALLS=true', async () => {
  const previous = Deno.env.get('LSAC_SKIP_CALLS')
  Deno.env.set('LSAC_SKIP_CALLS', 'true')
  try {
    let upserted: import('./users.mapper.ts').ProfileUpsertInput | undefined
    const repository = mockRepo({
      upsertProfile: async (row) => {
        upserted = row
        return {
          id: row.id,
          email: row.email,
          full_name: row.full_name,
          role: 'student',
          student_coaching_id: row.student_coaching_id,
          is_first_time_login: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }
      },
    })
    const service = createUsersService({ repository, lawHub: null })
    const out = await service.inviteSelfViaLawHub('u-1', 'test@example.com', {
      firstName: 'Test',
      lastName: 'User',
      isPrepPlusRequired: false,
      isPrepPlusIncludedFromVendor: false,
    })

    assertEquals(out.student_coaching_id, 'pending-u-1')
    assertEquals(upserted?.email, 'test@example.com')
    assertEquals(upserted?.full_name, 'Test User')
  } finally {
    if (previous === undefined) {
      Deno.env.delete('LSAC_SKIP_CALLS')
    } else {
      Deno.env.set('LSAC_SKIP_CALLS', previous)
    }
  }
})

Deno.test('createUsersService rejects email addresses containing plus for LawHub', async () => {
  const service = createUsersService({
    repository: mockRepo(),
    lawHub: { async ensureToken() {} } as unknown as LawHubClient,
  })
  await assertRejects(
    () => service.syncProfileFromLawHubEmail('u-1', 'stu+tag@example.com'),
    Error,
    'LSAC policy does not allow',
  )
})

Deno.test('createUsersService.upgradeSelfInLawHub refreshes profile after upgrade', async () => {
  let upgraded = false
  let refreshedCoachingId: string | undefined
  const lawHub = {
    async ensureToken() {},
    async getStudentsByEmail() {
      throw new Error('not used')
    },
    async getStudentByCoachingId(coachingId: string) {
      refreshedCoachingId = coachingId
      return {
        studentCoachingId: coachingId,
        emailAddress: 'stu@example.com',
        firstName: 'Sam',
        lastName: 'Student',
        linked: true,
        subscriptionType: 'PrepPlus',
      }
    },
    async addOrInviteStudent() {
      throw new Error('not used')
    },
    async listVendorStudents() {
      throw new Error('not used')
    },
    async upgradeStudent(coachingId: string) {
      upgraded = true
      assertEquals(coachingId, 'coach-1')
      return { subscriptionType: 'PrepPlus' }
    },
    async getTestInstances() {
      throw new Error('not used')
    },
    async logContentAccess() {
      throw new Error('not used')
    },
  } as unknown as LawHubClient

  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: 'stu@example.com',
      full_name: 'Sam Student',
      role: 'student',
      student_coaching_id: 'coach-1',
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
  })

  const service = createUsersService({ repository, lawHub })
  const result = await service.upgradeSelfInLawHub('u-1')
  assertEquals(upgraded, true)
  assertEquals(refreshedCoachingId, 'coach-1')
  assertEquals(result.upgraded, true)
  assertEquals(result.profile?.student_coaching_id, 'coach-1')
})

Deno.test('createUsersService.logLawHubLogin forwards metadata to LawHub log API', async () => {
  let loggedPayload: Record<string, unknown> | undefined
  const lawHub = {
    async ensureToken() {},
    async getStudentsByEmail() {
      throw new Error('not used')
    },
    async getStudentByCoachingId() {
      throw new Error('not used')
    },
    async addOrInviteStudent() {
      throw new Error('not used')
    },
    async listVendorStudents() {
      throw new Error('not used')
    },
    async upgradeStudent() {
      throw new Error('not used')
    },
    async getTestInstances() {
      throw new Error('not used')
    },
    async logContentAccess(payload: Record<string, unknown>) {
      loggedPayload = payload
      return { ok: true }
    },
  } as unknown as LawHubClient

  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: null,
      full_name: null,
      role: 'student',
      student_coaching_id: 'coach-9',
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
    insertLogEvent: async () => {},
  })

  const service = createUsersService({ repository, lawHub })
  await service.logLawHubLogin('u-1', 'student@example.com', {
    userAgent: 'vitest',
    ipAddress: '127.0.0.1',
  })

  assertEquals(loggedPayload?.eventType, 'Login')
  assertEquals(loggedPayload?.emailAddress, 'student@example.com')
  assertEquals((loggedPayload?.metadata as Record<string, string>).userAgent, 'vitest')
})

Deno.test('createUsersService.linkLawHubAccount invites when email lookup misses', async () => {
  let invited = false
  const lawHub = {
    async ensureToken() {},
    async getStudentsByEmail() {
      return []
    },
    async getStudentByCoachingId(coachingId: string) {
      return {
        studentCoachingId: coachingId,
        emailAddress: 'new@example.com',
        firstName: 'New',
        lastName: 'Student',
        linked: false,
        subscriptionType: 'PrepPlus',
      }
    },
    async addOrInviteStudent() {
      invited = true
      return {
        studentCoachingId: 'coach-new',
        emailAddress: 'new@example.com',
        firstName: 'New',
        lastName: 'Student',
        linked: false,
      }
    },
    async listVendorStudents() {
      throw new Error('not used')
    },
    async upgradeStudent() {
      throw new Error('not used')
    },
    async getTestInstances() {
      throw new Error('not used')
    },
    async logContentAccess() {
      throw new Error('not used')
    },
  } as unknown as LawHubClient

  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: 'new@example.com',
      full_name: 'New Student',
      role: 'student',
      student_coaching_id: 'coach-new',
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
  })

  const service = createUsersService({ repository, lawHub: withEmailLookup(lawHub) })
  const profile = await service.linkLawHubAccount('u-1', 'new@example.com', {
    firstName: 'New',
    lastName: 'Student',
  })
  assertEquals(invited, true)
  assertEquals(profile.student_coaching_id, 'coach-new')
})

Deno.test('createUsersService.linkLawHubWithExistingPrepPlus invites when LawHub email lookup is 404', async () => {
  let invited = false
  const lawHub = {
    async ensureToken() {},
    async getStudentsByEmail() {
      throw new LawHubApiError({
        status: 404,
        body: '{"statusCode":404,"error":"Student with email new@example.com not found!"}',
        method: 'GET',
        path: '/api/vendor/vendor/studentEmails/new%40example.com',
      })
    },
    async getStudentByCoachingId(coachingId: string) {
      return {
        studentCoachingId: coachingId,
        emailAddress: 'new@example.com',
        firstName: 'New',
        lastName: 'Student',
        linked: false,
        subscriptionType: 'PrepPlus',
      }
    },
    async addOrInviteStudent(payload: Record<string, unknown>) {
      invited = true
      assertEquals(payload.isPrepPlusIncludedFromVendor, false)
      return {
        studentCoachingId: 'coach-new',
        emailAddress: 'new@example.com',
        firstName: 'New',
        lastName: 'Student',
        linked: false,
      }
    },
    async listVendorStudents() {
      throw new Error('not used')
    },
    async upgradeStudent() {
      throw new Error('not used')
    },
    async getTestInstances() {
      throw new Error('not used')
    },
    async logContentAccess() {
      throw new Error('not used')
    },
  } as unknown as LawHubClient

  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: 'new@example.com',
      full_name: 'New Student',
      role: 'student',
      student_coaching_id: 'coach-new',
      stripe_customer_id: null,
      prep_plus_source: 'existing_lsac',
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
  })

  const service = createUsersService({ repository, lawHub: withEmailLookup(lawHub) })
  const profile = await service.linkLawHubWithExistingPrepPlus('u-1', 'new@example.com', {
    firstName: 'New',
    lastName: 'Student',
  })
  assertEquals(invited, true)
  assertEquals(profile.student_coaching_id, 'coach-new')
})

Deno.test('saveOnboarding upserts profile and preferences and seeds starting score', async () => {
  let scoreUpserted = false
  const repository = mockRepo({
    upsertProfile: async (row) => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: 'student',
      student_coaching_id: row.student_coaching_id,
      is_first_time_login: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
    upsertOfficialLsatScore: async () => {
      scoreUpserted = true
      return {
        id: 'score-1',
        user_id: 'user-1',
        test_label: 'Starting score',
        test_date: null,
        scaled_score: 155,
        sort_order: 0,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }
    },
  })
  const service = createUsersService({ repository, lawHub: null })
  const out = await service.saveOnboarding('user-1', {
    fullName: 'Ada Lovelace',
    username: 'ada',
    plannedLsatWindow: '3_6_months',
    goalScore: '170',
    startingScore: '155',
    studyDays: ['monday'],
    studyHoursLabel: '1-2 hours/day',
    wantsLessons: true,
  })
  assertEquals(out.profile.full_name, 'Ada Lovelace')
  assertEquals(out.preferences.goalScore, 170)
  assertEquals(out.preferences.startingScore, 155)
  assertEquals(scoreUpserted, true)
})

Deno.test('createUsersService.getEntitlementState returns PAYMENT_REQUIRED without billing access', async () => {
  await withStripeTestEnv(async () => {
    const repository = mockRepo({
      getProfileById: async (id) => ({
        id,
        email: 'student@example.com',
        full_name: 'Student',
        role: 'student',
        student_coaching_id: null,
        stripe_customer_id: null,
        prep_plus_source: null,
        is_first_time_login: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }),
      hasActiveSubscription: async () => false,
    })
    const service = createUsersService({ repository })
    const entitlement = await service.getEntitlementState('user-1')
    assertEquals(entitlement.hasActiveCore, false)
    assertEquals(entitlement.accessState, 'PAYMENT_REQUIRED')
  })
})

Deno.test('createUsersService.getEntitlementState returns PAYMENT_REQUIRED for existing_lsac without subscription', async () => {
  await withStripeTestEnv(async () => {
    const repository = mockRepo({
      getProfileById: async (id) => ({
        id,
        email: 'student@example.com',
        full_name: 'Student',
        role: 'student',
        student_coaching_id: 'coach-1',
        stripe_customer_id: null,
        prep_plus_source: 'existing_lsac',
        is_first_time_login: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }),
      getLatestStudentSnapshotByUserId: async () => ({
        student_coaching_id: 'coach-1',
        linked: true,
        subscription_type: 'LawHub Advantage',
        fetched_at: '2026-01-02T00:00:00Z',
      }),
      hasActiveSubscription: async () => false,
    })
    const service = createUsersService({ repository })
    const entitlement = await service.getEntitlementState('user-1')
    assertEquals(entitlement.hasActiveCore, false)
    assertEquals(entitlement.accessState, 'PAYMENT_REQUIRED')
  })
})

Deno.test('createUsersService.getEntitlementState returns LSAC_REQUIRED when coach link pending', async () => {
  const repository = mockRepo({
    getProfileById: async (id) => ({
      id,
      email: 'student@example.com',
      full_name: 'Student',
      role: 'student',
      student_coaching_id: 'coach-1',
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
    getLatestStudentSnapshotByUserId: async () => ({
      student_coaching_id: 'coach-1',
      linked: false,
      subscription_type: 'LawHub Advantage',
      fetched_at: '2026-01-02T00:00:00Z',
    }),
  })
  const service = createUsersService({ repository })
  const entitlement = await service.getEntitlementState('user-1')
  assertEquals(entitlement.isLsacLinked, true)
  assertEquals(entitlement.isLsacEligible, false)
  assertEquals(entitlement.accessState, 'LSAC_REQUIRED')
})

Deno.test('createUsersService.getEntitlementState returns FULL_ACCESS with active sub and linked coach', async () => {
  await withStripeTestEnv(async () => {
    const repository = mockRepo({
      getProfileById: async (id) => ({
        id,
        email: 'student@example.com',
        full_name: 'Student',
        role: 'student',
        student_coaching_id: 'coach-1',
        is_first_time_login: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }),
      getLatestStudentSnapshotByUserId: async () => ({
        student_coaching_id: 'coach-1',
        linked: true,
        subscription_type: 'LawHub Advantage',
        fetched_at: '2026-01-02T00:00:00Z',
      }),
      hasActiveSubscription: async () => true,
    })
    const service = createUsersService({ repository })
    const entitlement = await service.getEntitlementState('user-1')
    assertEquals(entitlement.hasActiveCore, true)
    assertEquals(entitlement.isLsacEligible, true)
    assertEquals(entitlement.accessState, 'FULL_ACCESS')
  })
})

Deno.test('createUsersService.linkLawHubWithExistingPrepPlus sets existing_lsac source', async () => {
  let sourceSet = false
  const lawHub = {
    async getStudentsByEmail() {
      return [{ studentCoachingId: 'coach-1', linked: true, subscriptionType: 'PrepPlus' }]
    },
    async addOrInviteStudent() {
      throw new Error('should not invite')
    },
    async getStudentByCoachingId() {
      return { studentCoachingId: 'coach-1', linked: true, subscriptionType: 'PrepPlus' }
    },
    async listVendorStudents() {
      throw new Error('not used')
    },
    async upgradeStudent() {
      throw new Error('not used')
    },
    async getTestInstances() {
      throw new Error('not used')
    },
    async logContentAccess() {
      throw new Error('not used')
    },
    async ensureToken() {},
  } as unknown as LawHubClient

  const repository = mockRepo({
    setPrepPlusSource: async (_userId, source) => {
      sourceSet = true
      assertEquals(source, 'existing_lsac')
    },
    hasActiveSubscription: async () => true,
    getProfileById: async (id) => ({
      id,
      email: 'student@example.com',
      full_name: 'Student',
      role: 'student',
      student_coaching_id: 'coach-1',
      stripe_customer_id: null,
      prep_plus_source: 'existing_lsac',
      is_first_time_login: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
  })

  const service = createUsersService({ repository, lawHub: withEmailLookup(lawHub) })
  await service.linkLawHubWithExistingPrepPlus('u-1', 'student@example.com', {
    firstName: 'A',
    lastName: 'B',
  })
  assertEquals(sourceSet, true)
})

Deno.test('createUsersService.linkLawHubWithExistingPrepPlus rejects without subscription', async () => {
  await withStripeTestEnv(async () => {
    const repository = mockRepo({
      hasActiveSubscription: async () => false,
    })
    const service = createUsersService({ repository, lawHub: null })
    await assertRejects(
      () =>
        service.linkLawHubWithExistingPrepPlus('u-1', 'student@example.com', {
          firstName: 'A',
          lastName: 'B',
        }),
      Error,
      'Active subscription required',
    )
  })
})

Deno.test('createUsersService.linkLawHubWithVendorPrepPlus rejects without subscription', async () => {
  await withStripeTestEnv(async () => {
    const repository = mockRepo({
      hasActiveSubscription: async () => false,
    })
    const service = createUsersService({ repository, lawHub: null })
    await assertRejects(
      () =>
        service.linkLawHubWithVendorPrepPlus('u-1', 'student@example.com', {
          firstName: 'A',
          lastName: 'B',
        }),
      Error,
      'Active subscription required',
    )
  })
})

Deno.test('getStudyContext returns preferences and scores', async () => {
  const repository = mockRepo({
    getStudyPreferencesByUserId: async () => ({
      user_id: 'user-1',
      username: 'ada',
      planned_lsat_window: '3_6_months',
      planned_lsat_date: null,
      law_school_cycle: '2027',
      goal_score: 170,
      starting_score: 155,
      study_days: [],
      study_hours_label: null,
      wants_lessons: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
    listOfficialLsatScores: async () => [
      {
        id: 'score-1',
        user_id: 'user-1',
        test_label: 'June 2025',
        test_date: '2025-06-01',
        scaled_score: 159,
        sort_order: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ],
  })
  const service = createUsersService({ repository, lawHub: null })
  const ctx = await service.getStudyContext('user-1')
  assertEquals(ctx.preferences?.lawSchoolCycle, '2027')
  assertEquals(ctx.officialScores.length, 1)
  assertEquals(ctx.officialScores[0]?.scaledScore, 159)
})

Deno.test('upsertOfficialScore requires non-empty label', async () => {
  const service = createUsersService({ repository: mockRepo(), lawHub: null })
  await assertRejects(
    () => service.upsertOfficialScore('user-1', { testLabel: '  ' }),
    Error,
    'testLabel is required',
  )
})
