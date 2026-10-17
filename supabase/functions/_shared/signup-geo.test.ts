import { assertEquals } from 'jsr:@std/assert@1'
import {
  formatSignupLocation,
  normalizeCountryCode,
  readClientIp,
  readSignupLocationFromAttribution,
  resolveSignupGeo,
} from './signup-geo.ts'

Deno.test('normalizeCountryCode uppercases and drops XX/T1', () => {
  assertEquals(normalizeCountryCode('us'), 'US')
  assertEquals(normalizeCountryCode(' XX '), null)
  assertEquals(normalizeCountryCode('T1'), null)
  assertEquals(normalizeCountryCode(null), null)
  assertEquals(normalizeCountryCode(''), null)
})

Deno.test('readClientIp prefers cf-connecting-ip over x-forwarded-for', () => {
  const headers = new Headers({
    'cf-connecting-ip': '1.2.3.4',
    'x-forwarded-for': '9.9.9.9, 8.8.8.8',
  })
  assertEquals(readClientIp(headers), '1.2.3.4')
})

Deno.test('readClientIp uses first x-forwarded-for hop', () => {
  const headers = new Headers({ 'x-forwarded-for': ' 9.9.9.9 , 8.8.8.8' })
  assertEquals(readClientIp(headers), '9.9.9.9')
})

Deno.test('resolveSignupGeo prefers full Vercel headers', async () => {
  let fetchCalled = false
  const headers = new Headers({
    'x-vercel-ip-country': 'ca',
    'x-vercel-ip-country-region': 'ON',
    'x-vercel-ip-city': 'Toronto',
    'cf-ipcountry': 'US',
    'cf-connecting-ip': '1.2.3.4',
  })
  const geo = await resolveSignupGeo({
    headers,
    fetchImpl: async () => {
      fetchCalled = true
      return new Response('{}')
    },
  })
  assertEquals(geo, {
    country: 'CA',
    region: 'ON',
    city: 'Toronto',
    source: 'vercel',
  })
  assertEquals(fetchCalled, false)
})

Deno.test('resolveSignupGeo uses Cloudflare country when Vercel absent', async () => {
  let fetchCalled = false
  const headers = new Headers({ 'cf-ipcountry': 'gb' })
  const geo = await resolveSignupGeo({
    headers,
    fetchImpl: async () => {
      fetchCalled = true
      return new Response('{}')
    },
  })
  assertEquals(geo, {
    country: 'GB',
    region: null,
    city: null,
    source: 'cloudflare',
  })
  assertEquals(fetchCalled, false)
})

Deno.test('resolveSignupGeo falls back to IP lookup when CF country is XX', async () => {
  let fetchedUrl = ''
  const headers = new Headers({
    'cf-ipcountry': 'XX',
    'x-forwarded-for': '203.0.113.10',
  })
  const geo = await resolveSignupGeo({
    headers,
    fetchImpl: async (input) => {
      fetchedUrl = String(input)
      return Response.json({
        success: true,
        country_code: 'US',
        regionCode: 'NY',
        city: 'New York',
      })
    },
  })
  assertEquals(fetchedUrl, 'https://ipwho.is/203.0.113.10')
  assertEquals(geo, {
    country: 'US',
    region: 'NY',
    city: 'New York',
    source: 'ip_lookup',
  })
})

Deno.test('resolveSignupGeo IP lookup failure returns none', async () => {
  const headers = new Headers({ 'cf-connecting-ip': '203.0.113.10' })
  const geo = await resolveSignupGeo({
    headers,
    fetchImpl: async () => {
      throw new Error('network')
    },
  })
  assertEquals(geo, { country: null, region: null, city: null, source: 'none' })
})

Deno.test('resolveSignupGeo IP lookup timeout returns none', async () => {
  const headers = new Headers({ 'cf-connecting-ip': '203.0.113.10' })
  const geo = await resolveSignupGeo({
    headers,
    timeoutMs: 20,
    fetchImpl: (_input, init) =>
      new Promise((_resolve, reject) => {
        const signal = (init as { signal?: AbortSignal } | undefined)?.signal
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      }),
  })
  assertEquals(geo, { country: null, region: null, city: null, source: 'none' })
})

Deno.test('resolveSignupGeo with no headers and no IP returns none', async () => {
  const geo = await resolveSignupGeo({
    headers: new Headers(),
    fetchImpl: async () => {
      throw new Error('should not fetch')
    },
  })
  assertEquals(geo, { country: null, region: null, city: null, source: 'none' })
})

Deno.test('formatSignupLocation joins available parts', () => {
  assertEquals(
    formatSignupLocation({ city: 'Toronto', region: 'ON', country: 'ca' }),
    'Toronto, ON, CA',
  )
  assertEquals(formatSignupLocation({ country: 'US' }), 'US')
  assertEquals(formatSignupLocation({ city: 'Paris', country: 'FR' }), 'Paris, FR')
  assertEquals(formatSignupLocation({ country: 'XX' }), 'unknown')
  assertEquals(formatSignupLocation(null), 'unknown')
  assertEquals(formatSignupLocation({}), 'unknown')
})

Deno.test('readSignupLocationFromAttribution reads nested object', () => {
  assertEquals(
    readSignupLocationFromAttribution({
      signup_location: { country: 'ca', region: 'ON', city: 'Toronto' },
    }),
    { country: 'CA', region: 'ON', city: 'Toronto', source: 'none' },
  )
  assertEquals(readSignupLocationFromAttribution({ country: 'US' }), null)
  assertEquals(readSignupLocationFromAttribution(null), null)
})
