import { assertEquals, assertThrows } from 'jsr:@std/assert@1'
import {
  isAllowedAppOrigin,
  isValidAppBaseUrl,
  resolveAppBaseUrlForCheckout,
  resolveAppBaseUrlFromEnv,
} from './app-base-url.ts'

Deno.test('isValidAppBaseUrl rejects supabase and placeholder hosts', () => {
  assertEquals(isValidAppBaseUrl('https://ymitqvbxrauychrkkhqp.supabase.co'), false)
  assertEquals(isValidAppBaseUrl('https://your-production-app-url.com'), false)
  assertEquals(isValidAppBaseUrl('https://better-lsat-qbank.vercel.app'), true)
  assertEquals(isValidAppBaseUrl('http://localhost:5173'), true)
})

Deno.test('isAllowedAppOrigin allows localhost and vercel deploys', () => {
  assertEquals(isAllowedAppOrigin('http://localhost:5173'), true)
  assertEquals(isAllowedAppOrigin('https://better-lsat-qbank.vercel.app'), true)
  assertEquals(isAllowedAppOrigin('https://better-lsat-qbank-git-main.vercel.app'), true)
  assertEquals(isAllowedAppOrigin('https://evil.example.com'), false)
})

Deno.test('resolveAppBaseUrlFromEnv prefers APP_BASE_URL', () => {
  const prev = Deno.env.get('APP_BASE_URL')
  Deno.env.set('APP_BASE_URL', 'https://better-lsat-qbank.vercel.app')
  try {
    assertEquals(resolveAppBaseUrlFromEnv(), 'https://better-lsat-qbank.vercel.app')
  } finally {
    if (prev == null) Deno.env.delete('APP_BASE_URL')
    else Deno.env.set('APP_BASE_URL', prev)
  }
})

Deno.test('resolveAppBaseUrlForCheckout uses Origin when env missing', () => {
  const prev = Deno.env.get('APP_BASE_URL')
  Deno.env.delete('APP_BASE_URL')
  try {
    const req = new Request('https://example.com', {
      headers: { Origin: 'https://better-lsat-qbank.vercel.app' },
    })
    assertEquals(
      resolveAppBaseUrlForCheckout(req),
      'https://better-lsat-qbank.vercel.app',
    )
  } finally {
    if (prev == null) Deno.env.delete('APP_BASE_URL')
    else Deno.env.set('APP_BASE_URL', prev)
  }
})

Deno.test('resolveAppBaseUrlForCheckout throws without env or origin', () => {
  const prev = Deno.env.get('APP_BASE_URL')
  Deno.env.delete('APP_BASE_URL')
  try {
    const req = new Request('https://example.com')
    assertThrows(
      () => resolveAppBaseUrlForCheckout(req),
      Error,
      'APP_BASE_URL is not configured',
    )
  } finally {
    if (prev == null) Deno.env.delete('APP_BASE_URL')
    else Deno.env.set('APP_BASE_URL', prev)
  }
})
