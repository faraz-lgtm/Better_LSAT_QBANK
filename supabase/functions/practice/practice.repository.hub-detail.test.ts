import { assertEquals } from 'jsr:@std/assert@1'

import { createPracticeRepository } from './practice.repository.ts'

Deno.test('getPrepTestHubDetail maps RPC payload and returns null on missing fn', async () => {
  const okClient = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      assertEquals(name, 'get_student_prep_test_hub_detail')
      assertEquals(args.p_user_id, 'user-1')
      assertEquals(args.p_prep_test_id, 'pt-900')
      return {
        data: {
          row: {
            id: 'pt-900',
            moduleId: 'LSAC900',
            title: 'Alpha',
            sections: [
              {
                id: 'sec-lr',
                sectionId: 'SEED-LR',
                sectionNumber: 1,
                sectionType: 'LR',
                title: 'LR',
                questionCount: 25,
                isExperimental: false,
              },
            ],
          },
          sessions: [
            {
              id: 'sec-sess',
              user_id: 'user-1',
              kind: 'SECTION',
              prep_test_id: 'pt-900',
              section_id: 'sec-lr',
              started_at: '2026-01-02T00:00:00Z',
              completed_at: null,
              raw_score: null,
              scaled_score: null,
              metadata: { answeredCount: 4 },
            },
          ],
        },
        error: null,
      }
    },
  }

  const repo = createPracticeRepository(okClient as never)
  const out = await repo.getPrepTestHubDetail('user-1', 'pt-900')
  assertEquals(out?.row.id, 'pt-900')
  assertEquals(out?.row.sections[0]?.questionCount, 25)
  assertEquals(out?.sessions[0]?.metadata.answeredCount, 4)

  const missingClient = {
    rpc: async () => ({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function' },
    }),
  }
  const missingRepo = createPracticeRepository(missingClient as never)
  assertEquals(await missingRepo.getPrepTestHubDetail('user-1', 'pt-900'), null)
})
