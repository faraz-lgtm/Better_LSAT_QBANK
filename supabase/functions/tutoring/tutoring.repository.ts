import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type TutoringSessionStatus = 'scheduled' | 'completed' | 'canceled' | 'no_show'
export type ArtifactStatus = 'none' | 'processing' | 'ready' | 'failed'

export type TutoringSessionRow = {
  id: string
  user_id: string
  amelia_booking_id: number | null
  amelia_appointment_id: number | null
  amelia_service_id: number | null
  amelia_provider_id: number | null
  tutor_name: string | null
  focus: string | null
  starts_at: string
  ends_at: string | null
  timezone: string | null
  status: TutoringSessionStatus
  zoom_meeting_id: string | null
  zoom_meeting_uuid: string | null
  join_url: string | null
  recording_status: ArtifactStatus
  transcript_status: ArtifactStatus
  artifacts_emailed_at: string | null
  created_at: string
  updated_at: string
}

export type TutoringSessionArtifactRow = {
  session_id: string
  recording_storage_path: string | null
  recording_content_type: string | null
  duration_seconds: number | null
  transcript_storage_path: string | null
  transcript_json: unknown
  summary_json: unknown
  takeaways: unknown
  zoom_share_url: string | null
  created_at: string
  updated_at: string
}

/** Free-text category; common presets still used by Zoom todos / UI defaults. */
export type TutoringTodoTag = string
export type TutoringTodoSource = 'zoom_summary' | 'user'

export type TutoringSessionTodoRow = {
  id: string
  session_id: string
  user_id: string
  title: string
  tag: TutoringTodoTag
  source: TutoringTodoSource
  done: boolean
  due_at: string | null
  created_at: string
  updated_at: string
}

export type TutoringPackageEntitlementRow = {
  id: string
  user_id: string
  amelia_package_customer_id: number | null
  amelia_package_id: number | null
  name: string | null
  slots_total: number
  slots_remaining: number
  status: 'active' | 'exhausted' | 'canceled'
  created_at: string
  updated_at: string
}

