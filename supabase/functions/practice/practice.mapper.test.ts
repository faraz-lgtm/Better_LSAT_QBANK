import { assertEquals } from 'jsr:@std/assert@1'
import { mapDrillQuestionRow, pickDrillQuestionIds, type DrillQuestionRow } from './practice.mapper.ts'

const baseRow: DrillQuestionRow = {
  id: 'q-1',
  question_number: 1,
  source_group_id: null,
  stimulus_text: 'Stimulus',
  stem_text: 'Stem?',
  choices: [
    { optionLetter: 'A', optionContent: 'A text', optionExplanation: '<p>Why A</p>' },
    { optionLetter: 'B', optionContent: 'B text' },
  ],
  correct_answer: 'B',
  admin_sections: {
    id: 's1',
    section_type: 'LR',
    section_number: 1,
    title: 'LR',
    admin_passages: [],
  },
}

Deno.test('mapDrillQuestionRow omits review fields during active practice', () => {
  const out = mapDrillQuestionRow(baseRow, { includeOptionExplanations: false })
  assertEquals(out.correctChoiceId, undefined)
  assertEquals(out.choices.every((c) => c.explanationHtml == null), true)
})

Deno.test('mapDrillQuestionRow includes option explanations and correct answer when review', () => {
  const out = mapDrillQuestionRow(baseRow, { includeOptionExplanations: true })
  assertEquals(out.correctChoiceId, 'B')
  assertEquals(out.choices[0]!.explanationHtml, '<p>Why A</p>')
  assertEquals(out.choices[1]!.explanationHtml, null)
})

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
