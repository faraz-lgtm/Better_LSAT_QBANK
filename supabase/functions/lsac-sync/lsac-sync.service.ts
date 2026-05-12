import type { LawHubClient } from '../_shared/lawhub-client.ts'
import type { LsacSyncRepository } from './lsac-sync.repository.ts'

export type LsacSyncServiceDeps = {
  lawHub: LawHubClient
  repository: LsacSyncRepository
}

export function createLsacSyncService(deps: LsacSyncServiceDeps) {
  return {
    async run(input: { includeInstances?: boolean }): Promise<{
      rosterCount: number
      matchedProfiles: number
      snapshotsWritten: number
      testInstancesUpserted: number
      errors: string[]
    }> {
      const includeInstances = Boolean(input.includeInstances)
      const errors: string[] = []

      const rosterData = await deps.lawHub.listVendorStudents()
      const rosterRows = Array.isArray(rosterData) ? rosterData : []
      const coachingIds = rosterRows
        .map((row) => {
          if (!row || typeof row !== 'object') return null
          const record = row as Record<string, unknown>
          return typeof record.studentCoachingId === 'string'
            ? record.studentCoachingId
            : null
        })
        .filter((v): v is string => Boolean(v))

      const profiles = await deps.repository.getProfilesByCoachingIds(coachingIds)
      const profileByCoachingId = new Map<string, string>()
      for (const profile of profiles) {
        if (!profile.student_coaching_id) continue
        profileByCoachingId.set(profile.student_coaching_id, profile.id)
      }

      let snapshotsWritten = 0
      let testInstancesUpserted = 0
      for (const rosterEntry of rosterRows) {
        if (!rosterEntry || typeof rosterEntry !== 'object') continue
        const record = rosterEntry as Record<string, unknown>
        const coachingId = record.studentCoachingId
        if (typeof coachingId !== 'string') continue
        const userId = profileByCoachingId.get(coachingId)
        if (!userId) continue

        try {
          await deps.repository.insertSnapshot({
            userId,
            studentCoachingId: coachingId,
            payload: record,
          })
          snapshotsWritten += 1
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          errors.push(`snapshot:${coachingId}:${message}`)
        }

        if (!includeInstances) continue
        try {
          const instances = await deps.lawHub.getTestInstances(coachingId)
          const upserted = await deps.repository.upsertTestInstances({
            userId,
            studentCoachingId: coachingId,
            instances: Array.isArray(instances) ? instances : [],
          })
          testInstancesUpserted += upserted
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          errors.push(`instances:${coachingId}:${message}`)
        }
      }

      return {
        rosterCount: rosterRows.length,
        matchedProfiles: profiles.length,
        snapshotsWritten,
        testInstancesUpserted,
        errors,
      }
    },
  }
}
