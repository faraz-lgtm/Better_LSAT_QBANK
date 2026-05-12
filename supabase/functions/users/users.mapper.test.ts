import { assertEquals } from 'jsr:@std/assert@1'
import {
  mapLawHubStudentRecordToProfileUpsert,
  mapLsacStudentToProfileUpsert,
} from './users.mapper.ts'

Deno.test('mapLsacStudentToProfileUpsert lowercases email and trims coaching id', () => {
  const row = mapLsacStudentToProfileUpsert('user-uuid', {
    emailAddress: 'Student@EXAMPLE.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    studentCoachingId: '  coach-id  ',
  })

  assertEquals(row.id, 'user-uuid')
  assertEquals(row.email, 'student@example.com')
  assertEquals(row.full_name, 'Ada Lovelace')
  assertEquals(row.student_coaching_id, 'coach-id')
})

Deno.test('mapLsacStudentToProfileUpsert handles missing optional fields', () => {
  const row = mapLsacStudentToProfileUpsert('u2', {})
  assertEquals(row.email, null)
  assertEquals(row.full_name, null)
  assertEquals(row.student_coaching_id, null)
})

Deno.test('mapLawHubStudentRecordToProfileUpsert reads LawHub JSON fields', () => {
  const row = mapLawHubStudentRecordToProfileUpsert('uid', {
    studentCoachingId: 'coach-1',
    emailAddress: 'A@B.CO',
    firstName: 'Pat',
    lastName: 'Lee',
  })
  assertEquals(row.student_coaching_id, 'coach-1')
  assertEquals(row.email, 'a@b.co')
  assertEquals(row.full_name, 'Pat Lee')
})
