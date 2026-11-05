import { render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { AnalyticsInsightsFreePreview } from "./analytics-insights-free-preview"

function renderPreview(props: ComponentProps<typeof AnalyticsInsightsFreePreview>) {
  return render(
    <MemoryRouter>
      <AnalyticsInsightsFreePreview {...props} />
    </MemoryRouter>,
  )
}

describe("AnalyticsInsightsFreePreview", () => {
  it("shows overview empty-state metrics and practice CTAs for free users", () => {
    renderPreview({ variant: "overview", onLockedAction: () => undefined })

    expect(screen.getByTestId("analytics-insights-free-preview")).toHaveAttribute(
      "data-variant",
      "overview",
    )
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByText("Best Score")).toBeInTheDocument()
    expect(screen.getByText("Avg Score")).toBeInTheDocument()
    expect(screen.getByText("Logical Reasoning Mean")).toBeInTheDocument()
    expect(screen.getByText("Reading Comprehension Mean")).toBeInTheDocument()
    expect(screen.getByText("Start practicing to see your data")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Take the Diagnostic Test" })).toHaveAttribute(
      "href",
      "/intent",
    )
    expect(screen.getByRole("link", { name: "Book Your Free 15-Minute Call" })).toHaveAttribute(
      "href",
      "/app/free-strategy-call",
    )
    expect(screen.getByText("Official LSAC licensed prep")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "About our license" })).toHaveAttribute(
      "href",
      "https://www.lsac.org/",
    )

    expect(screen.queryByRole("button", { name: "Unlock Analytics" })).not.toBeInTheDocument()
    expect(screen.queryByTestId("locked-metric-skeleton")).not.toBeInTheDocument()
    expect(screen.getAllByText("---").length).toBeGreaterThanOrEqual(6)
  })

  it("shows drills empty-state metrics and practice CTAs for free users", () => {
    renderPreview({ variant: "drills", onLockedAction: () => undefined })

    expect(screen.getByTestId("analytics-insights-free-preview")).toHaveAttribute(
      "data-variant",
      "drills",
    )
    expect(screen.getByRole("heading", { name: "Drills" })).toBeInTheDocument()
    expect(screen.getByText("Drills Mean")).toBeInTheDocument()
    expect(screen.getByText("Accuracy")).toBeInTheDocument()
    expect(screen.getByText("Question Drilled")).toBeInTheDocument()
    expect(screen.getByText("Question Accuracy")).toBeInTheDocument()
    expect(screen.getByText("Start practicing to see your data")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Take the Diagnostic Test" })).toHaveAttribute(
      "href",
      "/intent",
    )
    expect(screen.getByRole("link", { name: "Book Your Free 15-Minute Call" })).toHaveAttribute(
      "href",
      "/app/free-strategy-call",
    )
    expect(screen.getByText("Official LSAC licensed prep")).toBeInTheDocument()

    expect(screen.queryByRole("button", { name: "Unlock Analytics" })).not.toBeInTheDocument()
    expect(screen.queryByTestId("locked-metric-skeleton")).not.toBeInTheDocument()
    expect(screen.getAllByText("---")).toHaveLength(4)
  })

  it("shows sections empty-state metrics and practice CTAs for free users", () => {
    renderPreview({ variant: "sections", onLockedAction: () => undefined })

    expect(screen.getByTestId("analytics-insights-free-preview")).toHaveAttribute(
      "data-variant",
      "sections",
    )
    expect(screen.getByRole("heading", { name: "Section Insights" })).toBeInTheDocument()
    expect(screen.getByText("Logical Reasoning")).toBeInTheDocument()
    expect(screen.getByText("Reading Comprehension")).toBeInTheDocument()
    expect(screen.getByText("Peak Performance")).toBeInTheDocument()
    expect(screen.getByText("Trailing Average")).toBeInTheDocument()
    expect(screen.getByText("Accuracy")).toBeInTheDocument()
    expect(screen.getByText("Momentum")).toBeInTheDocument()
    expect(screen.getByText("Start practicing to see your data")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Take the Diagnostic Test" })).toHaveAttribute(
      "href",
      "/intent",
    )
    expect(screen.getByRole("link", { name: "Book Your Free 15-Minute Call" })).toHaveAttribute(
      "href",
      "/app/free-strategy-call",
    )
    expect(screen.getByText("Official LSAC licensed prep")).toBeInTheDocument()

    expect(screen.queryByRole("button", { name: "Unlock Analytics" })).not.toBeInTheDocument()
    expect(screen.queryByTestId("locked-metric-skeleton")).not.toBeInTheDocument()
    expect(screen.getAllByText("---").length).toBeGreaterThanOrEqual(6)
  })

  it("shows preptests empty-state metrics and practice CTAs for free users", () => {
    renderPreview({ variant: "preptests", onLockedAction: () => undefined })

    expect(screen.getByTestId("analytics-insights-free-preview")).toHaveAttribute(
      "data-variant",
      "preptests",
    )
    expect(screen.getByRole("heading", { name: "PrepTest Insights" })).toBeInTheDocument()
    expect(screen.getByText("Peak Score")).toBeInTheDocument()
    expect(screen.getByText("Target Gap")).toBeInTheDocument()
    expect(screen.getByText("Score Variance")).toBeInTheDocument()
    expect(screen.getByText("Section Drop-off")).toBeInTheDocument()
    expect(screen.getByText("Start practicing to see your data")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Take the Diagnostic Test" })).toHaveAttribute(
      "href",
      "/intent",
    )
    expect(screen.getByRole("link", { name: "Book Your Free 15-Minute Call" })).toHaveAttribute(
      "href",
      "/app/free-strategy-call",
    )
    expect(screen.getByText("Official LSAC licensed prep")).toBeInTheDocument()

    expect(screen.queryByRole("button", { name: "Unlock Analytics" })).not.toBeInTheDocument()
    expect(screen.queryByTestId("locked-metric-skeleton")).not.toBeInTheDocument()
    expect(screen.getAllByText("---")).toHaveLength(4)
  })
})
