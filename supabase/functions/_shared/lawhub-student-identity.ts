/** LawHub / LSAC student identity rules shared by billing checkout and users invites. */

export type LawHubIdentityErrorCode =
  | 'LAWHUB_EMAIL_REQUIRED'
  | 'LAWHUB_EMAIL_PLUS_NOT_ALLOWED'
  | 'LAWHUB_NAME_REQUIRED'

export class LawHubIdentityError extends Error {
  readonly code: LawHubIdentityErrorCode

  constructor(code: LawHubIdentityErrorCode, message: string) {
    super(message)
    this.name = 'LawHubIdentityError'
    this.code = code
  }
}

export type LawHubNameParts = {
  firstName: string
  lastName: string
}

export function splitFullName(
  fullName: string | null | undefined,
): LawHubNameParts {
  const trimmed = fullName?.trim() ?? ''
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0]!, lastName: '' }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') }
}

export function joinLawHubFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim()
}

/** Throws when the email is missing or violates LSAC's no-"+" local-part policy. */
export function assertLawHubEmailAllowed(email: string | null | undefined): string {
  const normalized = email?.trim().toLowerCase() ?? ''
  if (!normalized) {
    throw new LawHubIdentityError(
      'LAWHUB_EMAIL_REQUIRED',
      'A valid email is required before LawHub checkout or invite.',
    )
  }
  const local = normalized.split('@')[0] ?? ''
  if (local.includes('+')) {
    throw new LawHubIdentityError(
      'LAWHUB_EMAIL_PLUS_NOT_ALLOWED',
      'LSAC policy does not allow "+" in student email addresses. Use an email without a plus tag before checkout.',
    )
  }
  return normalized
}

/**
 * Resolves first + last name for LawHub POST /students.
 * Prefers explicit first/last; falls back to splitting full_name.
 */
export function requireLawHubNameParts(input: {
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
}): LawHubNameParts {
  let firstName = input.firstName?.trim() ?? ''
  let lastName = input.lastName?.trim() ?? ''

  if (!firstName || !lastName) {
    const fromFull = splitFullName(input.fullName)
    if (!firstName) firstName = fromFull.firstName
    if (!lastName) lastName = fromFull.lastName
  }

  if (!firstName || !lastName) {
    throw new LawHubIdentityError(
      'LAWHUB_NAME_REQUIRED',
      'First and last name are required for LawHub registration. Update your profile before checkout.',
    )
  }

  return { firstName, lastName }
}

export function isLawHubIdentityError(error: unknown): error is LawHubIdentityError {
  return error instanceof LawHubIdentityError
}
