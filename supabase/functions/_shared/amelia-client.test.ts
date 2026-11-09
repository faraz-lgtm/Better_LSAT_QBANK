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
  assertStringIncludes(url, 'call=%2Fapi%2Fv1%2Fslots')
  assertStringIncludes(url, 'serviceId=3')
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
