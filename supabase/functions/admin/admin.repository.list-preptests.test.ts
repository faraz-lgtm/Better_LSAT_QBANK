import { assertEquals } from "jsr:@std/assert@1"
import { createAdminRepository } from "./admin.repository.ts"

type Call = { table?: string; select?: string; rpc?: string; rpcIds?: string[]; head?: boolean }

function createListPrepTestsClient(opts: {
  prepTests: Array<Record<string, unknown>>
  sections: Array<Record<string, unknown>>
  stats: Array<{ prep_test_id: string; total: number; explained: number; tagged: number }>
  courseCount?: number
}) {
  const calls: Call[] = []
  const client = {
    rpc: async (name: string, args: { p_prep_test_ids?: string[] }) => {
      calls.push({ rpc: name, rpcIds: (args?.p_prep_test_ids ?? []).map(String) })
      const wanted = new Set((args?.p_prep_test_ids ?? []).map(String))
      const data = wanted.size === 0 ? opts.stats : opts.stats.filter((row) => wanted.has(String(row.prep_test_id)))
      return { data, error: null }
    },
    from(table: string) {
      let inIds: string[] | null = null
      let head = false
      const builder: {
        select: (cols: string, options?: { head?: boolean; count?: string }) => typeof builder
        in: (col: string, ids: unknown[]) => typeof builder
        order: (..._args: unknown[]) => typeof builder
        then: (resolve: (value: { data: unknown; count: number | null; error: null }) => void) => void
      } = {
        select(cols: string, options?: { head?: boolean; count?: string }) {
          head = options?.head === true
          calls.push({ table, select: cols, head })
          return builder
        },
        in(_col: string, ids: unknown[]) {
          inIds = ids.map(String)
          return builder
        },
        order() {
          return builder
        },
        then(resolve) {
          if (table === "prep_courses") {
            resolve({ data: head ? null : [], count: opts.courseCount ?? 0, error: null })
            return
          }
          if (table === "admin_prep_tests") {
            resolve({ data: opts.prepTests, count: opts.prepTests.length, error: null })
            return
          }
          const sections = inIds
            ? opts.sections.filter((row) => inIds!.includes(String(row.prep_test_id)))
            : opts.sections
          resolve({ data: table === "admin_sections" ? sections : [], count: sections.length, error: null })
        },
      }
      return builder
    },
  }
  return { client, calls }
}

const PT141 = "11111111-1111-1111-1111-111111111111"
const PT100 = "22222222-2222-2222-2222-222222222222"
const PT99 = "33333333-3333-3333-3333-333333333333"

function twoVisiblePrepTests() {
  return createListPrepTestsClient({
    prepTests: [
      { id: PT141, module_id: "LSAC141", title: "PrepTest 141", imported_at: "2026-01-01T00:00:00Z" },
      { id: PT100, module_id: "LSAC100", title: "PrepTest 100", imported_at: "2025-01-01T00:00:00Z" },
      { id: PT99, module_id: "LSAC099", title: "PrepTest 99", imported_at: "2024-01-01T00:00:00Z" },
    ],
    sections: [
      { id: "sec-141", prep_test_id: PT141, section_type: "LR", section_id: "LR:1", title: "LR" },
      { id: "sec-100", prep_test_id: PT100, section_type: "RC", section_id: "RC:1", title: "RC" },
    ],
    stats: [
      { prep_test_id: PT141, total: 50, explained: 12, tagged: 40 },
      { prep_test_id: PT100, total: 27, explained: 27, tagged: 27 },
    ],
    courseCount: 4,
  })
}

Deno.test("listPrepTests uses SQL aggregates instead of downloading question explanations", async () => {
  const { client, calls } = twoVisiblePrepTests()
  const repo = createAdminRepository(client as never)
  const { rows, total } = await repo.listPrepTests(10, 0)

  assertEquals(total, 2)
  assertEquals(rows[0]?.question_count, 50)
  assertEquals(rows[0]?.explained_count, 12)
  assertEquals(rows[0]?.tagged_count, 40)
  assertEquals(rows[0]?.has_lr, true)
  assertEquals(calls.some((c) => c.rpc === "admin_prep_test_question_stats"), true)
  assertEquals(
    calls.some((c) => c.select?.includes("explanation")),
    false,
  )
  assertEquals(
    calls.some((c) => c.table === "admin_prep_tests" && c.select?.includes("admin_sections(count)")),
    false,
  )
})

Deno.test("listPrepTests only loads question stats for the requested page", async () => {
  const { client, calls } = twoVisiblePrepTests()
  const repo = createAdminRepository(client as never)
  const { rows, total } = await repo.listPrepTests(1, 0)

  assertEquals(total, 2)
  assertEquals(rows.length, 1)
  assertEquals(rows[0]?.module_id, "LSAC141")
  const statsCall = calls.find((c) => c.rpc === "admin_prep_test_question_stats")
  assertEquals(statsCall?.rpcIds, [PT141])
})

Deno.test("listPrepTests summary mode skips section and stats queries", async () => {
  const { client, calls } = twoVisiblePrepTests()
  const repo = createAdminRepository(client as never)
  const { rows, total } = await repo.listPrepTests(100, 0, undefined, { includeStats: false })

  assertEquals(total, 2)
  assertEquals(rows.map((row) => row.module_id), ["LSAC141", "LSAC100"])
  assertEquals(calls.some((c) => c.rpc === "admin_prep_test_question_stats"), false)
  assertEquals(calls.some((c) => c.table === "admin_sections"), false)
})

Deno.test("listPrepTests search filters grouped titles before pagination", async () => {
  const { client, calls } = twoVisiblePrepTests()
  const repo = createAdminRepository(client as never)
  const { rows, total } = await repo.listPrepTests(10, 0, undefined, { search: "100" })

  assertEquals(total, 1)
  assertEquals(rows[0]?.module_id, "LSAC100")
  const statsCall = calls.find((c) => c.rpc === "admin_prep_test_question_stats")
  assertEquals(statsCall?.rpcIds, [PT100])
})

Deno.test("listPrepTests section filters compute stats only for matching page rows", async () => {
  const { client, calls } = twoVisiblePrepTests()
  const repo = createAdminRepository(client as never)
  const { rows, total } = await repo.listPrepTests(10, 0, "rc")

  assertEquals(total, 1)
  assertEquals(rows[0]?.module_id, "LSAC100")
  const statsCall = calls.find((c) => c.rpc === "admin_prep_test_question_stats")
  assertEquals(statsCall?.rpcIds, [PT100])
})

Deno.test("countVisiblePrepTests counts grouped visible tests without stats", async () => {
  const { client, calls } = twoVisiblePrepTests()
  const repo = createAdminRepository(client as never)
  const total = await repo.countVisiblePrepTests()

  assertEquals(total, 2)
  assertEquals(calls.some((c) => c.rpc), false)
  assertEquals(calls.some((c) => c.table === "admin_sections"), false)
})

Deno.test("countCourses uses a head count", async () => {
  const { client, calls } = twoVisiblePrepTests()
  const repo = createAdminRepository(client as never)
  const total = await repo.countCourses()

  assertEquals(total, 4)
  assertEquals(calls.some((c) => c.table === "prep_courses" && c.head === true), true)
})
