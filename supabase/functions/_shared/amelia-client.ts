import type { AmeliaEnv } from './amelia-env.ts'

export type AmeliaSlotDay = Record<string, Array<[number, number]>>

export type AmeliaSlotsResponse = {
  message?: string
  data?: {
    minimum?: string
    maximum?: string
    slots?: Record<string, AmeliaSlotDay>
  }
}

export type AmeliaCustomerInput = {
  email: string
  firstName: string
  lastName: string
  phone?: string | null
}

export type AmeliaCreateBookingInput = {
  bookingStart: string
  serviceId: number
  providerId: number
  locationId?: number | null
  customer: AmeliaCustomerInput
  timeZone?: string
  paymentGateway?: string
}

export type AmeliaBookingResult = {
  raw: unknown
  bookingId: number | null
  appointmentId: number | null
  customerId: number | null
  joinUrl: string | null
  zoomMeetingId: string | null
  providerId: number | null
  serviceId: number | null
  bookingStart: string | null
  bookingEnd: string | null
  tutorName: string | null
  focus: string | null
}

export type AmeliaClient = {
  getSlots: (input: {
    serviceId: number
    persons?: number
    providerIds?: number[]
    locationId?: number | null
    startDateTime?: string
    endDateTime?: string
    serviceDuration?: number
  }) => Promise<AmeliaSlotsResponse>
  createBooking: (input: AmeliaCreateBookingInput) => Promise<AmeliaBookingResult>
  rescheduleBooking: (input: {
    bookingId: number
    bookingStart: string
    timeZone?: string
    type?: string
  }) => Promise<AmeliaBookingResult>
  cancelBooking: (input: { bookingId: number; type?: string }) => Promise<void>
}

/**
 * Amelia Elite API uses:
 * `{site}/wp-admin/admin-ajax.php?action=wpamelia_api&call=/api/v1/slots&...`
 * `AMELIA_API_BASE_URL` may be the site origin or the full admin-ajax URL without `call=`.
 *
 * Amelia returns 404 when `call` is percent-encoded (`call=%2Fapi%2Fv1%2Fslots`).
 * Keep path slashes literal in the query string.
 */
