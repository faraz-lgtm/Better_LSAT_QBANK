import { assertEquals } from 'jsr:@std/assert@1'
import { parseLawHubEnv } from './lawhub-env.ts'
import { shouldEnforcePrepCourseEntitlement } from './prep-course-entitlement.ts'

Deno.test('shouldEnforcePrepCourseEntitlement is false when bypass flag set', () => {
  const previousBypass = Deno.env.get('PREP_COURSE_BYPASS_ENTITLEMENT')
  const previousEnforce = Deno.env.get('PREP_COURSE_ENFORCE_ENTITLEMENT')
  Deno.env.set('PREP_COURSE_BYPASS_ENTITLEMENT', 'true')
  Deno.env.delete('PREP_COURSE_ENFORCE_ENTITLEMENT')
  try {
    assertEquals(shouldEnforcePrepCourseEntitlement(), false)
  } finally {
    if (previousBypass === undefined) Deno.env.delete('PREP_COURSE_BYPASS_ENTITLEMENT')
    else Deno.env.set('PREP_COURSE_BYPASS_ENTITLEMENT', previousBypass)
    if (previousEnforce === undefined) Deno.env.delete('PREP_COURSE_ENFORCE_ENTITLEMENT')
    else Deno.env.set('PREP_COURSE_ENFORCE_ENTITLEMENT', previousEnforce)
  }
})

Deno.test('shouldEnforcePrepCourseEntitlement is true when explicit enforce flag set', () => {
  const previousBypass = Deno.env.get('PREP_COURSE_BYPASS_ENTITLEMENT')
  const previousEnforce = Deno.env.get('PREP_COURSE_ENFORCE_ENTITLEMENT')
  Deno.env.delete('PREP_COURSE_BYPASS_ENTITLEMENT')
  Deno.env.set('PREP_COURSE_ENFORCE_ENTITLEMENT', 'true')
  try {
    assertEquals(shouldEnforcePrepCourseEntitlement(), true)
  } finally {
    if (previousBypass === undefined) Deno.env.delete('PREP_COURSE_BYPASS_ENTITLEMENT')
    else Deno.env.set('PREP_COURSE_BYPASS_ENTITLEMENT', previousBypass)
    if (previousEnforce === undefined) Deno.env.delete('PREP_COURSE_ENFORCE_ENTITLEMENT')
    else Deno.env.set('PREP_COURSE_ENFORCE_ENTITLEMENT', previousEnforce)
  }
})

Deno.test('shouldEnforcePrepCourseEntitlement is true in production LawHub env', () => {
  const keys = [
    'PREP_COURSE_BYPASS_ENTITLEMENT',
    'PREP_COURSE_ENFORCE_ENTITLEMENT',
    'LAWHUB_SANDBOX',
    'LSAC_VENDOR_ID',
    'LSAC_CLIENT_ID',
    'LSAC_CLIENT_SECRET',
  ] as const
  const previous: Record<string, string | undefined> = {}
  for (const key of keys) previous[key] = Deno.env.get(key)

  Deno.env.delete('PREP_COURSE_BYPASS_ENTITLEMENT')
  Deno.env.delete('PREP_COURSE_ENFORCE_ENTITLEMENT')
  Deno.env.set('LAWHUB_SANDBOX', 'false')
  Deno.env.set('LSAC_VENDOR_ID', 'vendor')
  Deno.env.set('LSAC_CLIENT_ID', 'client')
  Deno.env.set('LSAC_CLIENT_SECRET', 'secret')

  try {
    assertEquals(parseLawHubEnv(Deno.env.toObject())?.isSandbox, false)
    assertEquals(shouldEnforcePrepCourseEntitlement(), true)
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) Deno.env.delete(key)
      else Deno.env.set(key, previous[key]!)
    }
  }
})
