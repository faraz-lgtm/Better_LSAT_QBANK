import { parseLawHubEnv } from './lawhub-env.ts'

/** Whether prep-course learner endpoints enforce LSAC linkage + eligibility. */
export function shouldEnforcePrepCourseEntitlement(): boolean {
  if (Deno.env.get('PREP_COURSE_BYPASS_ENTITLEMENT') === 'true') return false
  if (Deno.env.get('PREP_COURSE_ENFORCE_ENTITLEMENT') === 'true') return true
  const env = parseLawHubEnv(Deno.env.toObject())
  if (env && !env.isSandbox) return true
  return false
}