export type UpsertTutoringSessionInput = {
  user_id: string
  amelia_booking_id?: number | null
  amelia_appointment_id?: number | null
  amelia_service_id?: number | null
  amelia_provider_id?: number | null
  tutor_name?: string | null
  focus?: string | null
  starts_at: string
  ends_at?: string | null
  timezone?: string | null
  status?: TutoringSessionStatus
  zoom_meeting_id?: string | null
  zoom_meeting_uuid?: string | null
  join_url?: string | null
  recording_status?: ArtifactStatus
  transcript_status?: ArtifactStatus
}

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function createTutoringRepository(client: SupabaseClient) {
  return {
    async getProfileAmeliaLink(userId: string): Promise<{
      email: string | null
      full_name: string | null
      first_name: string | null
      last_name: string | null
      amelia_customer_id: number | null
    } | null> {
      const { data, error } = await client
        .from('profiles')
        .select('email, full_name, first_name, last_name, amelia_customer_id')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async setAmeliaCustomerId(userId: string, ameliaCustomerId: number): Promise<void> {
      const { error } = await client
        .from('profiles')
        .update({ amelia_customer_id: ameliaCustomerId, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) throw error
    },

    async findUserIdByEmail(email: string): Promise<string | null> {
      const normalized = email.trim().toLowerCase()
      const { data, error } = await client
        .from('profiles')
        .select('id, email')
        .ilike('email', normalized)
        .limit(5)
      if (error) throw error
      const exact = (data ?? []).find((row) => (row.email ?? '').toLowerCase() === normalized)
      return exact?.id ?? data?.[0]?.id ?? null
    },

    async findUserIdByAmeliaCustomerId(ameliaCustomerId: number): Promise<string | null> {
      const { data, error } = await client
        .from('profiles')
        .select('id')
        .eq('amelia_customer_id', ameliaCustomerId)
        .maybeSingle()
      if (error) throw error
      return data?.id ?? null
    },

    async listSessionsForUser(userId: string): Promise<TutoringSessionRow[]> {
      const { data, error } = await client
        .from('tutoring_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('starts_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as TutoringSessionRow[]
    },

    async getSessionForUser(userId: string, sessionId: string): Promise<TutoringSessionRow | null> {
      const { data, error } = await client
        .from('tutoring_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('id', sessionId)
        .maybeSingle()
      if (error) throw error
      return data as TutoringSessionRow | null
    },

    async getSessionById(sessionId: string): Promise<TutoringSessionRow | null> {
      const { data, error } = await client
        .from('tutoring_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()
      if (error) throw error
      return data as TutoringSessionRow | null
    },

    async findSessionByAmeliaBookingId(bookingId: number): Promise<TutoringSessionRow | null> {
      const { data, error } = await client
        .from('tutoring_sessions')
        .select('*')
        .eq('amelia_booking_id', bookingId)
        .maybeSingle()
      if (error) throw error
      return data as TutoringSessionRow | null
    },

    async findSessionByZoomMeeting(
      meetingId: string | null,
      meetingUuid: string | null,
    ): Promise<TutoringSessionRow | null> {
      if (meetingUuid) {
        const { data, error } = await client
          .from('tutoring_sessions')
          .select('*')
          .eq('zoom_meeting_uuid', meetingUuid)
          .maybeSingle()
        if (error) throw error
        if (data) return data as TutoringSessionRow
      }
      if (meetingId) {
        const { data, error } = await client
          .from('tutoring_sessions')
          .select('*')
          .eq('zoom_meeting_id', meetingId)
          .maybeSingle()
        if (error) throw error
        if (data) return data as TutoringSessionRow

        if (/^\d+$/.test(meetingId)) {
          const { data: joinUrlMatches, error: joinUrlError } = await client
            .from('tutoring_sessions')
            .select('*')
            .ilike('join_url', `%/j/${meetingId}%`)
            .limit(2)
          if (joinUrlError) throw joinUrlError
          if (joinUrlMatches?.length === 1) return joinUrlMatches[0] as TutoringSessionRow
        }
      }
      return null
    },

    async upsertSession(input: UpsertTutoringSessionInput): Promise<TutoringSessionRow> {
      const now = new Date().toISOString()
      if (input.amelia_booking_id != null) {
        const existing = await this.findSessionByAmeliaBookingId(input.amelia_booking_id)
        if (existing) {
          const { data, error } = await client
            .from('tutoring_sessions')
            .update({
              amelia_appointment_id: input.amelia_appointment_id ?? existing.amelia_appointment_id,
              amelia_service_id: input.amelia_service_id ?? existing.amelia_service_id,
              amelia_provider_id: input.amelia_provider_id ?? existing.amelia_provider_id,
              tutor_name: input.tutor_name ?? existing.tutor_name,
              focus: input.focus ?? existing.focus,
              starts_at: input.starts_at,
              ends_at: input.ends_at ?? existing.ends_at,
              timezone: input.timezone ?? existing.timezone,
              status: input.status ?? existing.status,
              zoom_meeting_id: input.zoom_meeting_id ?? existing.zoom_meeting_id,
              zoom_meeting_uuid: input.zoom_meeting_uuid ?? existing.zoom_meeting_uuid,
              join_url: input.join_url ?? existing.join_url,
              recording_status: input.recording_status ?? existing.recording_status,
              transcript_status: input.transcript_status ?? existing.transcript_status,
              updated_at: now,
            })
            .eq('id', existing.id)
            .select('*')
            .single()
          if (error) throw error
          return data as TutoringSessionRow
        }
      }

      const { data, error } = await client
        .from('tutoring_sessions')
        .insert({
          user_id: input.user_id,
          amelia_booking_id: input.amelia_booking_id ?? null,
          amelia_appointment_id: input.amelia_appointment_id ?? null,
          amelia_service_id: input.amelia_service_id ?? null,
          amelia_provider_id: input.amelia_provider_id ?? null,
          tutor_name: input.tutor_name ?? null,
          focus: input.focus ?? null,
          starts_at: input.starts_at,
          ends_at: input.ends_at ?? null,
          timezone: input.timezone ?? null,
          status: input.status ?? 'scheduled',
          zoom_meeting_id: input.zoom_meeting_id ?? null,
          zoom_meeting_uuid: input.zoom_meeting_uuid ?? null,
          join_url: input.join_url ?? null,
          recording_status: input.recording_status ?? 'none',
          transcript_status: input.transcript_status ?? 'none',
          updated_at: now,
        })
        .select('*')
        .single()
      if (error) throw error
      return data as TutoringSessionRow
    },

    async updateSessionStatus(
      sessionId: string,
      status: TutoringSessionStatus,
    ): Promise<TutoringSessionRow> {
      const { data, error } = await client
        .from('tutoring_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select('*')
        .single()
      if (error) throw error
      return data as TutoringSessionRow
    },

    async updateArtifactStatuses(
      sessionId: string,
      patch: {
        recording_status?: ArtifactStatus
        transcript_status?: ArtifactStatus
        zoom_meeting_id?: string | null
        zoom_meeting_uuid?: string | null
        status?: TutoringSessionStatus
      },
    ): Promise<TutoringSessionRow> {
      const { data, error } = await client
        .from('tutoring_sessions')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select('*')
        .single()
      if (error) throw error
      return data as TutoringSessionRow
    },

    async markArtifactsEmailed(sessionId: string): Promise<void> {
      const { error } = await client
        .from('tutoring_sessions')
        .update({
          artifacts_emailed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
      if (error) throw error
    },

    async getArtifacts(sessionId: string): Promise<TutoringSessionArtifactRow | null> {
      const { data, error } = await client
        .from('tutoring_session_artifacts')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()
      if (error) throw error
      return data as TutoringSessionArtifactRow | null
    },

    async upsertArtifacts(
      sessionId: string,
      patch: Partial<
        Pick<
          TutoringSessionArtifactRow,
          | 'recording_storage_path'
          | 'recording_content_type'
          | 'duration_seconds'
          | 'transcript_storage_path'
          | 'transcript_json'
          | 'summary_json'
          | 'takeaways'
          | 'zoom_share_url'
        >
      >,
    ): Promise<TutoringSessionArtifactRow> {
      const now = new Date().toISOString()
      const existing = await this.getArtifacts(sessionId)
      if (existing) {
        const { data, error } = await client
          .from('tutoring_session_artifacts')
          .update({ ...patch, updated_at: now })
          .eq('session_id', sessionId)
          .select('*')
          .single()
        if (error) throw error
        return data as TutoringSessionArtifactRow
      }
      const { data, error } = await client
        .from('tutoring_session_artifacts')
        .insert({ session_id: sessionId, ...patch, updated_at: now })
        .select('*')
        .single()
      if (error) throw error
      return data as TutoringSessionArtifactRow
    },

    async listTodosForSession(
      userId: string,
      sessionId: string,
    ): Promise<TutoringSessionTodoRow[]> {
      const { data, error } = await client
        .from('tutoring_session_todos')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as TutoringSessionTodoRow[]
    },

    async createTodo(input: {
      sessionId: string
      userId: string
      title: string
      tag?: TutoringTodoTag
      source?: TutoringTodoSource
      dueAt?: string | null
    }): Promise<TutoringSessionTodoRow> {
      const now = new Date().toISOString()
      const { data, error } = await client
        .from('tutoring_session_todos')
        .insert({
          session_id: input.sessionId,
          user_id: input.userId,
          title: input.title.trim(),
          tag: input.tag ?? 'Homework',
          source: input.source ?? 'user',
          due_at: input.dueAt ?? null,
          updated_at: now,
        })
        .select('*')
        .single()
      if (error) throw error
      return data as TutoringSessionTodoRow
    },

    async upsertZoomSummaryTodos(input: {
      sessionId: string
      userId: string
      titles: string[]
    }): Promise<TutoringSessionTodoRow[]> {
      const now = new Date().toISOString()
      const rows = input.titles
        .map((title) => title.trim())
        .filter(Boolean)
        .map((title) => ({
          session_id: input.sessionId,
          user_id: input.userId,
          title,
          tag: 'Homework' as const,
          source: 'zoom_summary' as const,
          updated_at: now,
        }))
      if (rows.length === 0) return []
      const { data, error } = await client
        .from('tutoring_session_todos')
        .upsert(rows, { onConflict: 'session_id,source,title', ignoreDuplicates: true })
        .select('*')
      if (error) throw error
      return (data ?? []) as TutoringSessionTodoRow[]
    },

    async getTodoForUser(userId: string, todoId: string): Promise<TutoringSessionTodoRow | null> {
      const { data, error } = await client
        .from('tutoring_session_todos')
        .select('*')
        .eq('user_id', userId)
        .eq('id', todoId)
        .maybeSingle()
      if (error) throw error
      return data as TutoringSessionTodoRow | null
    },

    async updateTodo(
      userId: string,
      todoId: string,
      patch: {
        done?: boolean
        title?: string
        tag?: TutoringTodoTag
        dueAt?: string | null
      },
    ): Promise<TutoringSessionTodoRow> {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (typeof patch.done === 'boolean') updates.done = patch.done
      if (typeof patch.title === 'string') updates.title = patch.title
      if (typeof patch.tag === 'string') updates.tag = patch.tag
      if (patch.dueAt !== undefined) updates.due_at = patch.dueAt

      const { data, error } = await client
        .from('tutoring_session_todos')
        .update(updates)
        .eq('user_id', userId)
        .eq('id', todoId)
        .select('*')
        .single()
      if (error) throw error
      return data as TutoringSessionTodoRow
    },

    async listActivePackages(userId: string): Promise<TutoringPackageEntitlementRow[]> {
      const { data, error } = await client
        .from('tutoring_package_entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as TutoringPackageEntitlementRow[]
    },

    async uploadSessionMedia(
      path: string,
      bytes: Uint8Array,
      contentType: string,
    ): Promise<void> {
      const { error } = await client.storage
        .from('tutoring-session-media')
        .upload(path, bytes, { contentType, upsert: true })
      if (error) {
        const detail = [error.message, (error as { statusCode?: string }).statusCode]
          .filter(Boolean)
          .join(' ')
        throw new Error(`Storage upload failed (${path}): ${detail || 'unknown error'}`)
      }
    },

    async createSignedMediaUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
      const { data, error } = await client.storage
        .from('tutoring-session-media')
        .createSignedUrl(path, expiresInSeconds)
      if (error) throw error
      return data?.signedUrl ?? null
    },
  }
}

export type TutoringRepository = ReturnType<typeof createTutoringRepository>
