import { assertEquals, assertThrows } from 'jsr:@std/assert@1'
import {
  assertLawHubEmailAllowed,
  joinLawHubFullName,
  LawHubIdentityError,
  requireLawHubNameParts,
  splitFullName,
} from './lawhub-student-identity.ts'

Deno.test('splitFullName splits on whitespace', () => {
  assertEquals(splitFullName('Ada Lovelace'), { firstName: 'Ada', lastName: 'Lovelace' })
  assertEquals(splitFullName('Prince'), { firstName: 'Prince', lastName: '' })
  assertEquals(splitFullName(null), { firstName: '', lastName: '' })
})

Deno.test('assertLawHubEmailAllowed rejects plus addresses', () => {
  const err = assertThrows(
    () => assertLawHubEmailAllowed('stu+tag@example.com'),
    LawHubIdentityError,
  ) as LawHubIdentityError
  assertEquals(err.code, 'LAWHUB_EMAIL_PLUS_NOT_ALLOWED')
})

Deno.test('assertLawHubEmailAllowed normalizes email', () => {
  assertEquals(assertLawHubEmailAllowed('  Ada@Example.COM '), 'ada@example.com')
})

Deno.test('requireLawHubNameParts prefers explicit first and last', () => {
  assertEquals(
    requireLawHubNameParts({ firstName: 'Ada', lastName: 'Lovelace', fullName: 'Wrong' }),
    { firstName: 'Ada', lastName: 'Lovelace' },
  )
})

Deno.test('requireLawHubNameParts falls back to full name', () => {
  assertEquals(
    requireLawHubNameParts({ fullName: 'Ada Lovelace' }),
    { firstName: 'Ada', lastName: 'Lovelace' },
  )
})

Deno.test('requireLawHubNameParts rejects mononyms', () => {
  const err = assertThrows(
    () => requireLawHubNameParts({ fullName: 'Prince' }),
    LawHubIdentityError,
  ) as LawHubIdentityError
  assertEquals(err.code, 'LAWHUB_NAME_REQUIRED')
})

Deno.test('joinLawHubFullName trims parts', () => {
  assertEquals(joinLawHubFullName(' Ada ', ' Lovelace '), 'Ada Lovelace')
})
