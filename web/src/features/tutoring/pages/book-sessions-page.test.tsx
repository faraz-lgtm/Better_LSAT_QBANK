import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BookSessionsPage } from "@/features/tutoring/pages/book-sessions-page"
import {
  BOOKING_WIDGET_ID,
  BOOKING_WIDGET_SRC,
} from "@/features/tutoring/components/strategy-call-scheduler"

vi.mock("@/features/student/components/student-main", () => ({
  StudentMain: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/features/tutoring/components/package-booking-modal", () => ({
  PackageBookingModal: () => null,
}))

describe("BookSessionsPage", () => {
  beforeEach(() => {
    document.getElementById("ghl-booking-form-embed")?.remove()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it("renders the Figma Book Sessions layout with booking summary collapsed", () => {
    render(<BookSessionsPage />)

    expect(screen.getByRole("heading", { level: 1, name: "My Sessions" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Book Your Free 15-Minute Call" }),
    ).toBeInTheDocument()

    expect(screen.getByRole("heading", { name: "FREE LSAT Strategy Call" })).toBeInTheDocument()
    expect(screen.getByText("Pick a time that works")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "See available times" })).toBeInTheDocument()
    expect(screen.queryByTitle("FREE LSAT Strategy Call booking")).not.toBeInTheDocument()
    expect(screen.getByTestId("strategy-call-ghl-scheduler")).toHaveAttribute(
      "data-calendar-open",
      "false",
    )

    expect(screen.getByRole("heading", { name: "Choose Your Tutoring Package" })).toBeInTheDocument()
    expect(screen.getByText("5-Session Pack")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "What students say about BetterLSAT tutoring" }),
    ).toBeInTheDocument()
  })

  it("opens the live GHL iframe from the hero CTA and loads form_embed.js", async () => {
    const user = userEvent.setup()
    render(<BookSessionsPage />)

    await user.click(screen.getByRole("button", { name: "Book Your Free 15-Minute Call" }))

    const iframe = screen.getByTitle("FREE LSAT Strategy Call booking")
    expect(iframe).toHaveAttribute("src", BOOKING_WIDGET_SRC)
    expect(iframe).toHaveAttribute("id", BOOKING_WIDGET_ID)
    expect(screen.getByTestId("strategy-call-ghl-scheduler")).toHaveAttribute(
      "data-calendar-open",
      "true",
    )

    const embed = document.getElementById("ghl-booking-form-embed") as HTMLScriptElement | null
    expect(embed).toBeTruthy()
    expect(embed?.src).toContain("booking.betterlsat.com/js/form_embed.js")

    await vi.waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })
  })

  it("opens the GHL calendar from See available times", async () => {
    const user = userEvent.setup()
    render(<BookSessionsPage />)

    await user.click(screen.getByRole("button", { name: "See available times" }))

    expect(screen.getByTitle("FREE LSAT Strategy Call booking")).toHaveAttribute(
      "src",
      BOOKING_WIDGET_SRC,
    )
  })

  it("collapses the calendar from the close control", async () => {
    const user = userEvent.setup()
    render(<BookSessionsPage />)

    await user.click(screen.getByRole("button", { name: "See available times" }))
    expect(screen.getByTitle("FREE LSAT Strategy Call booking")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close booking calendar" }))

    expect(screen.queryByTitle("FREE LSAT Strategy Call booking")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "See available times" })).toBeInTheDocument()
    expect(screen.getByTestId("strategy-call-ghl-scheduler")).toHaveAttribute(
      "data-calendar-open",
      "false",
    )
  })
})
