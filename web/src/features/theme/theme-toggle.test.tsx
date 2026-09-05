import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, beforeEach, afterEach } from "vitest"

import { ThemeProvider, THEME_STORAGE_KEY } from "@/features/theme/theme-provider"
import { ThemeToggleButton, ThemeToggleSwitch } from "@/features/theme/theme-toggle"

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.classList.remove("dark")
  })

  afterEach(() => {
    window.localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.classList.remove("dark")
  })

  it("toggles dark class from the header button", async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggleButton />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument()
  })

  it("toggles dark class from the account switch", async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggleSwitch />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole("switch", { name: "Dark mode" }))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
  })
})
