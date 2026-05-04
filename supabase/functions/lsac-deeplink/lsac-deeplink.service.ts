import type { ProfileRow } from '../users/users.repository.ts'

export type LsacDeeplinkServiceDeps = {
  getLawHubBaseUrl: () => string
  getVendorId: () => string
  getProfileById: (userId: string) => Promise<ProfileRow | null>
}

export function createLsacDeeplinkService(deps: LsacDeeplinkServiceDeps) {
  function validateId(value: string, field: string): string {
    const trimmed = value.trim()
    if (!trimmed) throw new Error(`${field} is required`)
    return trimmed
  }

  return {
    async createUrl(input: {
      userId: string
      testId: string
      sectionId?: string
      itemId?: string
    }): Promise<string> {
      const profile = await deps.getProfileById(input.userId)
      const coachingId = profile?.student_coaching_id?.trim()
      if (!coachingId) {
        throw new Error('No student_coaching_id on profile')
      }

      const baseUrl = deps.getLawHubBaseUrl()
      const vendorId = validateId(deps.getVendorId(), 'LSAC_VENDOR_ID')
      const testId = validateId(input.testId, 'testId')

      const url = new URL('/prep/deeplink', baseUrl)
      url.searchParams.set('vendorId', vendorId)
      url.searchParams.set('studentCoachingId', coachingId)
      url.searchParams.set('testId', testId)

      if (input.sectionId) {
        url.searchParams.set('sectionId', validateId(input.sectionId, 'sectionId'))
      }
      if (input.itemId) {
        url.searchParams.set('itemId', validateId(input.itemId, 'itemId'))
      }
      return url.toString()
    },
  }
}

export type LsacDeeplinkService = ReturnType<typeof createLsacDeeplinkService>
