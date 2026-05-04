import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { ProfileUpsertInput } from './users.mapper.ts'

export type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  role: 'student' | 'admin'
  student_coaching_id: string | null
  is_first_time_login: boolean
  created_at: string
  updated_at: string
}

export type LsacStudentSnapshotRow = {
  id: number
  user_id: string
  student_coaching_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  linked: boolean | null
  subscription_type: string | null
  fetched_at: string
}

export type LatestLsacSnapshotRow = Pick<
  LsacStudentSnapshotRow,
  'student_coaching_id' | 'linked' | 'subscription_type' | 'fetched_at'
>

export type LsacTestInstanceRow = {
  id: number
  user_id: string
  student_coaching_id: string
  test_instance_id: string
  test_id: string | null
  is_completed: boolean | null
  start_date: string | null
  end_date: string | null
  updated_at: string
}

export type LsacLogEventRow = {
  id: number
  user_id: string
  student_coaching_id: string
  event_type: string
  status_code: number | null
  success: boolean
  error_message: string | null
  created_at: string
}

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

export function createUsersRepository(client: SupabaseClient) {
  return {
    async getProfileById(id: string): Promise<ProfileRow | null> {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      return data as ProfileRow | null
    },

    async upsertProfile(row: ProfileUpsertInput): Promise<ProfileRow> {
      const { data, error } = await client
        .from('profiles')
        .upsert(
          {
            ...row,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
        .select()
        .single()

      if (error) throw error
      return data as ProfileRow
    },

    async markFirstTimeLogin(userId: string, isFirstTimeLogin: boolean): Promise<ProfileRow> {
      const existing = await this.getProfileById(userId)
      if (existing) {
        const { data, error } = await client
          .from('profiles')
          .update({
            is_first_time_login: isFirstTimeLogin,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select()
          .single()
        if (error) throw error
        return data as ProfileRow
      }

      const { data, error } = await client
        .from('profiles')
        .upsert(
          {
            id: userId,
            role: 'student',
            is_first_time_login: isFirstTimeLogin,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
        .select()
        .single()
      if (error) throw error
      return data as ProfileRow
    },

    async listProfiles(limit = 200): Promise<ProfileRow[]> {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data ?? []) as ProfileRow[]
    },

    async insertStudentSnapshot(input: {
      userId: string
      studentCoachingId: string
      rawPayload: Record<string, unknown>
    }): Promise<void> {
      const row = input.rawPayload
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

    async getLatestStudentSnapshotByUserId(userId: string): Promise<LatestLsacSnapshotRow | null> {
      const { data, error } = await client
        .from('lsac_student_snapshots')
        .select('student_coaching_id,linked,subscription_type,fetched_at')
        .eq('user_id', userId)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as LatestLsacSnapshotRow | null
    },

    async upsertTestInstances(input: {
      userId: string
      studentCoachingId: string
      instances: unknown[]
    }): Promise<void> {
      if (input.instances.length === 0) return
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

      if (rows.length === 0) return
      const { error } = await client
        .from('lsac_test_instances')
        .upsert(rows, {
          onConflict: 'student_coaching_id,test_instance_id',
        })
      if (error) throw error
    },

    async insertLogEvent(input: {
      userId: string
      studentCoachingId: string
      eventType: string
      statusCode: number | null
      success: boolean
      errorMessage?: string
      requestPayload: Record<string, unknown>
      responsePayload?: Record<string, unknown> | null
    }): Promise<void> {
      const { error } = await client.from('lsac_log_events').insert({
        user_id: input.userId,
        student_coaching_id: input.studentCoachingId,
        event_type: input.eventType,
        status_code: input.statusCode,
        success: input.success,
        error_message: input.errorMessage ?? null,
        request_payload: input.requestPayload,
        response_payload: input.responsePayload ?? null,
      })
      if (error) throw error
    },

    async listLsacStudentSnapshots(limit = 200): Promise<LsacStudentSnapshotRow[]> {
      const { data, error } = await client
        .from('lsac_student_snapshots')
        .select(
          'id,user_id,student_coaching_id,email,first_name,last_name,linked,subscription_type,fetched_at',
        )
        .order('fetched_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as LsacStudentSnapshotRow[]
    },

    async listLsacTestInstances(limit = 200): Promise<LsacTestInstanceRow[]> {
      const { data, error } = await client
        .from('lsac_test_instances')
        .select(
          'id,user_id,student_coaching_id,test_instance_id,test_id,is_completed,start_date,end_date,updated_at',
        )
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as LsacTestInstanceRow[]
    },

    async listLsacLogEvents(limit = 200): Promise<LsacLogEventRow[]> {
      const { data, error } = await client
        .from('lsac_log_events')
        .select(
          'id,user_id,student_coaching_id,event_type,status_code,success,error_message,created_at',
        )
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as LsacLogEventRow[]
    },
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
