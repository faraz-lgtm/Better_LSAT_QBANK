import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GuestFreeAnalyticsLimitCta } from "@/features/guest/diagnostic/guest-upgrade-cta"

describe("GuestFreeAnalyticsLimitCta", () => {
  it("renders Figma copy, lock asset, and Full Access CTA", async () => {
    const onSubscribe = vi.fn()
    const user = userEvent.setup()

    render(<GuestFreeAnalyticsLimitCta onSubscribe={onSubscribe} />)

    expect(screen.getByText("You've reached your free analytics limit!")).toBeInTheDocument()
    expect(
      screen.getByText(
        /Subscribe today for unlimited practice results, detailed analytics, and full access to everything BetterLSAT has to offer./,
      ),
    ).toBeInTheDocument()

    const lock = document.querySelector('img[src="/figma/diagnostic/analytics-limit-lock.svg"]')
    expect(lock).toBeTruthy()
    expect(lock).toHaveAttribute("width", "36")
    expect(lock).toHaveAttribute("height", "36")

    await user.click(screen.getByRole("button", { name: "Full Access" }))
    expect(onSubscribe).toHaveBeenCalledTimes(1)
  })
})
