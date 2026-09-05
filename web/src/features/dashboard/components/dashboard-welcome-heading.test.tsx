import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import {
  DashboardWelcomeHeading,
  formatDashboardWelcomeHeading,
} from "@/features/dashboard/components/dashboard-welcome-heading"

describe("formatDashboardWelcomeHeading", () => {
  it("includes a comma before the student first name", () => {
    expect(formatDashboardWelcomeHeading("Daniyal")).toBe("Welcome back, Daniyal")
  })

  it("omits the name when it is missing", () => {
    expect(formatDashboardWelcomeHeading("  ")).toBe("Welcome back")
  })
})

describe("DashboardWelcomeHeading", () => {
  it("renders the Figma H1 welcome line", () => {
    render(<DashboardWelcomeHeading firstName="Daniyal" />)
    const heading = screen.getByRole("heading", { level: 1, name: "Welcome back, Daniyal" })
    expect(heading).toBeInTheDocument()
    expect(heading.className).toMatch(/text-\[48px\]/)
    expect(heading.className).toMatch(/text-\[var\(--color-student-heading\)\]/)
  })
})
