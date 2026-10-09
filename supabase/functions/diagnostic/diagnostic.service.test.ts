import { assertEquals } from 'jsr:@std/assert@1'
import type { DiagnosticRepository } from './diagnostic.repository.ts'
import { createDiagnosticService } from './diagnostic.service.ts'

const STRIPE_TEST_ENV: Record<string, string> = {
  STRIPE_SECRET_KEY_TEST: 'sk_test',
  STRIPE_WEBHOOK_SECRET_TEST: 'whsec',
  STRIPE_PUBLISHABLE_KEY_TEST: 'pk_test',
  STRIPE_PRICE_ID_CORE_TEST: 'price_core_test',
  STRIPE_PRICE_ID_CORE_3_MONTH_TEST: 'price_core_3_month_test',
  STRIPE_PRICE_ID_CORE_6_MONTH_TEST: 'price_core_6_month_test',
  STRIPE_PRICE_ID_CORE_YEARLY_TEST: 'price_core_yearly_test',
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
    video_url: 'https://gumlet.tv/watch/6ac7f1fe2b2e8222c6c6e72d/',
    difficulty: 1,
    source_label: 'Main Conclusion',
  },
] as Awaited<ReturnType<DiagnosticRepository['listMiniDiagnosticQuestions']>>

const SAMPLE_VIDEO_ROWS = [
  {
    source_item_id: 'mini-diag-q1',
    video_url: 'https://gumlet.tv/watch/6ac7f1fe2b2e8222c6c6e72d/',
  },
  {
    source_item_id: 'section-diag-q1',
    video_url: 'https://gumlet.tv/watch/section-video/',
  },
  {
    source_item_id: 'section-diag-q2',
    video_url: null,
  },
] as Awaited<ReturnType<DiagnosticRepository['listDiagnosticVideoUrls']>>

function mockRepository(
  rows: Awaited<ReturnType<DiagnosticRepository['listMiniDiagnosticQuestions']>> = SAMPLE_ROWS,
  videoRows: Awaited<ReturnType<DiagnosticRepository['listDiagnosticVideoUrls']>> = SAMPLE_VIDEO_ROWS,
): DiagnosticRepository {
  return {
    async listMiniDiagnosticQuestions() {
      return rows
    },
    async listDiagnosticVideoUrls() {
      return videoRows
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
    assertEquals(out.explanations.length, 1)
    assertEquals(out.explanations[0]?.sourceItemId, 'mini-diag-q1')
    assertEquals(out.explanations[0]?.videoUrl, 'https://gumlet.tv/watch/6ac7f1fe2b2e8222c6c6e72d/')
    assertEquals(out.explanations[0]?.explanationHtml, null)
    assertEquals(out.explanations[0]?.choices, [])
    assertEquals(out.videoUrls, [
      { sourceItemId: 'mini-diag-q1', videoUrl: 'https://gumlet.tv/watch/6ac7f1fe2b2e8222c6c6e72d/' },
      { sourceItemId: 'section-diag-q1', videoUrl: 'https://gumlet.tv/watch/section-video/' },
    ])
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
  assertEquals(out.explanations[0]?.videoUrl, 'https://gumlet.tv/watch/6ac7f1fe2b2e8222c6c6e72d/')
  assertEquals(out.explanations[0]?.choices[0]?.letter, 'A')
  assertEquals(out.explanations[0]?.choices[0]?.explanation, 'A why')
  assertEquals(out.videoUrls.length, 2)
})

Deno.test('getMiniDiagnosticExplanations returns empty unlocked list when section missing', async () => {
  const service = createDiagnosticService({
    repository: mockRepository([], []),
    hasActiveSubscription: async () => true,
  })

  const out = await service.getMiniDiagnosticExplanations('user-1')
  assertEquals(out.explanationsLocked, false)
  assertEquals(out.explanations, [])
  assertEquals(out.videoUrls, [])
})
