import { assertEquals } from 'jsr:@std/assert@1'

import {
  isStudentVisiblePrepTest,
  MIN_STUDENT_VISIBLE_PREP_TEST,
  prepTestNumberFromModuleId,
} from './prep-test-visibility.ts'

Deno.test('prepTestNumberFromModuleId parses LSAC base module', () => {
  assertEquals(prepTestNumberFromModuleId('LSAC159'), '159')
  assertEquals(prepTestNumberFromModuleId('LSAC159:LA:3:7S:S'), '159')
})

Deno.test('isStudentVisiblePrepTest hides pre-PT100 tests', () => {
  assertEquals(MIN_STUDENT_VISIBLE_PREP_TEST, 100)
  assertEquals(isStudentVisiblePrepTest('LSAC099'), false)
  assertEquals(isStudentVisiblePrepTest('LSAC099:LA:3:7S:S'), false)
  assertEquals(isStudentVisiblePrepTest('LSAC100'), true)
  assertEquals(isStudentVisiblePrepTest('LSAC101'), true)
  assertEquals(isStudentVisiblePrepTest(null), false)
})
