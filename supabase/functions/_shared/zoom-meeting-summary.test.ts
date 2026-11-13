import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { normalizeZoomMeetingSummary } from './zoom-meeting-summary.ts'

Deno.test('normalizeZoomMeetingSummary maps legacy next_steps and overview', () => {
  const result = normalizeZoomMeetingSummary({
    summary_overview: 'Focused on assumption flaws.',
    summary_details: [{ label: 'Practice negation test' }, { label: 'Review PT 80 LR' }],
    next_steps: ['Complete drill set A', 'Email tutor with questions'],
  })

  assertEquals(result.takeaways, [
    'Focused on assumption flaws.',
    'Practice negation test',
    'Review PT 80 LR',
  ])
  assertEquals(result.nextSteps, ['Complete drill set A', 'Email tutor with questions'])
})

Deno.test('normalizeZoomMeetingSummary reads webhook nested object', () => {
  const result = normalizeZoomMeetingSummary({
    payload: {
      object: {
        next_steps: ['Do homework'],
        summary_overview: 'Good session',
      },
    },
  })

  assertEquals(result.nextSteps, ['Do homework'])
  assertEquals(result.takeaways, ['Good session'])
})

Deno.test('normalizeZoomMeetingSummary falls back to markdown summary_content', () => {
  const result = normalizeZoomMeetingSummary({
    summary_content: `# Overview
Covered conditional reasoning.

## Next steps
- Finish LR homework
- Book next session
`,
  })

  assertEquals(result.takeaways.includes('Covered conditional reasoning.'), true)
  assertEquals(result.nextSteps, ['Finish LR homework', 'Book next session'])
})
