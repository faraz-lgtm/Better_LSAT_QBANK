import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, useLocation } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { GuestFreePlanSidebar } from "@/features/guest/diagnostic/guest-free-plan-sidebar"
import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signOut: vi.fn() },
  }),
}))

function PathProbe() {
  const { pathname } = useLocation()
  return <div data-testid="path">{pathname}</div>
}

describe("GuestFreePlanSidebar", () => {
  it("matches the premium menu, unlocks Prep / Insights browse / tutoring, and keeps Book Sessions above My Sessions", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/app")
    expect(screen.getByRole("link", { name: "Diagnostic Test" })).toHaveAttribute("href", "/intent")
    expect(screen.getByRole("link", { name: /Diagnostic Results/i })).toHaveAttribute(
      "href",
      "/app/diagnostic/results",
    )

    expect(screen.getByRole("button", { name: "Prep Courses" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Prep Courses (locked)" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Explanations" })).toHaveAttribute("href", "/app/learn/explanations")
    expect(screen.queryByRole("button", { name: "Explanations (locked)" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Untimed Review (locked)" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/app/analytics")
    expect(
      screen.getAllByRole("link", { name: "Drills" }).some((el) => el.getAttribute("href") === "/app/practice/drills"),
    ).toBe(true)
    expect(
      screen.getAllByRole("link", { name: "Drills" }).some((el) => el.getAttribute("href") === "/app/analytics/drills"),
    ).toBe(true)
    expect(
      screen.getAllByRole("link", { name: "Sections" }).some((el) => el.getAttribute("href") === "/app/analytics/sections"),
    ).toBe(true)
    expect(
      screen.getAllByRole("link", { name: "PrepTest" }).some((el) => el.getAttribute("href") === "/app/preptest"),
    ).toBe(true)
    expect(
      screen
        .getAllByRole("link", { name: "PrepTest" })
        .some((el) => el.getAttribute("href") === "/app/analytics/preptests"),
    ).toBe(true)
    expect(screen.getByRole("link", { name: "Free Strategy Call" })).toHaveAttribute(
      "href",
      "/app/free-strategy-call",
    )
    expect(screen.getByText("TUTORING")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Book 1 on 1 Sessions" })).toHaveAttribute(
      "href",
      "/app/tutoring/book",
    )
    expect(screen.getByRole("link", { name: "My Sessions" })).toHaveAttribute(
      "href",
      "/app/tutoring/sessions",
    )
    expect(screen.getByRole("link", { name: "Live Classes" })).toHaveAttribute(
      "href",
      "/app/tutoring/live-classes",
    )
    const bookSessions = screen.getByRole("link", { name: "Book 1 on 1 Sessions" })
    const mySessions = screen.getByRole("link", { name: "My Sessions" })
    expect(
      bookSessions.compareDocumentPosition(mySessions) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Free Strategy Call (locked)" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Book 1 on 1 Sessions (locked)" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "My Sessions (locked)" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Feedback" })).toHaveAttribute("href", "/app/feedback")
    expect(screen.getByRole("link", { name: "Roadmap" })).toHaveAttribute("href", "/app/roadmap")
    expect(screen.queryByRole("button", { name: "Feedback (locked)" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Roadmap (locked)" })).not.toBeInTheDocument()

    expect(screen.queryByRole("button", { name: /Practice Exams/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Question Bank/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeInTheDocument()
    expect(screen.getByText("Unlock Analytics")).toBeInTheDocument()
    expect(
      screen.getByText("Track weak areas, trends, and score progress."),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Free plan/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /\$79/ })).not.toBeInTheDocument()
  })

  it("lets free students navigate Insights browse routes (locks stay in-page)", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestPricingModalProvider>
          <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
        </GuestPricingModalProvider>
        <PathProbe />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("link", { name: "Overview" }))
    expect(screen.getByTestId("path")).toHaveTextContent("/app/analytics")
  })

  it("lets free students open LSAT Essentials from Prep Courses", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestPricingModalProvider>
          <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
        </GuestPricingModalProvider>
        <PathProbe />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Prep Courses" }))
    expect(screen.getByRole("link", { name: "LSAT Essentials Course" })).toHaveAttribute(
      "href",
      "/app/prep-course/betterlsat-core-syllabus-structure-content",
    )

    expect(screen.queryByRole("link", { name: "LR Mastery Course" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "RC Mastery Course" })).not.toBeInTheDocument()
    expect(screen.getByTestId("path")).toHaveTextContent("/app")
  })

  it("links Diagnostic Results to the combined history page without a dropdown", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: /Diagnostic Results/i })).toHaveAttribute(
      "href",
      "/app/diagnostic/results",
    )
    expect(screen.queryByRole("link", { name: "Mini" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Full Section" })).not.toBeInTheDocument()
  })

  it("hides the upgrade card markup class when collapsed styles apply", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(container.querySelector(".guest-free-plan-upgrade-card")).toBeTruthy()
    expect(container.querySelector(".student-sidebar-nav")?.contains(
      container.querySelector(".guest-free-plan-upgrade-card"),
    )).toBe(true)
    expect(container.querySelector(".student-sidebar-footer")?.contains(
      container.querySelector(".guest-free-plan-upgrade-card"),
    )).toBe(false)

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    expect(container.querySelector(".student-sidebar")).toHaveClass("student-sidebar--collapsed")
    expect(screen.getByRole("button", { name: "Prep Courses" })).toBeInTheDocument()
  })
})
