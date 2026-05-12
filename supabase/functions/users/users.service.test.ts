import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import type { LawHubClient } from '../_shared/lawhub-client.ts'
import type {
  LatestLsacSnapshotRow,
  LsacLogEventRow,
  LsacStudentSnapshotRow,
  LsacTestInstanceRow,
  ProfileRow,
} from './users.repository.ts'
import { createUsersService } from './users.service.ts'

function mockRepo(overrides: Partial<{
  getProfileById: (id: string) => Promise<ProfileRow | null>
  upsertProfile: (row: import('./users.mapper.ts').ProfileUpsertInput) => Promise<ProfileRow>
  insertStudentSnapshot: (input: {
    userId: string
    studentCoachingId: string
    rawPayload: Record<string, unknown>
  }) => Promise<void>
  upsertTestInstances: (input: {
    userId: string
    studentCoachingId: string
    instances: unknown[]
  }) => Promise<void>
  insertLogEvent: (input: {
    userId: string
    studentCoachingId: string
    eventType: string
    statusCode: number | null
    success: boolean
    errorMessage?: string
    requestPayload: Record<string, unknown>
    responsePayload?: Record<string, unknown> | null
  }) => Promise<void>
  listProfiles: (limit?: number) => Promise<ProfileRow[]>
  listLsacStudentSnapshots: (limit?: number) => Promise<LsacStudentSnapshotRow[]>
  listLsacTestInstances: (limit?: number) => Promise<LsacTestInstanceRow[]>
  listLsacLogEvents: (limit?: number) => Promise<LsacLogEventRow[]>
  getLatestStudentSnapshotByUserId: (userId: string) => Promise<LatestLsacSnapshotRow | null>
  markFirstTimeLogin: (userId: string, isFirstTimeLogin: boolean) => Promise<ProfileRow>
}> = {}) {
  const baseRow: ProfileRow = {
    id: 'x',
    email: null,
    full_name: null,
    role: 'student',
    student_coaching_id: null,
    is_first_time_login: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  return {
    getProfileById:
      overrides.getProfileById ??
      (async (id: string) => ({ ...baseRow, id })),
    upsertProfile:
      overrides.upsertProfile ??
      (async (row) => ({ ...baseRow, ...row })),
    insertStudentSnapshot:
      overrides.insertStudentSnapshot ??
      (async () => {}),
    upsertTestInstances:
      overrides.upsertTestInstances ??
      (async () => {}),
    insertLogEvent:
      overrides.insertLogEvent ??
      (async () => {}),
    listProfiles:
      overrides.listProfiles ??
      (async () => []),
    listLsacStudentSnapshots:
      overrides.listLsacStudentSnapshots ??
      (async () => []),
    listLsacTestInstances:
      overrides.listLsacTestInstances ??
      (async () => []),
    listLsacLogEvents:
      overrides.listLsacLogEvents ??
      (async () => []),
    getLatestStudentSnapshotByUserId:
      overrides.getLatestStudentSnapshotByUserId ??
      (async () => null),
    markFirstTimeLogin:
      overrides.markFirstTimeLogin ??
      (async (userId, isFirstTimeLogin) => ({ ...baseRow, id: userId, is_first_time_login: isFirstTimeLogin })),
  }
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
  } as unknown as LawHubClient

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

  const service = createUsersService({ repository, lawHub })
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
