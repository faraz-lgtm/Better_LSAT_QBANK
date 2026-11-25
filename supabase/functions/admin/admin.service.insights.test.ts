import { assertEquals, assertRejects } from "jsr:@std/assert@1"

import { createAdminService } from "./admin.service.ts"

Deno.test("getInsights with range builds live payload via repository", async () => {
  let capturedFrom = ""
  let capturedTo = ""
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      buildInsightsPayload: async (range: { from: string; to: string }) => {
        capturedFrom = range.from
        capturedTo = range.to
        return {
          computed_at: "2026-11-25T12:00:00.000Z",
          timezone: "America/Toronto",
          funnel: [{ stage: "Signed up", count: 3 }],
        }
      },
      getLatestInsightsSnapshot: async () => {
        throw new Error("should not read snapshot when range is provided")
      },
    } as never,
  })

  const out = await service.getInsights("admin-1", {
    from: "2026-11-01T00:00:00.000Z",
    to: "2026-11-25T23:59:59.999Z",
  })

  assertEquals(capturedFrom, "2026-11-01T00:00:00.000Z")
  assertEquals(capturedTo, "2026-11-25T23:59:59.999Z")
  assertEquals(out.timezone, "America/Toronto")
  assertEquals((out.payload as { funnel: unknown[] }).funnel.length, 1)
})

Deno.test("getInsights without range falls back to latest snapshot", async () => {
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      getLatestInsightsSnapshot: async () => ({
        id: "snap-1",
        computed_at: "2026-11-25T12:00:00.000Z",
        timezone: "America/Toronto",
        payload: { funnel: [] },
      }),
      buildInsightsPayload: async () => {
        throw new Error("should not build when range omitted")
      },
    } as never,
  })

  const out = await service.getInsights("admin-1")
  assertEquals((out as { id: string }).id, "snap-1")
})

Deno.test("getInsights rejects inverted range", async () => {
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      buildInsightsPayload: async () => ({}),
    } as never,
  })
  await assertRejects(
    () =>
      service.getInsights("admin-1", {
        from: "2026-11-25T00:00:00.000Z",
        to: "2026-11-01T00:00:00.000Z",
      }),
    Error,
    "to must be >= from",
  )
})
