import { assertEquals } from 'jsr:@std/assert@1'
import { pickDrillQuestionIds } from './practice.mapper.ts'

Deno.test('pickDrillQuestionIds LR returns requested count', () => {
  const pool = Array.from({ length: 10 }, (_, i) => ({
    id: `q-${i}`,
    section_id: 's1',
    source_group_id: null,
  }))
  const ids = pickDrillQuestionIds(pool, 'LR', 5)
  assertEquals(ids.length, 5)
  assertEquals(new Set(ids).size, 5)
})

Deno.test('pickDrillQuestionIds RC prefers passage groups', () => {
  const pool = [
    { id: 'a1', section_id: 's1', source_group_id: 'g1' },
    { id: 'a2', section_id: 's1', source_group_id: 'g1' },
    { id: 'b1', section_id: 's1', source_group_id: 'g2' },
    { id: 'b2', section_id: 's1', source_group_id: 'g2' },
  ]
  const ids = pickDrillQuestionIds(pool, 'RC', 2)
  assertEquals(ids.length, 2)
  const group1 = ids.every((id) => id === 'a1' || id === 'a2')
  const group2 = ids.every((id) => id === 'b1' || id === 'b2')
  assertEquals(group1 || group2, true)
})
