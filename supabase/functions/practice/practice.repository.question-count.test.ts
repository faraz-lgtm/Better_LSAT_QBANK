import { assertEquals } from 'jsr:@std/assert@1'

import { sectionQuestionCount } from './practice.repository.ts'

Deno.test('sectionQuestionCount prefers denormalized question_count', () => {
  assertEquals(sectionQuestionCount({ question_count: 25, admin_questions: [{ count: 99 }] }), 25)
})

Deno.test('sectionQuestionCount falls back to nested PostgREST count', () => {
  assertEquals(sectionQuestionCount({ admin_questions: [{ count: 12 }] }), 12)
  assertEquals(sectionQuestionCount({ admin_questions: [{ id: 'a' }, { id: 'b' }] }), 2)
  assertEquals(sectionQuestionCount({}), 0)
})
