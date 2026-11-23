import { mapAmeliaBookingPayload } from '../_shared/amelia-client.ts'
import { ameliaUtcDateTimeToIso } from './tutoring.mapper.ts'
import type { TutoringRepository, TutoringSessionStatus } from './tutoring.repository.ts'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return null
}

function dig(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj
  for (const key of path) {
    if (Array.isArray(cur)) {
      const index = Number(key)
      cur = Number.isInteger(index) ? cur[index] : undefined
      continue
    }
    const rec = asRecord(cur)
    if (!rec) return undefined
    cur = rec[key]
  }
  return cur
}

function firstString(obj: unknown, paths: string[][]): string | null {
  for (const path of paths) {
    const value = asString(dig(obj, path))
    if (value) return value
  }
  return null
}

function parseInfoTimeZone(info: unknown): string | null {
  if (typeof info === 'string' && info.trim()) {
    try {
      const parsed = JSON.parse(info) as unknown
      return asString(dig(parsed, ['timeZone'])) ?? asString(dig(parsed, ['timezone']))
    } catch {
      return null
    }
  }
  const rec = asRecord(info)
  if (!rec) return null
  return asString(rec.timeZone) ?? asString(rec.timezone)
}

/**
 * Customer's booking timezone from Amelia webhook payloads.
 * Amelia stores it in `bookings[].info` JSON: `{"timeZone":"Asia/Karachi",...}`.
 */
export function resolveAmeliaBookingTimeZone(payload: unknown): string {
  const fromInfo =
    parseInfoTimeZone(dig(payload, ['data', 'appointment', 'bookings', '0', 'info'])) ??
    parseInfoTimeZone(dig(payload, ['appointment', 'bookings', '0', 'info'])) ??
    parseInfoTimeZone(dig(payload, ['data', 'bookings', '0', 'info'])) ??
    parseInfoTimeZone(dig(payload, ['bookings', '0', 'info'])) ??
    parseInfoTimeZone(dig(payload, ['data', 'booking', 'info'])) ??
    parseInfoTimeZone(dig(payload, ['booking', 'info']))

  if (fromInfo) return fromInfo

  const direct = firstString(payload, [
    ['data', 'appointment', 'bookings', '0', 'customer', 'timeZone'],
    ['appointment', 'bookings', '0', 'customer', 'timeZone'],
    ['data', 'bookings', '0', 'customer', 'timeZone'],
    ['bookings', '0', 'customer', 'timeZone'],
    ['data', 'booking', 'customer', 'timeZone'],
    ['booking', 'customer', 'timeZone'],
    ['data', 'customer', 'timeZone'],
    ['customer', 'timeZone'],
    ['data', 'timeZone'],
    ['timeZone'],
    ['data', 'appointment', 'timeZone'],
    ['appointment', 'timeZone'],
  ])
  if (direct) return direct

  return 'America/New_York'
}

export function createAmeliaWebhookService(deps: { repository: TutoringRepository }) {
  const { repository } = deps

  async function resolveUserId(payload: unknown): Promise<string | null> {
    const mapped = mapAmeliaBookingPayload(payload)
    if (mapped.customerId) {
      const byCustomer = await repository.findUserIdByAmeliaCustomerId(mapped.customerId)
      if (byCustomer) return byCustomer
    }
    const email = firstString(payload, [
      ['booking', 'customer', 'email'],
      ['customer', 'email'],
      ['data', 'customer', 'email'],
      ['email'],
      ['data', 'booking', 'customer', 'email'],
      ['appointment', 'bookings', '0', 'customer', 'email'],
      ['data', 'appointment', 'bookings', '0', 'customer', 'email'],
      ['bookings', '0', 'customer', 'email'],
      ['data', 'bookings', '0', 'customer', 'email'],
    ])
    if (email) return repository.findUserIdByEmail(email)
    return null
  }

  return {
    async handle(action: string, payload: unknown): Promise<{ ok: true; sessionId?: string }> {
      const normalized = action.trim().toLowerCase()
      const mapped = mapAmeliaBookingPayload(payload)
      const userId = await resolveUserId(payload)

      if (!userId) {
        console.info('amelia-webhook: no matching BetterLSAT user', {
          action: normalized,
          customerId: mapped.customerId,
        })
        return { ok: true }
      }

      if (mapped.customerId) {
        await repository.setAmeliaCustomerId(userId, mapped.customerId)
      }

      const statusRaw = firstString(payload, [
        ['status'],
        ['data', 'status'],
        ['appointment', 'status'],
        ['data', 'appointment', 'status'],
        ['booking', 'status'],
        ['data', 'booking', 'status'],
        ['appointment', 'bookings', '0', 'status'],
        ['data', 'appointment', 'bookings', '0', 'status'],
        ['bookings', '0', 'status'],
        ['data', 'bookings', '0', 'status'],
      ])
      const statusHint = statusRaw?.toLowerCase()
      if (
        normalized.includes('cancel') ||
        statusHint?.includes('cancel')
      ) {
        if (mapped.bookingId) {
          const existing = await repository.findSessionByAmeliaBookingId(mapped.bookingId)
          if (existing) {
            await repository.updateSessionStatus(existing.id, 'canceled')
            return { ok: true, sessionId: existing.id }
          }
        }
        return { ok: true }
      }

      const timeZone = resolveAmeliaBookingTimeZone(payload)
      const bookingStart =
        mapped.bookingStart ??
        asString(dig(payload, ['bookingStart'])) ??
        asString(dig(payload, ['appointment', 'bookingStart']))
      if (!bookingStart) {
        console.info('amelia-webhook: missing bookingStart', { action: normalized })
        return { ok: true }
      }

      let status: TutoringSessionStatus = 'scheduled'
      if (statusRaw) {
        const s = statusRaw.toLowerCase()
        if (s.includes('cancel')) status = 'canceled'
        else if (s.includes('reject') || s.includes('no-show') || s.includes('no_show')) status = 'no_show'
        else if (s.includes('complet')) status = 'completed'
      }

      const session = await repository.upsertSession({
        user_id: userId,
        amelia_booking_id: mapped.bookingId ?? asNumber(dig(payload, ['booking', 'id'])),
        amelia_appointment_id: mapped.appointmentId,
        amelia_service_id: mapped.serviceId,
        amelia_provider_id: mapped.providerId,
        tutor_name: mapped.tutorName,
        focus: mapped.focus,
        starts_at: ameliaUtcDateTimeToIso(bookingStart),
        ends_at: mapped.bookingEnd ? ameliaUtcDateTimeToIso(mapped.bookingEnd) : null,
        timezone: timeZone,
        status,
        zoom_meeting_id: mapped.zoomMeetingId,
        join_url: mapped.joinUrl,
      })

      return { ok: true, sessionId: session.id }
    },
  }
}
