import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import { createLsacDeeplinkService } from './lsac-deeplink.service.ts'

Deno.test('createLsacDeeplinkService builds URL from server values', async () => {
  const service = createLsacDeeplinkService({
    getLawHubBaseUrl: () => 'https://lawhub.org',
    getVendorId: () => 'vendor-1',
    getProfileById: async () => ({
      id: 'u1',
      email: null,
      full_name: null,
      role: 'student',
      student_coaching_id: 'coach-9',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }),
  })

  const url = await service.createUrl({
    userId: 'u1',
    testId: 'LSAT-PT-93',
    sectionId: 'AR:116',
  })
  assertEquals(
    url,
    'https://lawhub.org/prep/deeplink?vendorId=vendor-1&studentCoachingId=coach-9&testId=LSAT-PT-93&sectionId=AR%3A116',
  )
})

Deno.test('createLsacDeeplinkService requires student_coaching_id', async () => {
  const service = createLsacDeeplinkService({
    getLawHubBaseUrl: () => 'https://lawhub.org',
    getVendorId: () => 'vendor-1',
    getProfileById: async () => null,
  })

  await assertRejects(
    () => service.createUrl({ userId: 'u1', testId: 'x' }),
    Error,
    'No student_coaching_id',
  )
})
