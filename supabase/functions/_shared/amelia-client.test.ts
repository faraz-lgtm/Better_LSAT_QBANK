import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { buildAmeliaCallUrl, mapAmeliaBookingPayload } from './amelia-client.ts'

Deno.test('buildAmeliaCallUrl builds admin-ajax call query', () => {
  const url = buildAmeliaCallUrl(
    {
      apiBaseUrl: 'https://booking.example.com',
      apiKey: 'key',
      defaultServiceId: 3,
      defaultLocationId: null,
      defaultProviderId: 1,
      webhookSecret: null,
    },
    '/slots?serviceId=3&persons=1',
  )
  assertStringIncludes(url, 'admin-ajax.php')
  assertStringIncludes(url, 'action=wpamelia_api')
  // Amelia rejects percent-encoded slashes in `call`.
  assertStringIncludes(url, 'call=/api/v1/slots')
  assertEquals(url.includes('call=%2F'), false)
  assertStringIncludes(url, 'serviceId=3')
})

Deno.test('buildAmeliaCallUrl ignores pre-baked call on AMELIA_API_BASE_URL', () => {
  const url = buildAmeliaCallUrl(
    {
      apiBaseUrl:
        'https://old.betterlsat.com/wp-admin/admin-ajax.php?action=wpamelia_api&call=/api/v1',
      apiKey: 'key',
      defaultServiceId: 13,
      defaultLocationId: null,
      defaultProviderId: 134,
      webhookSecret: null,
    },
    '/slots?serviceId=13&persons=1',
  )
  assertEquals(url.startsWith('https://old.betterlsat.com/wp-admin/admin-ajax.php?'), true)
  assertStringIncludes(url, 'call=/api/v1/slots')
  assertEquals(url.includes('call=/api/v1&'), false)
})

Deno.test('mapAmeliaBookingPayload extracts join url and ids', () => {
  const mapped = mapAmeliaBookingPayload({
    data: {
      appointment: {
        id: 99,
        bookingStart: '2026-11-10 09:00',
        bookingEnd: '2026-11-10 10:00',
        providerId: 7,
        serviceId: 3,
        provider: { firstName: 'Maya', lastName: 'Chen' },
        service: { name: 'LR Tutoring' },
        zoomMeeting: { id: '123456789', joinUrl: 'https://zoom.us/j/123456789' },
        bookings: [{ id: 55, customerId: 12 }],
      },
    },
  })
  assertEquals(mapped.appointmentId, 99)
  assertEquals(mapped.bookingId, 55)
  assertEquals(mapped.customerId, 12)
  assertEquals(mapped.zoomMeetingId, '123456789')
  assertEquals(mapped.joinUrl, 'https://zoom.us/j/123456789')
  assertEquals(mapped.tutorName, 'Maya Chen')
  assertEquals(mapped.focus, 'LR Tutoring')
})

Deno.test('mapAmeliaBookingPayload extracts the Zoom meeting id from a join URL when Amelia omits it', () => {
  const mapped = mapAmeliaBookingPayload({
    data: {
      appointment: {
        id: 99,
        zoomJoinUrl: 'https://us06web.zoom.us/j/83300806775?pwd=secret',
        bookings: [{ id: 55, customerId: 12 }],
      },
    },
  })

  assertEquals(mapped.zoomMeetingId, '83300806775')
})

Deno.test('mapAmeliaBookingPayload reads /bookings/reassign response shape', () => {
  const mapped = mapAmeliaBookingPayload({
    message: 'Successfully updated appointment',
    data: {
      booking: { id: 812, customerId: 42, appointmentId: 796 },
      existingAppointment: {
        id: 796,
        bookingStart: '2026-11-20 11:15',
        bookingEnd: '2026-11-20 11:30',
        providerId: 134,
        serviceId: 13,
        provider: { firstName: 'Asaad', lastName: 'Siyal' },
        service: { name: '15-Minute Free Strategy Call' },
        zoomMeeting: { id: '111', joinUrl: 'https://zoom.us/j/111' },
      },
    },
  })
  assertEquals(mapped.bookingId, 812)
  assertEquals(mapped.appointmentId, 796)
  assertEquals(mapped.bookingStart, '2026-11-20 11:15')
  assertEquals(mapped.joinUrl, 'https://zoom.us/j/111')
  assertEquals(mapped.tutorName, 'Asaad Siyal')
})
