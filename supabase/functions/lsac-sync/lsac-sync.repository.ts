import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type ProfileCoachingLink = {
  id: string
  student_coaching_id: string | null
}

export function createLsacSyncRepository(client: SupabaseClient) {
  return {
    async getProfilesByCoachingIds(
      coachingIds: string[],
    ): Promise<ProfileCoachingLink[]> {
      if (coachingIds.length === 0) return []
      const { data, error } = await client
        .from('profiles')
        .select('id, student_coaching_id')
        .in('student_coaching_id', coachingIds)

      if (error) throw error
      return (data ?? []) as ProfileCoachingLink[]
    },

    async insertSnapshot(input: {
      userId: string
      studentCoachingId: string
      payload: Record<string, unknown>
    }): Promise<void> {
      const row = input.payload
      const { error } = await client.from('lsac_student_snapshots').insert({
        user_id: input.userId,
        student_coaching_id: input.studentCoachingId,
        email: typeof row.emailAddress === 'string' ? row.emailAddress : null,
        first_name: typeof row.firstName === 'string' ? row.firstName : null,
        last_name: typeof row.lastName === 'string' ? row.lastName : null,
        linked: typeof row.linked === 'boolean' ? row.linked : null,
        subscription_type:
          typeof row.subscriptionType === 'string' ? row.subscriptionType : null,
        fetched_at: new Date().toISOString(),
        raw_payload: row,
      })
      if (error) throw error
    },

    async upsertTestInstances(input: {
      userId: string
      studentCoachingId: string
      instances: unknown[]
    }): Promise<number> {
      const rows = input.instances
        .map((instance) => {
          if (!instance || typeof instance !== 'object') return null
          const record = instance as Record<string, unknown>
          const testInstanceId =
            typeof record.testInstanceId === 'string' ? record.testInstanceId : null
          if (!testInstanceId) return null
          return {
            user_id: input.userId,
            student_coaching_id: input.studentCoachingId,
            test_instance_id: testInstanceId,
            test_id: typeof record.testId === 'string' ? record.testId : null,
            is_completed:
              typeof record.isCompleted === 'boolean' ? record.isCompleted : null,
            start_date: typeof record.startDate === 'string' ? record.startDate : null,
            end_date: typeof record.endDate === 'string' ? record.endDate : null,
            updated_at: new Date().toISOString(),
            raw_payload: record,
          }
        })
        .filter(Boolean)
      if (rows.length === 0) return 0

      const { error } = await client.from('lsac_test_instances').upsert(rows, {
        onConflict: 'student_coaching_id,test_instance_id',
      })
      if (error) throw error
      return rows.length
    },
  }
}

export type LsacSyncRepository = ReturnType<typeof createLsacSyncRepository>
