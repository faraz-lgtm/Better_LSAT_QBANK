import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { pickFreeStrategyCallSession } from './tutoring.service.ts'

Deno.test('pickFreeStrategyCallSession matches focus or default service id', () => {
  assertEquals(
    pickFreeStrategyCallSession(
      [
        {
          focus: '15-Minute Free Strategy Call',
          amelia_service_id: 99,
          status: 'scheduled',
          starts_at: '2026-12-01T12:00:00.000Z',
        },
      ],
      13,
      new Date('2026-11-15T00:00:00.000Z'),
    )?.focus,
    '15-Minute Free Strategy Call',
  )
  assertEquals(
    pickFreeStrategyCallSession(
      [
        {
          focus: null,
          amelia_service_id: 13,
          status: 'scheduled',
          starts_at: '2026-12-01T12:00:00.000Z',
        },
      ],
      13,
      new Date('2026-11-15T00:00:00.000Z'),
    )?.amelia_service_id,
    13,
  )
  assertEquals(
    pickFreeStrategyCallSession(
      [
        {
          focus: 'Logical Reasoning',
          amelia_service_id: 99,
          status: 'scheduled',
          starts_at: '2026-12-01T12:00:00.000Z',
        },
      ],
      13,
      new Date('2026-11-15T00:00:00.000Z'),
    ),
    null,
  )
})

Deno.test('pickFreeStrategyCallSession ignores canceled and prefers upcoming', () => {
  assertEquals(
    pickFreeStrategyCallSession(
      [
        {
          focus: '15-Minute Free Strategy Call',
          amelia_service_id: 13,
          status: 'canceled',
          starts_at: '2026-12-01T12:00:00.000Z',
        },
      ],
      13,
      new Date('2026-11-15T00:00:00.000Z'),
    ),
    null,
  )

  const picked = pickFreeStrategyCallSession(
    [
      {
        focus: '15-Minute Free Strategy Call',
        amelia_service_id: 13,
        status: 'completed',
        starts_at: '2026-10-01T12:00:00.000Z',
      },
      {
        focus: '15-Minute Free Strategy Call',
        amelia_service_id: 13,
        status: 'scheduled',
        starts_at: '2026-12-01T12:00:00.000Z',
      },
    ],
    13,
    new Date('2026-11-15T00:00:00.000Z'),
  )
  assertEquals(picked?.starts_at, '2026-12-01T12:00:00.000Z')
})
