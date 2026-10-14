/** Default LSAC coach-activation / confirm-email endpoint (vendor invite accept). */
export const DEFAULT_LSAC_CONFIRM_EMAIL_BASE_URL =
  'https://lawpath.azurewebsites.net/confirm_email'

export type BuildLsacConfirmEmailUrlInput = {
  studentCoachingId: string
  vendorId: string
  /** Full confirm_email endpoint URL (path included). */
  baseUrl?: string
}

/**
 * Builds the LawHub confirm_email activation URL for a vendor-student coaching link.
 * Query param casing must match LSAC email links: StudentCoachingId, VendorId.
 */
export function buildLsacConfirmEmailUrl(input: BuildLsacConfirmEmailUrlInput): string {
  const coachingId = input.studentCoachingId.trim()
  if (!coachingId) throw new Error('studentCoachingId is required')

  const vendorId = input.vendorId.trim()
  if (!vendorId) throw new Error('vendorId is required')

  const rawBase = (input.baseUrl ?? DEFAULT_LSAC_CONFIRM_EMAIL_BASE_URL).trim()
  if (!rawBase) throw new Error('confirm email base URL is required')

  const url = new URL(rawBase)
  url.searchParams.set('StudentCoachingId', coachingId)
  url.searchParams.set('VendorId', vendorId)
  return url.toString()
}

export function resolveLsacConfirmEmailBaseUrl(
  env: Record<string, string | undefined> = Deno.env.toObject(),
): string {
  const override = env.LSAC_CONFIRM_EMAIL_BASE_URL?.trim()
  return override || DEFAULT_LSAC_CONFIRM_EMAIL_BASE_URL
}
