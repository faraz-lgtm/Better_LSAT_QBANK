import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FreeStrategyCallPage } from "@/features/tutoring/pages/free-strategy-call-page"
import {
  BOOKING_PAGE_SRC,
  BOOKING_WIDGET_ID,
} from "@/features/tutoring/components/strategy-call-scheduler"

vi.mock("@/features/student/components/student-main", () => ({
  StudentMain: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("FreeStrategyCallPage", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it("renders Figma hero and always-on Amelia booking embed with no packages or testimonials", () => {
    render(<FreeStrategyCallPage />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Free 15-Minute Strategy Call" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Book your FREE Call with a 175+ Scorer" }),
    ).toBeInTheDocument()
    expect(screen.getByText("✓ 175+ Scoring Tutors")).toBeInTheDocument()
    expect(screen.getByText("200+ Students Tutored")).toBeInTheDocument()

    const iframe = screen.getByTitle("FREE LSAT Strategy Call booking")
    expect(iframe).toHaveAttribute("src", BOOKING_PAGE_SRC)
    expect(iframe).toHaveAttribute("id", BOOKING_WIDGET_ID)
    expect(screen.getByTestId("strategy-call-amelia-scheduler")).toBeInTheDocument()

    expect(screen.queryByRole("heading", { name: "Choose Your Tutoring Package" })).not.toBeInTheDocument()
    expect(screen.queryByText("5-Session Pack")).not.toBeInTheDocument()
  })

  it("scrolls to the Amelia booking iframe from the hero CTA", async () => {
    const user = userEvent.setup()
    render(<FreeStrategyCallPage />)

    await user.click(screen.getByRole("button", { name: "Book your FREE Call with a 175+ Scorer" }))

    await vi.waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })
  })
})
