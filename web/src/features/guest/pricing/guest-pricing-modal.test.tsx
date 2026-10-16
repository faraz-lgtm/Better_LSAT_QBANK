import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal"

describe("GuestPricingModal", () => {
  it("defaults to including LSAC and excludes it when the existing PrepPlus checkbox is checked", async () => {
    const user = userEvent.setup()
    const onSelectPlan = vi.fn()

    render(<GuestPricingModal open onOpenChange={vi.fn()} onSelectPlan={onSelectPlan} />)

    const existingLsacCheckbox = screen.getByRole("checkbox", {
      name: /i already have lsac prepplus to link/i,
    })
    expect(existingLsacCheckbox).not.toBeChecked()
    expect(
      screen.getByText(/LawHub Advantage \(\$124\/year\) is billed once today/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/\$478 due today \(incl\. \$124 LawHub Advantage\)/i)).toBeInTheDocument()

    await user.click(existingLsacCheckbox)

    expect(existingLsacCheckbox).toBeChecked()
    expect(screen.getByText(/LawHub PrepPlus is billed separately through LSAC/i)).toBeInTheDocument()
    expect(screen.queryByText(/\$478 due today/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Need LawHub PrepPlus included\? View standard pricing/i }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /Need LawHub PrepPlus included\? View standard pricing/i }),
    )
    expect(existingLsacCheckbox).not.toBeChecked()
    expect(
      screen.getByRole("button", {
        name: /I already have LawHub PrepPlus — Pay for BetterLSAT Only/i,
      }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", {
        name: /I already have LawHub PrepPlus — Pay for BetterLSAT Only/i,
      }),
    )
    expect(existingLsacCheckbox).toBeChecked()

    await user.click(screen.getByRole("button", { name: /Choose Monthly/i }))

    expect(onSelectPlan).toHaveBeenCalledWith("monthly", { includeLawHub: false })
  })
})
