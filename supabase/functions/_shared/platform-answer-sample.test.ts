import { assertEquals } from 'jsr:@std/assert@1'
import {
  MIN_PLATFORM_ANSWER_SAMPLE,
  hasEnoughPlatformAnswerSample,
  platformAnswerSampleSize,
} from './platform-answer-sample.ts'

Deno.test('MIN_PLATFORM_ANSWER_SAMPLE is 5', () => {
  assertEquals(MIN_PLATFORM_ANSWER_SAMPLE, 5)
})

Deno.test('hasEnoughPlatformAnswerSample is false below 5', () => {
  assertEquals(hasEnoughPlatformAnswerSample(0), false)
  assertEquals(hasEnoughPlatformAnswerSample(4), false)
})

Deno.test('hasEnoughPlatformAnswerSample is true at 5', () => {
  assertEquals(hasEnoughPlatformAnswerSample(5), true)
  assertEquals(hasEnoughPlatformAnswerSample(12), true)
})

Deno.test('platformAnswerSampleSize sums row counts', () => {
  assertEquals(platformAnswerSampleSize([]), 0)
  assertEquals(
    platformAnswerSampleSize([
      { count: 3 },
      { count: 1 },
    ]),
    4,
  )
})
