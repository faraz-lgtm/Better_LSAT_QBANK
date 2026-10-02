import { assertEquals } from 'jsr:@std/assert@1'
import type { DiagnosticRepository } from './diagnostic.repository.ts'
import { createDiagnosticService } from './diagnostic.service.ts'

const STRIPE_TEST_ENV: Record<string, string> = {
  STRIPE_SECRET_KEY_TEST: 'sk_test',
  STRIPE_WEBHOOK_SECRET_TEST: 'whsec',
  STRIPE_PUBLISHABLE_KEY_TEST: 'pk_test',
  STRIPE_PRICE_ID_CORE_TEST: 'price_core_test',
  STRIPE_PRICE_ID_LIVE_MONTHLY_TEST: 'price_live_test',
  STRIPE_PRICE_ID_LSAC_YEARLY_TEST: 'price_lsac_test',
  SUPABASE_URL: 'https://abc.supabase.co',
}

async function withStripeTestEnv(run: () => Promise<void>): Promise<void> {
  const previous = { ...Deno.env.toObject() }
  for (const [key, value] of Object.entries(STRIPE_TEST_ENV)) {
    Deno.env.set(key, value)
  }
  try {
    await run()
  } finally {
    for (const key of Object.keys(STRIPE_TEST_ENV)) {
      Deno.env.delete(key)
    }
    for (const [key, value] of Object.entries(previous)) {
      if (value != null) Deno.env.set(key, value)
    }
  }
}

const SAMPLE_ROWS = [
  {
    source_item_id: 'mini-diag-q1',
    question_number: 1,
    stimulus_text: 'Stimulus',
    stem_text: 'Stem?',
    choices: [
      { optionLetter: 'A', optionContent: 'A text', optionExplanation: 'A why' },
      { optionLetter: 'C', optionContent: 'C text', optionExplanation: 'C why' },
    ],
    correct_answer: 'C',
    explanation: '<p>Full explanation</p>',
    difficulty: 1,
    source_label: 'Main Conclusion',
  },
] as Awaited<ReturnType<DiagnosticRepository['listMiniDiagnosticQuestions']>>

function mockRepository(
  rows: Awaited<ReturnType<DiagnosticRepository['listMiniDiagnosticQuestions']>> = SAMPLE_ROWS,
): DiagnosticRepository {
  return {
    async listMiniDiagnosticQuestions() {
      return rows
    },
  }
}

Deno.test('getMiniDiagnosticExplanations returns locked payload when unpaid', async () => {
  await withStripeTestEnv(async () => {
    const service = createDiagnosticService({
      repository: mockRepository(),
      hasActiveSubscription: async () => false,
    })

    const out = await service.getMiniDiagnosticExplanations('user-1')
    assertEquals(out.explanationsLocked, true)
    assertEquals(out.explanations, [])
  })
})

Deno.test('getMiniDiagnosticExplanations returns mapped explanations when paid', async () => {
  const service = createDiagnosticService({
    repository: mockRepository(),
    hasActiveSubscription: async () => true,
  })

  const out = await service.getMiniDiagnosticExplanations('user-1')
  assertEquals(out.explanationsLocked, false)
  assertEquals(out.explanations.length, 1)
  assertEquals(out.explanations[0]?.sourceItemId, 'mini-diag-q1')
  assertEquals(out.explanations[0]?.questionType, 'Main Conclusion')
  assertEquals(out.explanations[0]?.correctAnswer, 'C')
  assertEquals(out.explanations[0]?.explanationHtml, '<p>Full explanation</p>')
  assertEquals(out.explanations[0]?.choices[0]?.letter, 'A')
  assertEquals(out.explanations[0]?.choices[0]?.explanation, 'A why')
})

Deno.test('getMiniDiagnosticExplanations returns empty unlocked list when section missing', async () => {
  const service = createDiagnosticService({
    repository: mockRepository([]),
    hasActiveSubscription: async () => true,
  })

  const out = await service.getMiniDiagnosticExplanations('user-1')
  assertEquals(out.explanationsLocked, false)
  assertEquals(out.explanations, [])
})
