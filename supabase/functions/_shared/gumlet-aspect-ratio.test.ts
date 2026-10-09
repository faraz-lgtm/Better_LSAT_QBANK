import { assertEquals } from 'jsr:@std/assert@1'
import { resolveGumletCssAspectRatio, resolveGumletCssAspectRatios } from './gumlet-aspect-ratio.ts'

Deno.test('resolveGumletCssAspectRatio returns null for non-Gumlet URLs', async () => {
  assertEquals(await resolveGumletCssAspectRatio('https://cdn.example.com/v.mp4'), null)
})

Deno.test('resolveGumletCssAspectRatio maps oembed width/height to CSS ratio', async () => {
  const fetchFn: typeof fetch = async () =>
    new Response(JSON.stringify({ width: 800, height: 392 }), { status: 200 })
  assertEquals(
    await resolveGumletCssAspectRatio('https://gumlet.tv/watch/abc123/', fetchFn),
    '800 / 392',
  )
})

Deno.test('resolveGumletCssAspectRatios dedupes and skips failures', async () => {
  let calls = 0
  const fetchFn: typeof fetch = async (input) => {
    calls += 1
    const url = String(input)
    if (url.includes('fail-id')) return new Response('nope', { status: 404 })
    return new Response(JSON.stringify({ width: 1920, height: 1080 }), { status: 200 })
  }
  const map = await resolveGumletCssAspectRatios(
    [
      'https://gumlet.tv/watch/ok-id/',
      'https://gumlet.tv/watch/ok-id/',
      'https://gumlet.tv/watch/fail-id/',
    ],
    fetchFn,
  )
  assertEquals(calls, 2)
  assertEquals(map.get('https://gumlet.tv/watch/ok-id/'), '1920 / 1080')
  assertEquals(map.has('https://gumlet.tv/watch/fail-id/'), false)
})
