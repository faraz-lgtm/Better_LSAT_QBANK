import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"
import { createPracticeApi } from "./practice"

function mockSupabase(functionsInvoke: ReturnType<typeof vi.fn>, accessToken = "token-1"): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: accessToken ? { access_token: accessToken } : null },
      }),
    },
    functions: {
      invoke: functionsInvoke,
    },
  } as unknown as SupabaseClient
}

describe("createPracticeApi", () => {
  it("createSession invokes practice-create-session", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        session: {
          id: "s1",
          user_id: "u1",
          kind: "PREPTEST",
          prep_test_id: "pt1",
          section_id: null,
          started_at: "2026-01-01T00:00:00Z",
          completed_at: null,
          raw_score: null,
          scaled_score: null,
          percentile: null,
          bookmarked: false,
          excluded: false,
          metadata: {},
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const session = await api.createSession({ kind: "PREPTEST", prepTestId: "pt1" })

    expect(session.id).toBe("s1")
    expect(invoke).toHaveBeenCalledWith("practice-create-session", {
      method: "POST",
      body: {
        kind: "PREPTEST",
        prepTestId: "pt1",
        sectionId: undefined,
        metadata: undefined,
      },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("startDrill invokes practice-start-drill", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        session: { id: "drill-1", kind: "DRILL" },
        metadata: { sectionType: "LR", questionIds: ["q1"], questionCount: 1 },
        questions: [],
        answers: [],
        drillLabel: null,
      },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const out = await api.startDrill({ sectionType: "LR", questionCount: 5 })

    expect(out.session.id).toBe("drill-1")
    expect(invoke).toHaveBeenCalledWith("practice-start-drill", {
      method: "POST",
      body: expect.objectContaining({ sectionType: "LR", questionCount: 5 }),
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("listSectionPool invokes practice-list-section-pool", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        sections: [
          {
            id: "sec-1",
            sectionId: "SEED900-LR-1",
            sectionNumber: 1,
            sectionType: "LR",
            title: "Logical Reasoning",
            moduleId: "LSAC900",
            prepTestId: "pt-900",
            prepTestTitle: "PrepTest Alpha",
            questionCount: 3,
            timeMinutes: 35,
          },
        ],
        total: 5,
        page: 2,
        pageSize: 12,
        sectionTypeCounts: { all: 5, lr: 3, rc: 2 },
      },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const out = await api.listSectionPool({ sectionType: "LR", page: 2, pageSize: 12, sort: "newest" })

    expect(out.sections).toHaveLength(1)
    expect(out.total).toBe(5)
    expect(out.sectionTypeCounts.lr).toBe(3)
    expect(invoke).toHaveBeenCalledWith("practice-list-section-pool", {
      method: "POST",
      body: { sectionType: "LR", page: 2, pageSize: 12, sort: "newest" },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("listSectionPool normalizes legacy responses without pagination fields", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        sections: [
          {
            id: "sec-1",
            sectionId: null,
            sectionNumber: 1,
            sectionType: "LR",
            title: "LR",
            moduleId: "LSAC900",
            prepTestId: "pt-900",
            prepTestTitle: "PrepTest",
            questionCount: 3,
            timeMinutes: 35,
          },
          {
            id: "sec-2",
            sectionId: null,
            sectionNumber: 2,
            sectionType: "RC",
            title: "RC",
            moduleId: "LSAC900",
            prepTestId: "pt-900",
            prepTestTitle: "PrepTest",
            questionCount: 2,
            timeMinutes: 35,
          },
        ],
      },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const out = await api.listSectionPool({ page: 1, pageSize: 12 })

    expect(out.total).toBe(2)
    expect(out.page).toBe(1)
    expect(out.pageSize).toBe(12)
    expect(out.sections).toHaveLength(2)
    expect(out.sectionTypeCounts).toEqual({ all: 2, lr: 1, rc: 1 })
  })

  it("listSectionPool client-paginates legacy full-list responses", async () => {
    const legacySections = Array.from({ length: 25 }, (_, i) => ({
      id: `sec-${i}`,
      sectionId: null,
      sectionNumber: 1,
      sectionType: i % 3 === 0 ? ("RC" as const) : ("LR" as const),
      title: null,
      moduleId: `LSAC${String(100 - i).padStart(3, "0")}`,
      prepTestId: "pt-1",
      prepTestTitle: "PrepTest",
      questionCount: 10,
      timeMinutes: 35,
    }))
    const invoke = vi.fn().mockResolvedValue({
      data: { sections: legacySections },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const page1 = await api.listSectionPool({ page: 1, pageSize: 12, sort: "newest" })
    expect(page1.sections).toHaveLength(12)
    expect(page1.total).toBe(25)
    expect(page1.sectionTypeCounts.all).toBe(25)
    expect(page1.sections[0]!.id).toBe("sec-0")

    const page2 = await api.listSectionPool({ page: 2, pageSize: 12, sort: "newest" })
    expect(page2.sections).toHaveLength(12)
    expect(page2.sections[0]!.id).toBe("sec-12")

    const lrOnly = await api.listSectionPool({ sectionType: "LR", page: 1, pageSize: 12 })
    expect(lrOnly.total).toBe(16)
    expect(lrOnly.sections.every((s) => s.sectionType === "LR")).toBe(true)
  })

  it("startSection invokes practice-start-section", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        session: { id: "section-sess-1", kind: "SECTION" },
        metadata: { sectionType: "LR", questionIds: ["q1", "q2"] },
        section: { id: "sec-1", sectionType: "LR", questionCount: 2, timeMinutes: 35 },
        questions: [],
        answers: [],
        sessionLabel: "PrepTest — LR",
      },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const out = await api.startSection({ sectionId: "sec-1" })

    expect(out.session.id).toBe("section-sess-1")
    expect(invoke).toHaveBeenCalledWith("practice-start-section", {
      method: "POST",
      body: { sectionId: "sec-1", timing: undefined, showAnswers: undefined },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("listPrepTestPool invokes practice-list-prep-test-pool", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        prepTests: [
          {
            id: "pt-900",
            moduleId: "LSAC900",
            title: "PrepTest Alpha",
            prepTestNumber: "900",
            questionCount: 5,
            sectionCount: 3,
            practiceableSectionCount: 2,
            timeMinutes: 70,
            status: "fresh",
            scaledScore: null,
            openPrepTestSessionId: null,
          },
        ],
        total: 1,
        page: 2,
        pageSize: 10,
        statusCounts: { all: 5, fresh: 3, in_progress: 1, completed: 1 },
      },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const out = await api.listPrepTestPool({ filter: "fresh", page: 2, pageSize: 10, sort: "newest" })

    expect(out.prepTests).toHaveLength(1)
    expect(out.total).toBe(1)
    expect(out.statusCounts.fresh).toBe(3)
    expect(invoke).toHaveBeenCalledWith("practice-list-prep-test-pool", {
      method: "POST",
      body: { filter: "fresh", page: 2, pageSize: 10, sort: "newest" },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("startPrepTest invokes practice-start-prep-test", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        prepTestSession: { id: "pt-sess-1", kind: "PREPTEST", metadata: {} },
        detail: { prepTest: { id: "pt-900", label: "PT 900" }, status: "in_progress" },
      },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const out = await api.startPrepTest({ prepTestId: "pt-900", timing: "standard" })

    expect(out.prepTestSession.id).toBe("pt-sess-1")
    expect(invoke).toHaveBeenCalledWith("practice-start-prep-test", {
      method: "POST",
      body: { prepTestId: "pt-900", timing: "standard", format: undefined },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getSectionSession invokes practice-get-section-session", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        session: { id: "section-sess-1", kind: "SECTION" },
        metadata: { sectionType: "RC", questionIds: ["q1"] },
        section: { id: "sec-2", sectionType: "RC", questionCount: 1, timeMinutes: 35 },
        questions: [],
        answers: [],
        sessionLabel: null,
      },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const out = await api.getSectionSession("section-sess-1")

    expect(out.session.id).toBe("section-sess-1")
    expect(invoke).toHaveBeenCalledWith("practice-get-section-session", {
      method: "POST",
      body: { sessionId: "section-sess-1" },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getDrillPoolStats invokes practice-drill-pool-stats", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { selectedCount: 10, totalCount: 100 },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const stats = await api.getDrillPoolStats({ sectionType: "RC", status: "fresh" })

    expect(stats.selectedCount).toBe(10)
    expect(invoke).toHaveBeenCalledWith("practice-drill-pool-stats", {
      method: "POST",
      body: { sectionType: "RC", questionTypeId: undefined, difficulty: undefined, status: "fresh" },
      headers: { Authorization: "Bearer token-1" },
    })
  })
})
