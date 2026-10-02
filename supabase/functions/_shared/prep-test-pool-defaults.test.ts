import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

import {
  defaultPrepTestPoolMembership,
  membershipEquals,
  resolvePrepTestPoolMembership,
} from './prep-test-pool-defaults.ts'

Deno.test('defaultPrepTestPoolMembership: drill-only band PT100–122', () => {
  assertEquals(defaultPrepTestPoolMembership(100), {
    inDrills: true,
    inSections: false,
    inTests: false,
  })
  assertEquals(defaultPrepTestPoolMembership(122), {
    inDrills: true,
    inSections: false,
    inTests: false,
  })
})

Deno.test('defaultPrepTestPoolMembership: middle band PT123–152 all on', () => {
  assertEquals(defaultPrepTestPoolMembership(123), {
    inDrills: true,
    inSections: true,
    inTests: true,
  })
  assertEquals(defaultPrepTestPoolMembership(152), {
    inDrills: true,
    inSections: true,
    inTests: true,
  })
})

Deno.test('defaultPrepTestPoolMembership: recent band PT153+ tests only', () => {
  assertEquals(defaultPrepTestPoolMembership(153), {
    inDrills: false,
    inSections: false,
    inTests: true,
  })
  assertEquals(defaultPrepTestPoolMembership(159), {
    inDrills: false,
    inSections: false,
    inTests: true,
  })
})

Deno.test('defaultPrepTestPoolMembership: invalid numbers all off', () => {
  assertEquals(defaultPrepTestPoolMembership(99), {
    inDrills: false,
    inSections: false,
    inTests: false,
  })
  assertEquals(defaultPrepTestPoolMembership(NaN), {
    inDrills: false,
    inSections: false,
    inTests: false,
  })
})

Deno.test('resolvePrepTestPoolMembership prefers override when present', () => {
  const override = { inDrills: false, inSections: true, inTests: false }
  assertEquals(resolvePrepTestPoolMembership(100, override), override)
  assertEquals(resolvePrepTestPoolMembership(100, null), defaultPrepTestPoolMembership(100))
})

Deno.test('membershipEquals compares flags', () => {
  assertEquals(
    membershipEquals(
      { inDrills: true, inSections: false, inTests: false },
      { inDrills: true, inSections: false, inTests: false },
    ),
    true,
  )
  assertEquals(
    membershipEquals(
      { inDrills: true, inSections: false, inTests: false },
      { inDrills: true, inSections: true, inTests: false },
    ),
    false,
  )
})
