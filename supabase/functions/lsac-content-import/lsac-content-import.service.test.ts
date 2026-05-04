import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import { createLsacContentImportService } from './lsac-content-import.service.ts'

function mockRepo() {
  let moduleCount = 0
  let sectionCount = 0
  let itemCount = 0
  return {
    repo: {
      async upsertModule() {
        moduleCount += 1
      },
      async upsertSections(rows: unknown[]) {
        sectionCount += rows.length
      },
      async upsertItems(rows: unknown[]) {
        itemCount += rows.length
      },
    },
    counts: () => ({ moduleCount, sectionCount, itemCount }),
  }
}

Deno.test('lsac-content-import imports single module payload', async () => {
  const { repo, counts } = mockRepo()
  const service = createLsacContentImportService({ repository: repo })
  const result = await service.importPayload({
    moduleId: 'LogicalReasoning-DrillSet1',
    sections: [
      {
        sectionId: 'S1',
        sectionOrder: 1,
        items: [{ itemId: 'Q1', itemPosition: 1, options: [] }],
      },
    ],
  })
  assertEquals(result.imported, 1)
  assertEquals(result.modules[0].moduleId, 'LogicalReasoning-DrillSet1')
  assertEquals(counts(), { moduleCount: 1, sectionCount: 1, itemCount: 1 })
})

Deno.test('lsac-content-import rejects missing moduleId', async () => {
  const { repo } = mockRepo()
  const service = createLsacContentImportService({ repository: repo })
  await assertRejects(
    () =>
      service.importPayload({
        sections: [],
      }),
    Error,
    'moduleId is required',
  )
})
