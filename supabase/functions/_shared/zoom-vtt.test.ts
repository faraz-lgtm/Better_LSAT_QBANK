import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { parseZoomVttTranscript } from './zoom-vtt.ts'

Deno.test('parseZoomVttTranscript extracts timed speaker lines', () => {
  const vtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Maya Chen: Let's start with Necessary Assumption.

2
00:00:05.500 --> 00:00:08.000
You: I keep picking strengtheners.
`
  const lines = parseZoomVttTranscript(vtt)
  assertEquals(lines.length, 2)
  assertEquals(lines[0]?.name, 'Maya Chen')
  assertEquals(lines[0]?.time, '00:01')
  assertEquals(lines[0]?.text, "Let's start with Necessary Assumption.")
  assertEquals(lines[1]?.name, 'You')
  assertEquals(lines[1]?.initials, 'YO')
})

Deno.test('parseZoomVttTranscript handles lines without speaker labels', () => {
  const vtt = `WEBVTT

00:00:10.000 --> 00:00:12.000
Plain cue without speaker
`
  const lines = parseZoomVttTranscript(vtt)
  assertEquals(lines.length, 1)
  assertEquals(lines[0]?.name, 'Speaker')
  assertEquals(lines[0]?.text, 'Plain cue without speaker')
  assertEquals(lines[0]?.time, '00:10')
})
