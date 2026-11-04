import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AnalyticsInsightsFreePreview } from "./analytics-insights-free-preview"

describe("AnalyticsInsightsFreePreview", () => {
  it("shows empty blurred metric skeletons with no numeric data behind", () => {
    render(<AnalyticsInsightsFreePreview variant="overview" onLockedAction={() => undefined} />)

    expect(screen.getByTestId("analytics-insights-free-preview")).toHaveAttribute(
      "data-variant",
      "overview",
    )
    expect(screen.getByText("Best Score")).toBeInTheDocument()
    expect(screen.getByText("Average Score")).toBeInTheDocument()
    expect(screen.getByText("Test Performance History")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Unlock Analytics" })).toBeInTheDocument()

    const skeletons = screen.getAllByTestId("locked-metric-skeleton")
    expect(skeletons.length).toBeGreaterThan(6)
    for (const skeleton of skeletons) {
      expect(skeleton.className).toMatch(/blur-\[7px\]/)
      expect(skeleton.textContent).toBe("")
    }

    expect(screen.queryByText("170")).not.toBeInTheDocument()
    expect(screen.queryByText("64%")).not.toBeInTheDocument()
  })

  it("opens the locked-content modal from banner and blurred content", async () => {
    const user = userEvent.setup()
    const onLockedAction = vi.fn()
    render(<AnalyticsInsightsFreePreview variant="drills" onLockedAction={onLockedAction} />)

    await user.click(screen.getByRole("button", { name: "Unlock Analytics" }))
    expect(onLockedAction).toHaveBeenCalledTimes(1)

    onLockedAction.mockClear()
    await user.click(screen.getByRole("button", { name: "Unlock Drills analytics" }))
    expect(onLockedAction).toHaveBeenCalledTimes(1)
  })
})
