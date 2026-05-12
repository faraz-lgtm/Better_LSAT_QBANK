/** Normalizes LawHub vendor API student payloads into our profile shape. */

export type LsacStudentPayload = {
  studentCoachingId?: string
  emailAddress?: string
  firstName?: string
  lastName?: string
}

export type ProfileUpsertInput = {
  id: string
  email: string | null
  full_name: string | null
  role?: 'student' | 'admin'
  student_coaching_id: string | null
}

export function mapLsacStudentToProfileUpsert(
  userId: string,
  lsac: LsacStudentPayload,
): ProfileUpsertInput {
  const email = lsac.emailAddress?.trim().toLowerCase() ?? null
  const fullName =
    [lsac.firstName, lsac.lastName].filter(Boolean).join(' ').trim() || null
  return {
    id: userId,
    email,
    full_name: fullName,
    student_coaching_id: lsac.studentCoachingId?.trim() ?? null,
  }
}

function asOptionalString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

/** Maps LawHub GET student / invite response JSON into our profile row. */
export function mapLawHubStudentRecordToProfileUpsert(
  userId: string,
  record: Record<string, unknown>,
): ProfileUpsertInput {
  return mapLsacStudentToProfileUpsert(userId, {
    emailAddress: asOptionalString(record.emailAddress),
    firstName: asOptionalString(record.firstName),
    lastName: asOptionalString(record.lastName),
    studentCoachingId: asOptionalString(record.studentCoachingId),
  })
}
