import { assertEquals } from 'jsr:@std/assert@1'
import { createLsacSyncService } from './lsac-sync.service.ts'

Deno.test('lsac-sync matches profiles and writes snapshots', async () => {
  let snapshotWrites = 0
  let instancesWrites = 0
  const service = createLsacSyncService({
    lawHub: {
      async ensureToken() {},
      async listVendorStudents() {
        return [
          { studentCoachingId: 'c1', emailAddress: 'a@b.com' },
          { studentCoachingId: 'c2', emailAddress: 'c@d.com' },
        ]
      },
      async getTestInstances() {
        return [{ testInstanceId: 't1' }]
      },
      async getStudentsByEmail() {
        throw new Error('not used')
      },
      async getStudentByCoachingId() {
        throw new Error('not used')
      },
      async addOrInviteStudent() {
        throw new Error('not used')
      },
      async upgradeStudent() {
        throw new Error('not used')
      },
      async logContentAccess() {
        throw new Error('not used')
      },
    },
    repository: {
      async getProfilesByCoachingIds() {
        return [{ id: 'u1', student_coaching_id: 'c1' }]
      },
      async insertSnapshot() {
        snapshotWrites++
      },
      async upsertTestInstances() {
        instancesWrites++
        return 1
      },
    },
  })

  const out = await service.run({ includeInstances: true })
  assertEquals(out.rosterCount, 2)
  assertEquals(out.matchedProfiles, 1)
  assertEquals(snapshotWrites, 1)
  assertEquals(instancesWrites, 1)
  assertEquals(out.testInstancesUpserted, 1)
})
