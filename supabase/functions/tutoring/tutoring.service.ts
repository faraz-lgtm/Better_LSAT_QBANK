import type { AmeliaClient } from '../_shared/amelia-client.ts'
import type { AmeliaEnv } from '../_shared/amelia-env.ts'
import {
  ameliaLocalDateTimeToIso,
  mapSessionRowToDto,
  mapTranscriptJsonToViewer,
} from './tutoring.mapper.ts'
import type { TutoringRepository } from './tutoring.repository.ts'

function splitName(fullName: string | null | undefined, email: string): {
  firstName: string
  lastName: string
} {
  const trimmed = fullName?.trim() ?? ''
  if (!trimmed) {
    const local = email.split('@')[0] || 'Student'
    return { firstName: local, lastName: 'Student' }
  }
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0]!, lastName: 'Student' }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') }
}

export function createTutoringService(deps: {
  repository: TutoringRepository
  ameliaEnv: AmeliaEnv | null
  amelia: AmeliaClient | null
  getAppBaseUrl?: () => string
}) {
  const { repository, ameliaEnv, amelia } = deps

  function requireAmelia(): { env: AmeliaEnv; client: AmeliaClient } {
    if (!ameliaEnv || !amelia) {
      throw new Error('Amelia is not configured on the server (missing AMELIA_* env)')
    }
    return { env: ameliaEnv, client: amelia }
  }

  return {
    async listSlots(input: {
      startDateTime?: string
      endDateTime?: string
      providerId?: number
    }) {
      const { env, client } = requireAmelia()
      const providerIds = input.providerId
        ? [input.providerId]
        : env.defaultProviderId
          ? [env.defaultProviderId]
          : undefined
      const response = await client.getSlots({
        serviceId: env.defaultServiceId,
        persons: 1,
        locationId: env.defaultLocationId,
        providerIds,
        startDateTime: input.startDateTime,
        endDateTime: input.endDateTime,
      })
      return response
    },

    async createBooking(
      userId: string,
      input: {
        bookingStart: string
        providerId?: number
        timeZone?: string
      },
    ) {
      const { env, client } = requireAmelia()
      const profile = await repository.getProfileAmeliaLink(userId)
      const email = profile?.email?.trim()
      if (!email) throw new Error('Profile email required to book tutoring')

      const name = splitName(
        profile?.full_name ??
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' '),
        email,
      )
      const providerId = input.providerId ?? env.defaultProviderId
      if (!providerId) throw new Error('Amelia providerId required (set AMELIA_DEFAULT_PROVIDER_ID)')

      const timeZone = input.timeZone ?? 'America/New_York'
      const result = await client.createBooking({
        bookingStart: input.bookingStart,
        serviceId: env.defaultServiceId,
        providerId,
        locationId: env.defaultLocationId,
        timeZone,
        customer: {
          email,
          firstName: name.firstName,
          lastName: name.lastName,
        },
      })

      if (result.customerId) {
        await repository.setAmeliaCustomerId(userId, result.customerId)
      }

      const startsAt = result.bookingStart
        ? ameliaLocalDateTimeToIso(result.bookingStart, timeZone)
        : ameliaLocalDateTimeToIso(input.bookingStart, timeZone)
      const endsAt = result.bookingEnd
        ? ameliaLocalDateTimeToIso(result.bookingEnd, timeZone)
        : null

      const session = await repository.upsertSession({
        user_id: userId,
        amelia_booking_id: result.bookingId,
        amelia_appointment_id: result.appointmentId,
        amelia_service_id: result.serviceId ?? env.defaultServiceId,
        amelia_provider_id: result.providerId ?? providerId,
        tutor_name: result.tutorName,
        focus: result.focus,
        starts_at: startsAt,
        ends_at: endsAt,
        timezone: timeZone,
        status: 'scheduled',
        zoom_meeting_id: result.zoomMeetingId,
        join_url: result.joinUrl,
      })

      return mapSessionRowToDto(session)
    },

    async rescheduleBooking(
      userId: string,
      input: { sessionId: string; bookingStart: string; timeZone?: string },
    ) {
      const { client } = requireAmelia()
      const session = await repository.getSessionForUser(userId, input.sessionId)
      if (!session) throw new Error('Session not found')
      if (!session.amelia_booking_id) throw new Error('Session is missing Amelia booking id')

      const timeZone = input.timeZone ?? session.timezone ?? 'America/New_York'
      const result = await client.rescheduleBooking({
        bookingId: session.amelia_booking_id,
        bookingStart: input.bookingStart,
      })

      const startsAt = result.bookingStart
        ? ameliaLocalDateTimeToIso(result.bookingStart, timeZone)
        : ameliaLocalDateTimeToIso(input.bookingStart, timeZone)
      const endsAt = result.bookingEnd
        ? ameliaLocalDateTimeToIso(result.bookingEnd, timeZone)
        : session.ends_at

      const updated = await repository.upsertSession({
        user_id: userId,
        amelia_booking_id: session.amelia_booking_id,
        amelia_appointment_id: result.appointmentId ?? session.amelia_appointment_id,
        amelia_service_id: result.serviceId ?? session.amelia_service_id,
        amelia_provider_id: result.providerId ?? session.amelia_provider_id,
        tutor_name: result.tutorName ?? session.tutor_name,
        focus: result.focus ?? session.focus,
        starts_at: startsAt,
        ends_at: endsAt,
        timezone: timeZone,
        status: 'scheduled',
        zoom_meeting_id: result.zoomMeetingId ?? session.zoom_meeting_id,
        join_url: result.joinUrl ?? session.join_url,
      })
      return mapSessionRowToDto(updated)
    },

    async cancelBooking(userId: string, sessionId: string) {
      const { client } = requireAmelia()
      const session = await repository.getSessionForUser(userId, sessionId)
      if (!session) throw new Error('Session not found')
      if (session.amelia_booking_id) {
        await client.cancelBooking({ bookingId: session.amelia_booking_id })
      }
      const updated = await repository.updateSessionStatus(session.id, 'canceled')
      return mapSessionRowToDto(updated)
    },

    async listSessions(userId: string) {
      const rows = await repository.listSessionsForUser(userId)
      const now = new Date()
      const dtos = rows.map((row) => mapSessionRowToDto(row, now))
      const upcoming = dtos
        .filter((s) => s.status === 'scheduled' && new Date(s.startsAt).getTime() >= now.getTime())
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      const past = dtos.filter(
        (s) =>
          s.status === 'completed' ||
          s.status === 'no_show' ||
          (s.status === 'scheduled' && new Date(s.startsAt).getTime() < now.getTime()),
      )
      const packages = await repository.listActivePackages(userId)
      const activePackage = packages[0]
        ? {
            name: packages[0].name ?? 'Tutoring package',
            purchasedLabel: '',
            slots: [] as Array<'completed' | 'scheduled' | 'unscheduled'>,
            completed: Math.max(0, packages[0].slots_total - packages[0].slots_remaining),
            scheduled: upcoming.length,
            notScheduled: packages[0].slots_remaining,
          }
        : null

      return {
        hasActivePackage: Boolean(activePackage),
        nextSession: upcoming[0] ?? null,
        upcomingSessions: upcoming,
        pastSessions: past.map((s) => ({
          id: s.id,
          dateLabel: s.dateLabel,
          tutorName: s.tutorName,
          focus: s.focus,
          transcriptStatus: s.transcriptStatus,
          recordingStatus: s.recordingStatus,
        })),
        activePackage,
      }
    },

    async getTranscript(userId: string, sessionId: string) {
      const session = await repository.getSessionForUser(userId, sessionId)
      if (!session) throw new Error('Session not found')
      const artifacts = await repository.getArtifacts(sessionId)
      let recordingUrl: string | null = null
      if (artifacts?.recording_storage_path) {
        recordingUrl = await repository.createSignedMediaUrl(artifacts.recording_storage_path)
      }
      const title = session.focus?.trim() || 'Tutoring session'
      const metaLabel = mapSessionRowToDto(session).whenLabel
      return mapTranscriptJsonToViewer({
        sessionId: session.id,
        title,
        metaLabel,
        lines: artifacts?.transcript_json ?? [],
        recordingUrl,
        durationSeconds: artifacts?.duration_seconds ?? null,
      })
    },
  }
}

export type TutoringService = ReturnType<typeof createTutoringService>
