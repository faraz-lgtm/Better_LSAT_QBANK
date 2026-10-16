import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"

import { buildDefaultGuestDiagnosticResult, writeGuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { DiagnosticResultsHistoryPage } from "@/features/student/pages/diagnostic-results-history-page"

describe("DiagnosticResultsHistoryPage", () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it("shows an empty Mini history state", () => {
    render(
      <MemoryRouter>
        <DiagnosticResultsHistoryPage section="mini" />
      </MemoryRouter>,
    )
    expect(screen.getByRole("heading", { name: "Mini History" })).toBeInTheDocument()
    expect(screen.getByText(/No Mini diagnostics yet/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start Mini" })).toHaveAttribute(
      "href",
      "/diagnostic/start?intent=mini",
    )
  })

  it("lists Full Section attempts and links to the attempt detail", () => {
    const saved = writeGuestDiagnosticResult(buildDefaultGuestDiagnosticResult("quick"))
    render(
      <MemoryRouter>
        <DiagnosticResultsHistoryPage section="full" />
      </MemoryRouter>,
    )
    expect(screen.getByRole("heading", { name: "Full Section History" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Full Section #1/i })).toHaveAttribute(
      "href",
      `/app/diagnostic/results/full/${saved.id}`,
    )
  })
})
