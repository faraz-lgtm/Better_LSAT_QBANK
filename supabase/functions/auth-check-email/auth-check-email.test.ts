import { assertEquals } from 'jsr:@std/assert@1'

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  if (!email || !email.includes('@') || email.length > 320) return null
  return email
}

Deno.test('normalizeEmail accepts and lowercases valid emails', () => {
  assertEquals(normalizeEmail('  User@Example.COM '), 'user@example.com')
})

Deno.test('normalizeEmail rejects invalid values', () => {
  assertEquals(normalizeEmail(''), null)
  assertEquals(normalizeEmail('not-an-email'), null)
  assertEquals(normalizeEmail(null), null)
  assertEquals(normalizeEmail(123), null)
})
