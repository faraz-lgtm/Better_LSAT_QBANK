import { describe, expect, it } from "vitest"

import type { ContinueDrill, SuggestedDrill } from "@/features/student/drills/drill-dashboard-mappers"

import { dashboardDrillMoreHref, pickDashboardActiveDrills } from "./pick-dashboard-drills"

function continueDrill(id: string, section: "LR" | "RC"): ContinueDrill {
  return {
    id,
    section,
    title: `${section} continue`,
    progressPct: 40,
    answered: "4/10",
    timeLabel: "10 min",
    lastAttempt: "1 day ago",
    accent: section === "LR" ? "orange" : "mint",
    difficulty: "hardest",
    difficultyBars: 5,
    difficultyColor: "#df1c41",
    continuePath: `/app/practice/drills/session/${id}`,
  }
}

function suggestedDrill(id: string, section: "LR" | "RC"): SuggestedDrill {
  return {
    id,
    section,
    title: `${section} suggested`,
    progressPct: 50,
    answered: "5/10",
    timeLabel: "—",
    lastAttempt: "2 attempts",
    accent: section === "LR" ? "orange" : "mint",
    difficulty: "medium",
    difficultyBars: 3,
    difficultyColor: "#ff6f00",
    configPath: `/app/practice/drills/${section.toLowerCase()}/new`,
  }
}

describe("pickDashboardActiveDrills", () => {
  it("keeps one in-progress LR and one in-progress RC", () => {
    const picked = pickDashboardActiveDrills(
      [continueDrill("lr-1", "LR"), continueDrill("lr-2", "LR"), continueDrill("rc-1", "RC")],
      [suggestedDrill("s-lr", "LR"), suggestedDrill("s-rc", "RC")],
      "all",
    )
    expect(picked.map((d) => d.id)).toEqual(["lr-1", "rc-1"])
  })

  it("fills a missing section from suggested drills", () => {
    const picked = pickDashboardActiveDrills(
      [continueDrill("lr-1", "LR")],
      [suggestedDrill("s-rc", "RC")],
      "all",
    )
    expect(picked).toHaveLength(2)
    expect(picked[0]?.id).toBe("lr-1")
    expect(picked[1]?.id).toBe("s-rc")
    expect(picked[1]).toMatchObject({ id: "s-rc", isSuggested: true })
  })

  it("limits the LR filter to one LR drill", () => {
    const picked = pickDashboardActiveDrills(
      [continueDrill("lr-1", "LR"), continueDrill("rc-1", "RC")],
      [],
      "lr",
    )
    expect(picked.map((d) => d.id)).toEqual(["lr-1"])
  })
})

describe("dashboardDrillMoreHref", () => {
  it("routes each section to its drill page", () => {
    expect(dashboardDrillMoreHref("LR")).toBe("/app/practice/drills/lr/new")
    expect(dashboardDrillMoreHref("RC")).toBe("/app/practice/drills/rc/new")
  })
})