export function buildAmeliaCallUrl(env: AmeliaEnv, pathAndQuery: string): string {
  const trimmed = pathAndQuery.trim()
  const pathOnly = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const [pathPart, queryPart] = pathOnly.split('?')
  const apiPath = pathPart.startsWith('/api/v1') ? pathPart : `/api/v1${pathPart}`

  let ajaxBase = env.apiBaseUrl
  if (!ajaxBase.includes('admin-ajax.php')) {
    ajaxBase = `${ajaxBase.replace(/\/$/, '')}/wp-admin/admin-ajax.php`
  }
  const url = new URL(ajaxBase)
  // Drop any pre-baked action/call from AMELIA_API_BASE_URL so we rebuild cleanly.
  url.search = ''

  const parts = [`action=wpamelia_api`, `call=${apiPath}`]
  if (queryPart) {
    const extra = new URLSearchParams(queryPart)
    for (const [key, value] of extra.entries()) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }
  return `${url.origin}${url.pathname}?${parts.join('&')}`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function zoomMeetingIdFromJoinUrl(joinUrl: string | null): string | null {
  if (!joinUrl) return null
  try {
    const match = new URL(joinUrl).pathname.match(/\/j\/(\d+)/)
    return match?.[1] ?? null
  } catch {
    return joinUrl.match(/\/j\/(\d+)/)?.[1] ?? null
  }
}

function dig(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj
  for (const key of path) {
    if (Array.isArray(cur)) {
      const idx = Number(key)
      cur = Number.isInteger(idx) ? cur[idx] : undefined
      continue
    }
    const rec = asRecord(cur)
    if (!rec) return undefined
    cur = rec[key]
  }
  return cur
}

/** Best-effort extract of Zoom/join fields from Amelia booking payloads (shape varies by version). */
export function mapAmeliaBookingPayload(raw: unknown): AmeliaBookingResult {
  const data = dig(raw, ['data']) ?? raw
  // `/bookings/reassign` returns existingAppointment / newAppointment instead of appointment.
  const appointment =
    dig(data, ['appointment']) ??
    dig(data, ['existingAppointment']) ??
    dig(data, ['newAppointment']) ??
    dig(data, ['booking', 'appointment']) ??
    dig(data, ['appointments', '0']) ??
    data
  const booking =
    dig(data, ['booking']) ??
    dig(appointment, ['bookings', '0']) ??
    dig(data, ['bookings', '0']) ??
    null

  const zoom =
    dig(appointment, ['zoomMeeting']) ??
    dig(appointment, ['zoom']) ??
    dig(booking, ['zoomMeeting']) ??
    dig(data, ['zoomMeeting'])

  const joinUrl =
    asString(dig(zoom, ['joinUrl'])) ??
    asString(dig(zoom, ['join_url'])) ??
    asString(dig(appointment, ['zoomJoinUrl'])) ??
    asString(dig(appointment, ['onlineMeetingUrl'])) ??
    asString(dig(data, ['joinUrl']))

  const zoomMeetingId =
    asString(dig(zoom, ['id'])) ??
    asString(dig(zoom, ['meetingId'])) ??
    asString(dig(appointment, ['zoomMeetingId'])) ??
    asString(dig(appointment, ['zoom_meeting_id'])) ??
    zoomMeetingIdFromJoinUrl(joinUrl)

  const provider =
    dig(appointment, ['provider']) ?? dig(data, ['provider']) ?? null
  const service = dig(appointment, ['service']) ?? dig(data, ['service']) ?? null

  const first = asString(dig(provider, ['firstName'])) ?? asString(dig(provider, ['first_name']))
  const last = asString(dig(provider, ['lastName'])) ?? asString(dig(provider, ['last_name']))
  const tutorName =
    [first, last].filter(Boolean).join(' ').trim() ||
    asString(dig(provider, ['fullName'])) ||
    asString(dig(provider, ['name']))

  return {
    raw,
    bookingId:
      asNumber(dig(booking, ['id'])) ??
      asNumber(dig(data, ['bookingId'])) ??
      asNumber(dig(data, ['id'])),
    appointmentId:
      asNumber(dig(appointment, ['id'])) ??
      asNumber(dig(booking, ['appointmentId'])) ??
      asNumber(dig(data, ['appointmentId'])),
    customerId:
      asNumber(dig(booking, ['customerId'])) ??
      asNumber(dig(booking, ['customer', 'id'])) ??
      asNumber(dig(data, ['customerId'])),
    joinUrl,
    zoomMeetingId,
    providerId:
      asNumber(dig(appointment, ['providerId'])) ??
      asNumber(dig(provider, ['id'])) ??
      asNumber(dig(data, ['providerId'])),
    serviceId:
      asNumber(dig(appointment, ['serviceId'])) ??
      asNumber(dig(service, ['id'])) ??
      asNumber(dig(data, ['serviceId'])),
    bookingStart:
      asString(dig(appointment, ['bookingStart'])) ??
      asString(dig(data, ['bookingStart'])),
    bookingEnd:
      asString(dig(appointment, ['bookingEnd'])) ??
      asString(dig(data, ['bookingEnd'])),
    tutorName,
    focus: asString(dig(service, ['name'])) ?? asString(dig(appointment, ['serviceName'])),
  }
}

export function createAmeliaClient(deps: {
  env: AmeliaEnv
  fetchFn?: typeof fetch
}): AmeliaClient {
  const fetchFn = deps.fetchFn ?? fetch
  const { env } = deps

  async function request(pathAndQuery: string, init: RequestInit = {}): Promise<unknown> {
    const url = buildAmeliaCallUrl(env, pathAndQuery)
    const res = await fetchFn(url, {
      ...init,
      headers: {
        Amelia: env.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    })
    const text = await res.text()
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = { raw: text }
    }
    if (!res.ok) {
      const message =
        asString(dig(body, ['message'])) ??
        asString(dig(body, ['error'])) ??
        `Amelia request failed (${res.status})`
      throw new Error(message)
    }
    return body
  }

  return {
    async getSlots(input) {
      const params = new URLSearchParams()
      params.set('serviceId', String(input.serviceId))
      params.set('persons', String(input.persons ?? 1))
      if (input.locationId) params.set('locationId', String(input.locationId))
      if (input.serviceDuration) params.set('serviceDuration', String(input.serviceDuration))
      if (input.startDateTime) params.set('startDateTime', input.startDateTime)
      if (input.endDateTime) params.set('endDateTime', input.endDateTime)
      if (input.providerIds?.length) {
        for (const id of input.providerIds) params.append('providerIds[]', String(id))
      }
      return (await request(`/slots?${params.toString()}`, { method: 'GET' })) as AmeliaSlotsResponse
    },

    async createBooking(input) {
      const locationId = input.locationId ?? undefined
      const body = {
        type: 'appointment',
        bookingStart: input.bookingStart,
        serviceId: input.serviceId,
        providerId: input.providerId,
        ...(locationId ? { locationId } : {}),
        locale: 'en_US',
        timeZone: input.timeZone ?? 'America/New_York',
        runInstantPostBookingActions: true,
        bookings: [
          {
            customer: {
              email: input.customer.email,
              firstName: input.customer.firstName,
              lastName: input.customer.lastName,
              phone: input.customer.phone ?? '',
            },
          },
        ],
        payment: {
          gateway: input.paymentGateway ?? 'onSite',
          currency: 'USD',
          data: {},
        },
      }
      const raw = await request('/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return mapAmeliaBookingPayload(raw)
    },

    async rescheduleBooking(input) {
      // Official Amelia Elite API: POST /bookings/reassign/{bookingId}
      const raw = await request(`/bookings/reassign/${input.bookingId}`, {
        method: 'POST',
        body: JSON.stringify({
          bookingStart: input.bookingStart,
          timeZone: input.timeZone ?? 'America/New_York',
          utcOffset: null,
        }),
      })
      return mapAmeliaBookingPayload(raw)
    },

    async cancelBooking(input) {
      // Official Amelia Elite API: POST /bookings/cancel/{bookingId}
      await request(`/bookings/cancel/${input.bookingId}`, {
        method: 'POST',
        body: JSON.stringify({ type: input.type ?? 'appointment' }),
      })
    },
  }
}
