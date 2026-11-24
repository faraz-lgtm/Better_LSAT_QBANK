import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  ameliaLocalDateTimeToIso,
  ameliaUtcDateTimeToIso,
  buildTranscriptSegments,
  findTranscriptTimeForPhrase,
  mapFreeStrategyCallDto,
  mapTranscriptJsonToViewer,
} from './tutoring.mapper.ts'
import type { TutoringSessionRow } from './tutoring.repository.ts'

Deno.test('ameliaUtcDateTimeToIso treats Amelia bookingStart as UTC', () => {
  // Dec 8 1:00 AM Asia/Karachi = Dec 7 20:00 UTC — Amelia sends the UTC wall time.
  assertEquals(ameliaUtcDateTimeToIso('2026-12-07 20:00'), '2026-12-07T20:00:00.000Z')
  assertEquals(ameliaUtcDateTimeToIso('2026-12-07T20:00:00Z'), '2026-12-07T20:00:00.000Z')
})

Deno.test('ameliaLocalDateTimeToIso interprets client wall time in timezone', () => {
  assertEquals(
    ameliaLocalDateTimeToIso('2026-12-08 01:00', 'Asia/Karachi'),
    '2026-12-07T20:00:00.000Z',
  )
})

Deno.test('mapFreeStrategyCallDto shows Karachi wall time for UTC instant', () => {
  const row = {
    id: 's1',
    focus: '15-Minute Free Strategy Call',
    starts_at: '2026-12-07T20:00:00.000Z',
    ends_at: '2026-12-07T20:15:00.000Z',
    timezone: 'Asia/Karachi',
    status: 'scheduled',
    tutor_name: 'Maya Chen',
    join_url: null,
    transcript_status: 'none',
    recording_status: 'none',
  } as TutoringSessionRow
  const dto = mapFreeStrategyCallDto(row, 'a@b.com', new Date('2026-11-23T00:00:00.000Z'))
  assertEquals(dto.dateLabel.includes('Dec 8'), true)
  assertEquals(dto.timeLabel.startsWith('1:00 AM'), true)
})

Deno.test('findTranscriptTimeForPhrase matches keyword-rich lines', () => {
  const lines = [
    { time: '00:10', text: 'Hello everyone' },
    { time: '02:15', text: 'Lets cover negation test carefully' },
    { time: '05:00', text: 'Wrap up homework drills' },
  ]
  assertEquals(findTranscriptTimeForPhrase(lines, 'Negation test'), '02:15')
})

Deno.test('buildTranscriptSegments adds topic tags and Actions needed from Zoom summary', () => {
  const lines = [
    { time: '00:20', text: 'Talking about rescheduling appointments on the website' },
    { time: '03:40', text: 'Please review the notification settings afterward' },
  ]
  const segments = buildTranscriptSegments(lines, {
    summary_details: [{ label: 'Meeting Rescheduling Discussion' }],
    next_steps: ['Sarah: Review the webhook/notification settings'],
  })
  assertEquals(segments.length, 2)
  assertEquals(segments[0]?.kind, 'topic')
  assertEquals(segments[0]?.label, 'Meeting Rescheduling Discussion')
  assertEquals(segments[1]?.label, 'Actions needed')
  assertEquals(segments[1]?.kind, 'action')
  assertEquals(segments[1]?.time, '03:40')
})

Deno.test('mapTranscriptJsonToViewer falls back to Session when summary is empty', () => {
  const mapped = mapTranscriptJsonToViewer({
    sessionId: 's1',
    title: 'Strategy Call',
    metaLabel: 'Today',
    lines: [{ id: 'line-1', speaker: 'tutor', name: 'A', initials: 'A', time: '00:41', text: 'Hi' }],
    takeaways: [],
    summaryJson: null,
    durationSeconds: 40,
  })
  assertEquals(mapped.segments, [{ id: 'seg-1', time: '00:41', label: 'Session', kind: 'topic' }])
  assertEquals(mapped.totalTime, '00:40')
})
