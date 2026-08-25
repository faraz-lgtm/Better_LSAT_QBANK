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
  it("matches the premium menu, unlocks limited Prep Course, and locks other Academy / Insights items", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/app")
    expect(screen.getByRole("link", { name: "Diagnostic" })).toHaveAttribute("href", "/intent")
    expect(screen.getByRole("button", { name: /Diagnostic Results/i })).toBeInTheDocument()

    expect(screen.getByRole("button", { name: "Prep Course" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Prep Course (locked)" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Explanations (locked)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Blind Review (locked)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Analytics (locked)" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Drills (locked)" })).toHaveLength(2)
    expect(screen.getAllByRole("button", { name: "Sections (locked)" })).toHaveLength(2)
    expect(screen.getAllByRole("button", { name: "PrepTest (locked)" })).toHaveLength(2)

    expect(screen.queryByRole("button", { name: /Practice Exams/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Question Bank/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Upgrade to LSAT\+/i })).toBeInTheDocument()
  })

  it("opens the locked-content popup for locked items", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestPricingModalProvider>
          <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
        </GuestPricingModalProvider>
        <PathProbe />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Explanations (locked)" }))
    expect(screen.getByRole("dialog", { name: "Subscriber-Only Content" })).toBeInTheDocument()
    expect(screen.getByTestId("path")).toHaveTextContent("/app")
  })

  it("lets free students open LSAT Essential Course and locks other prep courses", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestPricingModalProvider>
          <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
        </GuestPricingModalProvider>
        <PathProbe />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Prep Course" }))
    expect(screen.getByRole("link", { name: "LSAT Essential Course" })).toHaveAttribute(
      "href",
      "/app/prep-course/betterlsat-core-syllabus-structure-content",
    )

    await user.click(screen.getByRole("button", { name: "LR Mastery Course (locked)" }))
    expect(screen.getByRole("dialog", { name: "Subscriber-Only Content" })).toBeInTheDocument()
    expect(screen.getByTestId("path")).toHaveTextContent("/app")
  })

  it("still expands Diagnostic Results to Mini and Full", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /Diagnostic Results/i }))
    expect(screen.getByRole("link", { name: "Mini" })).toHaveAttribute(
      "href",
      "/app/diagnostic/results/mini",
    )
    expect(screen.getByRole("link", { name: "Full" })).toHaveAttribute(
      "href",
      "/app/diagnostic/results/full",
    )
  })

  it("hides the upgrade card markup class when collapsed styles apply", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(container.querySelector(".guest-free-plan-upgrade-card")).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    expect(container.querySelector(".student-sidebar")).toHaveClass("student-sidebar--collapsed")
    expect(screen.getByRole("button", { name: "Prep Course" })).toBeInTheDocument()
  })
})
