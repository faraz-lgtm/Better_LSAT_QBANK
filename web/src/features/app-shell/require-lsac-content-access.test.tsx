import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { RequireLsacContentAccess } from "@/features/app-shell/require-lsac-content-access"

const entitlement = vi.hoisted(() => ({
  loading: true,
  canAccessLsacContent: false,
  isPaymentRequired: false,
}))

vi.mock("@/features/app-shell/student-entitlement-context", () => ({
  isLsacContentPath: (pathname: string) =>
    pathname.startsWith("/app/learn") ||
    pathname.startsWith("/app/preptest") ||
    pathname.startsWith("/app/practice/drills") ||
    pathname.startsWith("/app/practice/sections"),
  useStudentEntitlement: () => entitlement,
}))

describe("RequireLsacContentAccess", () => {
  it("renders the page while entitlement is still loading", () => {
    entitlement.loading = true
    entitlement.canAccessLsacContent = false
    entitlement.isPaymentRequired = false

    render(
      <MemoryRouter initialEntries={["/app/learn/explanations"]}>
        <Routes>
          <Route
            path="/app/learn/explanations"
            element={
              <RequireLsacContentAccess>
                <div>Explanations page</div>
              </RequireLsacContentAccess>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Explanations page")).toBeInTheDocument()
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument()
  })

  it("redirects away from LSAC pages when entitlement denies access", () => {
    entitlement.loading = false
    entitlement.canAccessLsacContent = false
    entitlement.isPaymentRequired = false

    render(
      <MemoryRouter initialEntries={["/app/learn/explanations"]}>
        <Routes>
          <Route path="/app" element={<div>Dashboard</div>} />
          <Route
            path="/app/learn/explanations"
            element={
              <RequireLsacContentAccess>
                <div>Explanations page</div>
              </RequireLsacContentAccess>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("allows free-plan users to browse PrepTest routes", () => {
    entitlement.loading = false
    entitlement.canAccessLsacContent = false
    entitlement.isPaymentRequired = true

    render(
      <MemoryRouter initialEntries={["/app/preptest"]}>
        <Routes>
          <Route path="/app" element={<div>Dashboard</div>} />
          <Route
            path="/app/preptest"
            element={
              <RequireLsacContentAccess>
                <div>PrepTest list</div>
              </RequireLsacContentAccess>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("PrepTest list")).toBeInTheDocument()
  })

  it("allows free-plan users to browse Academy Explanations list", () => {
    entitlement.loading = false
    entitlement.canAccessLsacContent = false
    entitlement.isPaymentRequired = true

    render(
      <MemoryRouter initialEntries={["/app/learn/explanations"]}>
        <Routes>
          <Route path="/app" element={<div>Dashboard</div>} />
          <Route
            path="/app/learn/explanations"
            element={
              <RequireLsacContentAccess>
                <div>Explanations list</div>
              </RequireLsacContentAccess>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Explanations list")).toBeInTheDocument()
  })

  it("still redirects free-plan users away from explanation detail routes", () => {
    entitlement.loading = false
    entitlement.canAccessLsacContent = false
    entitlement.isPaymentRequired = true

    render(
      <MemoryRouter initialEntries={["/app/learn/explanations/q/q1"]}>
        <Routes>
          <Route path="/app" element={<div>Dashboard</div>} />
          <Route
            path="/app/learn/explanations/q/:questionId"
            element={
              <RequireLsacContentAccess>
                <div>Explanation detail</div>
              </RequireLsacContentAccess>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("allows free-plan users to browse Prep Drills list", () => {
    entitlement.loading = false
    entitlement.canAccessLsacContent = false
    entitlement.isPaymentRequired = true

    render(
      <MemoryRouter initialEntries={["/app/practice/drills"]}>
        <Routes>
          <Route path="/app" element={<div>Dashboard</div>} />
          <Route
            path="/app/practice/drills"
            element={
              <RequireLsacContentAccess>
                <div>Drills list</div>
              </RequireLsacContentAccess>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Drills list")).toBeInTheDocument()
  })

  it("still redirects free-plan users away from drill config routes", () => {
    entitlement.loading = false
    entitlement.canAccessLsacContent = false
    entitlement.isPaymentRequired = true

    render(
      <MemoryRouter initialEntries={["/app/practice/drills/lr/new"]}>
        <Routes>
          <Route path="/app" element={<div>Dashboard</div>} />
          <Route
            path="/app/practice/drills/lr/new"
            element={
              <RequireLsacContentAccess>
                <div>LR drill config</div>
              </RequireLsacContentAccess>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("allows free-plan users to browse Prep Sections list", () => {
    entitlement.loading = false
    entitlement.canAccessLsacContent = false
    entitlement.isPaymentRequired = true

    render(
      <MemoryRouter initialEntries={["/app/practice/sections"]}>
        <Routes>
          <Route path="/app" element={<div>Dashboard</div>} />
          <Route
            path="/app/practice/sections"
            element={
              <RequireLsacContentAccess>
                <div>Sections list</div>
              </RequireLsacContentAccess>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Sections list")).toBeInTheDocument()
  })

  it("still redirects free-plan users away from section session routes", () => {
    entitlement.loading = false
    entitlement.canAccessLsacContent = false
    entitlement.isPaymentRequired = true

    render(
      <MemoryRouter initialEntries={["/app/practice/sections/session/abc"]}>
        <Routes>
          <Route path="/app" element={<div>Dashboard</div>} />
          <Route
            path="/app/practice/sections/session/:sessionId"
            element={
              <RequireLsacContentAccess>
                <div>Section session</div>
              </RequireLsacContentAccess>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })
})
