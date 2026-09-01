import { assertEquals } from 'jsr:@std/assert@1'
import {
  mapDrillQuestionRow,
  mapDrillQuestionRows,
  pickDrillQuestionIds,
  pickRcDrillQuestionIdsByPassageCount,
  type DrillQuestionRow,
} from './practice.mapper.ts'

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

Deno.test('pickDrillQuestionIds LR caps at 30', () => {
  const pool = Array.from({ length: 40 }, (_, i) => ({
    id: `q-${i}`,
    section_id: 's1',
    source_group_id: null,
  }))
  const ids = pickDrillQuestionIds(pool, 'LR', 30)
  assertEquals(ids.length, 30)
})

Deno.test('pickDrillQuestionIds LR unlimited returns every question in the pool', () => {
  const pool = Array.from({ length: 12 }, (_, i) => ({
    id: `q-${i}`,
    section_id: 's1',
    source_group_id: null,
  }))
  const ids = pickDrillQuestionIds(pool, 'LR', 'unlimited')
  assertEquals(ids.length, 12)
  assertEquals(new Set(ids).size, 12)
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

Deno.test('pickRcDrillQuestionIdsByPassageCount returns every question in N passages', () => {
  const pool = [
    { id: 'a1', section_id: 's1', source_group_id: 'g1' },
    { id: 'a2', section_id: 's1', source_group_id: 'g1' },
    { id: 'b1', section_id: 's1', source_group_id: 'g2' },
    { id: 'b2', section_id: 's1', source_group_id: 'g2' },
    { id: 'c1', section_id: 's1', source_group_id: 'g3' },
  ]
  const ids = pickRcDrillQuestionIdsByPassageCount(pool, 1)
  assertEquals(ids.length === 1 || ids.length === 2, true)
  const fromA = ids.every((id) => id === 'a1' || id === 'a2')
  const fromB = ids.every((id) => id === 'b1' || id === 'b2')
  const fromC = ids.every((id) => id === 'c1')
  assertEquals(fromA || fromB || fromC, true)
})

Deno.test('pickRcDrillQuestionIdsByPassageCount unlimited returns all questions', () => {
  const pool = [
    { id: 'a1', section_id: 's1', source_group_id: 'g1' },
    { id: 'a2', section_id: 's1', source_group_id: 'g1' },
    { id: 'b1', section_id: 's1', source_group_id: 'g2' },
  ]
  const ids = pickRcDrillQuestionIdsByPassageCount(pool, 'unlimited')
  assertEquals(ids.length, 3)
  assertEquals(new Set(ids).size, 3)
})

Deno.test('pickRcDrillQuestionIdsByPassageCount caps at available passages', () => {
  const pool = [
    { id: 'a1', section_id: 's1', source_group_id: 'g1' },
    { id: 'b1', section_id: 's1', source_group_id: 'g2' },
  ]
  const ids = pickRcDrillQuestionIdsByPassageCount(pool, 8)
  assertEquals(ids.length, 2)
})

Deno.test('pickRcDrillQuestionIdsByPassageCount puts fresh passages before reviewed', () => {
  const pool = [
    { id: 'a1', section_id: 's1', source_group_id: 'g1' },
    { id: 'a2', section_id: 's1', source_group_id: 'g1' },
    { id: 'b1', section_id: 's1', source_group_id: 'g2' },
    { id: 'b2', section_id: 's1', source_group_id: 'g2' },
  ]
  const ids = pickRcDrillQuestionIdsByPassageCount(pool, 'unlimited', new Set(['b1']))
  assertEquals(ids.slice(0, 2).every((id) => id === 'a1' || id === 'a2'), true)
  assertEquals(ids.slice(2).every((id) => id === 'b1' || id === 'b2'), true)
})

Deno.test('pickRcDrillQuestionIdsByPassageCount prefers a fresh passage when count is 1', () => {
  const pool = [
    { id: 'a1', section_id: 's1', source_group_id: 'g1' },
    { id: 'b1', section_id: 's1', source_group_id: 'g2' },
  ]
  const ids = pickRcDrillQuestionIdsByPassageCount(pool, 1, new Set(['b1']))
  assertEquals(ids, ['a1'])
})

Deno.test('mapDrillQuestionRows assigns distinct RC passages per source_group_id', () => {
  const rows: DrillQuestionRow[] = [
    {
      ...baseRow,
      id: 'q1',
      source_group_id: 'g1',
      question_number: 1,
      admin_sections: {
        id: 's1',
        section_type: 'RC',
        section_number: 2,
        title: 'RC',
        admin_passages: [
          { id: 'pass-a', source_group_id: null, content: 'Passage A body', topic_tag: 'A' },
          { id: 'pass-b', source_group_id: null, content: 'Passage B body', topic_tag: 'B' },
        ],
      },
    },
    {
      ...baseRow,
      id: 'q2',
      source_group_id: 'g1',
      question_number: 2,
      admin_sections: {
        id: 's1',
        section_type: 'RC',
        section_number: 2,
        title: 'RC',
        admin_passages: [
          { id: 'pass-a', source_group_id: null, content: 'Passage A body', topic_tag: 'A' },
          { id: 'pass-b', source_group_id: null, content: 'Passage B body', topic_tag: 'B' },
        ],
      },
    },
    {
      ...baseRow,
      id: 'q3',
      source_group_id: 'g2',
      question_number: 3,
      admin_sections: {
        id: 's1',
        section_type: 'RC',
        section_number: 2,
        title: 'RC',
        admin_passages: [
          { id: 'pass-a', source_group_id: null, content: 'Passage A body', topic_tag: 'A' },
          { id: 'pass-b', source_group_id: null, content: 'Passage B body', topic_tag: 'B' },
        ],
      },
    },
  ]

  const out = mapDrillQuestionRows(rows, false)
  assertEquals(out[0]!.passage?.id, 'pass-a')
  assertEquals(out[1]!.passage?.id, 'pass-a')
  assertEquals(out[2]!.passage?.id, 'pass-b')
  assertEquals(out[0]!.sourceGroupId, 'g1')
  assertEquals(out[2]!.sourceGroupId, 'g2')
  assertEquals(out[0]!.passage?.id !== out[2]!.passage?.id, true)
})
