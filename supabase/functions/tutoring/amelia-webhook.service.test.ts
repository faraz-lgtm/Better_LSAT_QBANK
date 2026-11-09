import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { createAmeliaWebhookService } from './amelia-webhook.service.ts'
import type { TutoringRepository } from './tutoring.repository.ts'

Deno.test('Amelia Booking Completed payload creates a session for the booking customer', async () => {
  let linkedCustomer: { userId: string; customerId: number } | null = null
  let sessionInput: Record<string, unknown> | null = null
  const repository = {
    findUserIdByAmeliaCustomerId: () => Promise.resolve(null),
    findUserIdByEmail: (email: string) =>
      Promise.resolve(email === 'student@example.com' ? 'user-1' : null),
    setAmeliaCustomerId: (userId: string, customerId: number) => {
      linkedCustomer = { userId, customerId }
      return Promise.resolve()
    },
    upsertSession: (input: Record<string, unknown>) => {
      sessionInput = input
      return Promise.resolve({ id: 'session-1' })
    },
  } as unknown as TutoringRepository

  const service = createAmeliaWebhookService({ repository })
  const result = await service.handle('booking completed', {
    data: {
      appointment: {
        id: 81,
        bookingStart: '2026-12-08 10:00',
        bookingEnd: '2026-12-08 10:15',
        provider: { id: 134, firstName: 'Mustafa', lastName: 'Siddiqui' },
        service: { id: 13, name: '15-Minute Free Strategy Call' },
        zoomMeeting: { id: '85950926952', joinUrl: 'https://zoom.us/j/85950926952' },
        bookings: [
          {
            id: 99,
            customerId: 42,
            status: 'approved',
            customer: { email: 'student@example.com' },
          },
        ],
      },
    },
  })

  assertEquals(result, { ok: true, sessionId: 'session-1' })
  assertEquals(linkedCustomer, { userId: 'user-1', customerId: 42 })
  const savedSessionInput = sessionInput as unknown as Record<string, unknown>
  assertEquals(savedSessionInput.user_id, 'user-1')
  assertEquals(savedSessionInput.amelia_booking_id, 99)
  assertEquals(savedSessionInput.zoom_meeting_id, '85950926952')
})

Deno.test('Amelia booking status payload cancels an existing session', async () => {
  let canceledSessionId: string | null = null
  const repository = {
    findUserIdByAmeliaCustomerId: () => Promise.resolve('user-1'),
    setAmeliaCustomerId: () => Promise.resolve(),
    findSessionByAmeliaBookingId: () => Promise.resolve({ id: 'session-1' }),
    updateSessionStatus: (sessionId: string, status: string) => {
      assertEquals(status, 'canceled')
      canceledSessionId = sessionId
      return Promise.resolve({ id: sessionId })
    },
  } as unknown as TutoringRepository

  const service = createAmeliaWebhookService({ repository })
  const result = await service.handle('booking status changed', {
    appointment: {
      bookings: [{ id: 99, customerId: 42, status: 'canceled' }],
    },
  })

  assertEquals(result, { ok: true, sessionId: 'session-1' })
  assertEquals(canceledSessionId, 'session-1')
})
