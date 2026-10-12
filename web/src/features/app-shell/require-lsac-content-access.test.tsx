import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { RequireLsacContentAccess } from "@/features/app-shell/require-lsac-content-access"

const entitlement = vi.hoisted(() => ({
  loading: true,
  canAccessLsacContent: false,
}))

vi.mock("@/features/app-shell/student-entitlement-context", () => ({
  isLsacContentPath: (pathname: string) => pathname.startsWith("/app/learn"),
  useStudentEntitlement: () => entitlement,
}))

describe("RequireLsacContentAccess", () => {
  it("renders the page while entitlement is still loading", () => {
    entitlement.loading = true
    entitlement.canAccessLsacContent = false

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
})
