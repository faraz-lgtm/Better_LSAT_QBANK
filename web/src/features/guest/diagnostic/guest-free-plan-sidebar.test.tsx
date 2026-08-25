import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, useLocation } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { GuestFreePlanSidebar } from "@/features/guest/diagnostic/guest-free-plan-sidebar"

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
  it("matches the premium menu and locks Academy, Prep, and Insights", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/app")
    expect(screen.getByRole("link", { name: "Diagnostic" })).toHaveAttribute("href", "/intent")
    expect(screen.getByRole("button", { name: /Diagnostic Results/i })).toBeInTheDocument()

    expect(screen.getByRole("button", { name: "Prep Course (locked)" })).toHaveClass(
      "student-sidebar-link--locked",
    )
    expect(screen.getByRole("button", { name: "Explanations (locked)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Blind Review (locked)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Overview (locked)" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Drills (locked)" })).toHaveLength(2)
    expect(screen.getAllByRole("button", { name: "Sections (locked)" })).toHaveLength(2)
    expect(screen.getAllByRole("button", { name: "PrepTest (locked)" })).toHaveLength(2)

    expect(screen.queryByRole("button", { name: /Practice Exams/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Question Bank/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Upgrade to LSAT\+/i })).toBeInTheDocument()
  })

  it("sends locked items to pricing", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <GuestFreePlanSidebar mobileOpen={false} onMobileClose={() => {}} />
        <PathProbe />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: "Prep Course (locked)" }))
    expect(screen.getByTestId("path")).toHaveTextContent("/app/pricing")
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
})
