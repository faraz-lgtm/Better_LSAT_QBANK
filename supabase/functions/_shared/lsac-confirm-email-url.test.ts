import { assertEquals, assertThrows } from 'jsr:@std/assert@1'
import {
  buildLsacConfirmEmailUrl,
  DEFAULT_LSAC_CONFIRM_EMAIL_BASE_URL,
  resolveLsacConfirmEmailBaseUrl,
} from './lsac-confirm-email-url.ts'

Deno.test('buildLsacConfirmEmailUrl uses default base and exact query casing', () => {
  const url = buildLsacConfirmEmailUrl({
    studentCoachingId: 'c6911ae0-a062-4637-a24b-4403b2d0416f',
    vendorId: 'BET2026',
  })
  assertEquals(
    url,
    `${DEFAULT_LSAC_CONFIRM_EMAIL_BASE_URL}?StudentCoachingId=c6911ae0-a062-4637-a24b-4403b2d0416f&VendorId=BET2026`,
  )
})

Deno.test('buildLsacConfirmEmailUrl trims ids and accepts base override', () => {
  const url = buildLsacConfirmEmailUrl({
    studentCoachingId: '  coach-1  ',
    vendorId: '  V1  ',
    baseUrl: 'https://example.test/confirm_email',
  })
  assertEquals(
    url,
    'https://example.test/confirm_email?StudentCoachingId=coach-1&VendorId=V1',
  )
})

Deno.test('buildLsacConfirmEmailUrl requires studentCoachingId', () => {
  assertThrows(
    () => buildLsacConfirmEmailUrl({ studentCoachingId: '  ', vendorId: 'V1' }),
    Error,
    'studentCoachingId is required',
  )
})

Deno.test('buildLsacConfirmEmailUrl requires vendorId', () => {
  assertThrows(
    () => buildLsacConfirmEmailUrl({ studentCoachingId: 'c1', vendorId: '' }),
    Error,
    'vendorId is required',
  )
})

Deno.test('resolveLsacConfirmEmailBaseUrl prefers env override', () => {
  assertEquals(
    resolveLsacConfirmEmailBaseUrl({
      LSAC_CONFIRM_EMAIL_BASE_URL: 'https://custom.example/confirm_email',
    }),
    'https://custom.example/confirm_email',
  )
  assertEquals(resolveLsacConfirmEmailBaseUrl({}), DEFAULT_LSAC_CONFIRM_EMAIL_BASE_URL)
})
