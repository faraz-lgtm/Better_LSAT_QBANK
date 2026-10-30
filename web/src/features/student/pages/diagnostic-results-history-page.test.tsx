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

  it("shows Mini history above Full Section history on one page", () => {
    render(
      <MemoryRouter>
        <DiagnosticResultsHistoryPage />
      </MemoryRouter>,
    )
    const miniHeading = screen.getByRole("heading", { name: "Mini History" })
    const fullHeading = screen.getByRole("heading", { name: "Full Section History" })
    expect(miniHeading.compareDocumentPosition(fullHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText(/No Mini diagnostics yet/i)).toBeInTheDocument()
    expect(screen.getByText(/No Full Section diagnostics yet/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start Mini" })).toHaveAttribute(
      "href",
      "/diagnostic/start?intent=mini",
    )
    expect(screen.getByRole("link", { name: "Start Full Section" })).toHaveAttribute(
      "href",
      "/diagnostic/start?intent=quick",
    )
  })

  it("lists Full Section attempts and links to the attempt detail", () => {
    const saved = writeGuestDiagnosticResult(buildDefaultGuestDiagnosticResult("quick"))
    render(
      <MemoryRouter>
        <DiagnosticResultsHistoryPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole("heading", { name: "Full Section History" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Full Section #1/i })).toHaveAttribute(
      "href",
      `/app/diagnostic/results/full/${saved.id}`,
    )
  })
})
