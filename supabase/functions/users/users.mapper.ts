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

import type {
  OfficialLsatScoreRow,
  StudentStudyPreferencesRow,
} from './users.repository.ts'

export type StudentStudyPreferencesDto = {
  userId: string
  username: string | null
  plannedLsatWindow: string | null
  plannedLsatDate: string | null
  lawSchoolCycle: string | null
  goalScore: number | null
  startingScore: number | null
  studyDays: string[]
  studyHoursLabel: string | null
  wantsLessons: boolean
}

export type OfficialLsatScoreDto = {
  id: string
  testLabel: string
  testDate: string | null
  scaledScore: number | null
  sortOrder: number
}

export function parseLsatScoreValue(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 120 && raw <= 180) {
    return raw
  }
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed === "I haven't taken an LSAT yet") return null
  const n = Number.parseInt(trimmed, 10)
  if (!Number.isInteger(n) || n < 120 || n > 180) return null
  return n
}

export function mapStudyPreferencesRow(row: StudentStudyPreferencesRow): StudentStudyPreferencesDto {
  return {
    userId: row.user_id,
    username: row.username,
    plannedLsatWindow: row.planned_lsat_window,
    plannedLsatDate: row.planned_lsat_date,
    lawSchoolCycle: row.law_school_cycle,
    goalScore: row.goal_score,
    startingScore: row.starting_score,
    studyDays: row.study_days ?? [],
    studyHoursLabel: row.study_hours_label,
    wantsLessons: row.wants_lessons,
  }
}

export function mapOfficialScoreRow(row: OfficialLsatScoreRow): OfficialLsatScoreDto {
  return {
    id: row.id,
    testLabel: row.test_label,
    testDate: row.test_date,
    scaledScore: row.scaled_score,
    sortOrder: row.sort_order,
  }
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
