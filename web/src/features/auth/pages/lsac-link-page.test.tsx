import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { LsacLinkPage } from "./lsac-link-page"

vi.mock("@/lib/auth/log-route-redirect", () => ({
  logRouteRedirect: vi.fn(),
}))

describe("LsacLinkPage", () => {
  it("redirects legacy /app/lsac-link to /app/lsac-link-step preserving query", async () => {
    render(
      <MemoryRouter initialEntries={["/app/lsac-link?checkout=success"]}>
        <Routes>
          <Route path="/app/lsac-link" element={<LsacLinkPage />} />
          <Route path="/app/lsac-link-step" element={<div>Link step</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("Link step")).toBeInTheDocument()
    })
  })
})
