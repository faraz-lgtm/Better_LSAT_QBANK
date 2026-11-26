import { describe, expect, it } from "vitest"

import {
  createdAtInRange,
  filterStudentRecords,
  matchesRecentSignupWindow,
  monthlyEquivalentUsd,
  resolveRecentSignupWindow,
  sortStudentRecords,
} from "@/features/admin/hooks/use-admin-student-records"
import type { AdminStudentRecord } from "@/lib/api/admin"

function row(partial: Partial<AdminStudentRecord>): AdminStudentRecord {
  return {
    id: partial.id ?? "1",
    email: partial.email ?? "a@example.com",
    full_name: partial.full_name ?? "Ada Lovelace",
    created_at: partial.created_at ?? "2026-01-01T00:00:00Z",
    stripe_customer_id: null,
    plan_label: partial.plan_label ?? "Free",
    is_paid: partial.is_paid ?? false,
    sub_status: null,
    days_left: null,
    cancel_at_period_end: null,
    current_period_end: null,
    planned_lsat_date: partial.planned_lsat_date ?? null,
    days_to_test: partial.days_to_test ?? null,
    goal_score: null,
    diagnostic_score: null,
    latest_score: null,
    score_delta: partial.score_delta ?? null,
    preptest_done: 0,
    last_active_at: null,
    days_inactive: partial.days_inactive ?? null,
    activity_band: partial.activity_band ?? "dormant",
    source_label: partial.source_label ?? "Direct",
    has_diagnostic: false,
    at_risk: partial.at_risk ?? false,
    upgrade_candidate: partial.upgrade_candidate ?? false,
    never_started_diagnostic: partial.never_started_diagnostic ?? false,
    test_date_under_30: false,
    cancelled_this_month: false,
    recent_signup_24h: false,
    risk_why: null,
    upgrade_why: null,
  }
}

describe("createdAtInRange", () => {
  const since = Date.parse("2026-11-01T00:00:00.000Z")
  const until = Date.parse("2026-11-30T23:59:59.999Z")

  it("includes signups inside the range", () => {
    expect(createdAtInRange(row({ created_at: "2026-11-15T12:00:00Z" }), since, until)).toBe(true)
  })

  it("excludes signups outside the range", () => {
    expect(createdAtInRange(row({ created_at: "2026-10-31T23:59:59Z" }), since, until)).toBe(false)
    expect(createdAtInRange(row({ created_at: "2026-12-01T00:00:00Z" }), since, until)).toBe(false)
  })
})

describe("filterStudentRecords", () => {
  const rows = [
    row({ id: "1", at_risk: true, full_name: "Maya Patel", email: "maya@x.com" }),
    row({ id: "2", upgrade_candidate: true, full_name: "Chloe Martin", is_paid: false }),
    row({ id: "3", plan_label: "6 mo", is_paid: true, source_label: "Reddit" }),
  ]

  it("filters at_risk view", () => {
    expect(filterStudentRecords(rows, { view: "at_risk" }).map((r) => r.id)).toEqual(["1"])
  })

  it("filters by search", () => {
    expect(filterStudentRecords(rows, { search: "chloe" }).map((r) => r.id)).toEqual(["2"])
  })

  it("filters by source and plan", () => {
    expect(filterStudentRecords(rows, { source: "Reddit", plan: "6 mo" }).map((r) => r.id)).toEqual(["3"])
  })

  it("filters recent_signups by signup window, not the 24h SQL flag", () => {
    const recentRows = [
      row({ id: "old", created_at: "2026-01-01T12:00:00Z", recent_signup_24h: false }),
      row({ id: "mid", created_at: "2026-11-20T12:00:00Z", recent_signup_24h: false }),
      row({ id: "new", created_at: "2026-11-26T12:00:00Z", recent_signup_24h: true }),
    ]
    const ids = filterStudentRecords(recentRows, {
      view: "recent_signups",
      recentSignupWindow: {
        mode: "range",
        fromMs: Date.parse("2026-11-20T00:00:00.000Z"),
        toMs: Date.parse("2026-11-26T23:59:59.999Z"),
      },
    }).map((r) => r.id)
    expect(ids).toEqual(["mid", "new"])
  })

  it("includes every signup when recent window is all", () => {
    const recentRows = [
      row({ id: "old", created_at: "2020-01-01T12:00:00Z", recent_signup_24h: false }),
      row({ id: "new", created_at: "2026-11-26T12:00:00Z", recent_signup_24h: false }),
    ]
    expect(
      filterStudentRecords(recentRows, {
        view: "recent_signups",
        recentSignupWindow: { mode: "all" },
      }).map((r) => r.id),
    ).toEqual(["old", "new"])
  })
})

describe("resolveRecentSignupWindow", () => {
  it("defaults to 30 days", () => {
    expect(resolveRecentSignupWindow({})).toEqual({ mode: "days", days: 30 })
  })

  it("accepts all and custom ymd bounds", () => {
    expect(resolveRecentSignupWindow({ days: "all" })).toEqual({ mode: "all" })
    const window = resolveRecentSignupWindow({ from: "2026-11-01", to: "2026-11-30" })
    expect(window.mode).toBe("range")
    if (window.mode === "range") {
      expect(matchesRecentSignupWindow(row({ created_at: "2026-11-15T12:00:00" }), window)).toBe(true)
      expect(matchesRecentSignupWindow(row({ created_at: "2026-10-31T12:00:00" }), window)).toBe(false)
    }
  })
})

describe("sortStudentRecords", () => {
  it("sorts by soonest test date", () => {
    const rows = [
      row({ id: "a", days_to_test: 40 }),
      row({ id: "b", days_to_test: 10 }),
      row({ id: "c", days_to_test: null }),
    ]
    expect(sortStudentRecords(rows, "test_date").map((r) => r.id)).toEqual(["b", "a", "c"])
  })

  it("sorts by largest score gain", () => {
    const rows = [
      row({ id: "a", score_delta: 2 }),
      row({ id: "b", score_delta: 10 }),
      row({ id: "c", score_delta: null }),
    ]
    expect(sortStudentRecords(rows, "score_gain").map((r) => r.id)).toEqual(["b", "a", "c"])
  })
})

describe("filterStudentRecords activity bands", () => {
  const rows = [
    row({ id: "h", activity_band: "high", days_inactive: 1 }),
    row({ id: "m", activity_band: "medium", days_inactive: 5 }),
    row({ id: "l", activity_band: "dormant", days_inactive: 10 }),
    row({ id: "d", activity_band: "dormant", days_inactive: 20 }),
    row({ id: "n", activity_band: "dormant", days_inactive: null }),
  ]

  it("filters low as dormant under 14 days", () => {
    expect(filterStudentRecords(rows, { activity: "low" }).map((r) => r.id)).toEqual(["l"])
  })

  it("filters dormant as 14+ days or never active", () => {
    expect(filterStudentRecords(rows, { activity: "dormant" }).map((r) => r.id)).toEqual(["d", "n"])
  })
})

describe("monthlyEquivalentUsd", () => {
  it("maps plan labels", () => {
    expect(monthlyEquivalentUsd("6 mo")).toBe(59)
    expect(monthlyEquivalentUsd("Free")).toBe(0)
  })
})
