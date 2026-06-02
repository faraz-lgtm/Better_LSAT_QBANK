import { assertEquals } from 'jsr:@std/assert@1'
import { parseQuestionChoices } from './parse-question-choices.ts'

Deno.test('parseQuestionChoices maps optionContent from object choices', () => {
  const out = parseQuestionChoices([
    { optionLetter: 'A', optionContent: '<p>A</p>' },
    { optionLetter: 'B', optionContent: '<p>B</p>' },
  ])
  assertEquals(out.length, 2)
  assertEquals(out[0]!.id, 'A')
  assertEquals(out[0]!.text, '<p>A</p>')
  assertEquals(out[0]!.explanationHtml, null)
})

Deno.test('parseQuestionChoices includes optionExplanation when requested', () => {
  const out = parseQuestionChoices(
    [
      { optionLetter: 'A', optionContent: '<p>A</p>', optionExplanation: '<p>Why A</p>' },
      { optionLetter: 'B', optionContent: '<p>B</p>', optionExplanation: '   ' },
    ],
    { includeOptionExplanations: true },
  )
  assertEquals(out[0]!.explanationHtml, '<p>Why A</p>')
  assertEquals(out[1]!.explanationHtml, null)
})

Deno.test('parseQuestionChoices supports legacy string choices', () => {
  const out = parseQuestionChoices(['First', 'Second'], { includeOptionExplanations: true })
  assertEquals(out[0]!.id, 'A')
  assertEquals(out[0]!.text, 'First')
  assertEquals(out[0]!.explanationHtml, null)
})
