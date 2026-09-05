import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"
import { ThemeProvider, THEME_STORAGE_KEY } from "@/features/theme/theme-provider"

function renderWithTheme(ui: ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe("PracticeSessionFinishMenu", () => {
  beforeEach(() => {
    window.localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.classList.remove("dark")
  })

  afterEach(() => {
    window.localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.classList.remove("dark")
  })

  it("opens submit and exit options when Finish is clicked", async () => {
    const user = userEvent.setup()
    const onSubmitSection = vi.fn()
    const onExit = vi.fn()

    renderWithTheme(
      <PracticeSessionFinishMenu onSubmitSection={onSubmitSection} onExit={onExit} />,
    )

    expect(screen.queryByRole("menuitem", { name: "Submit Section" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /finish/i }))

    expect(screen.getByRole("menuitem", { name: "Submit Section" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Save & Exit" })).toBeInTheDocument()
    expect(document.documentElement.classList.contains("practice-finish-menu-open")).toBe(true)
  })

  it("clears the finish-menu-open class when the menu closes", async () => {
    const user = userEvent.setup()

    renderWithTheme(
      <PracticeSessionFinishMenu onSubmitSection={vi.fn()} onExit={vi.fn()} />,
    )

    await user.click(screen.getByRole("button", { name: /finish/i }))
    expect(document.documentElement.classList.contains("practice-finish-menu-open")).toBe(true)

    await user.keyboard("{Escape}")
    expect(document.documentElement.classList.contains("practice-finish-menu-open")).toBe(false)
  })

  it("renders the Figma dots-circle icon for the exam more trigger", () => {
    renderWithTheme(
      <PracticeSessionFinishMenu iconTrigger onSubmitSection={vi.fn()} onExit={vi.fn()} />,
    )

    expect(screen.getByRole("button", { name: "More options" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-header/dots-circle.svg",
    )
  })

  it("opens the Figma exam more panel and hides the side widget class", async () => {
    const user = userEvent.setup()
    const onSubmitSection = vi.fn()
    const onExit = vi.fn()
    const onExitWithoutSaving = vi.fn()

    renderWithTheme(
      <PracticeSessionFinishMenu
        iconTrigger
        onSubmitSection={onSubmitSection}
        onExit={onExit}
        onExitWithoutSaving={onExitWithoutSaving}
      />,
    )

    await user.click(screen.getByRole("button", { name: "More options" }))

    expect(screen.getByRole("dialog", { name: "More options" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save and exit" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Exit without saving" })).toBeInTheDocument()
    expect(screen.getByText("Dark mode")).toBeInTheDocument()
    expect(screen.getByText("BetterLSAT Interface")).toBeInTheDocument()
    expect(document.documentElement.classList.contains("practice-exam-more-open")).toBe(true)
    expect(screen.getByRole("button", { name: "Submit" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-finish/sent-fast.svg",
    )

    await user.click(screen.getByRole("button", { name: "Save and exit" }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(document.documentElement.classList.contains("practice-exam-more-open")).toBe(false)
  })

  it("opts into BetterLSAT Interface and reports official off", async () => {
    const user = userEvent.setup()
    const onOfficialInterfaceChange = vi.fn()

    renderWithTheme(
      <PracticeSessionFinishMenu
        iconTrigger
        officialInterface={true}
        onOfficialInterfaceChange={onOfficialInterfaceChange}
        onSubmitSection={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "More options" }))
    const toggle = screen.getByRole("switch", { name: "BetterLSAT Interface" })
    expect(toggle).toHaveAttribute("aria-checked", "false")
    expect(toggle.querySelector("img")).toHaveAttribute("src", "/figma/exam-finish/toggle-off.svg")

    await user.click(toggle)
    expect(onOfficialInterfaceChange).toHaveBeenCalledWith(false)
  })

  it("toggles dark mode through ThemeProvider", async () => {
    const user = userEvent.setup()

    renderWithTheme(
      <PracticeSessionFinishMenu iconTrigger onSubmitSection={vi.fn()} onExit={vi.fn()} />,
    )

    await user.click(screen.getByRole("button", { name: "More options" }))
    const darkToggle = screen.getByRole("switch", { name: "Dark mode" })
    expect(darkToggle).toHaveAttribute("aria-checked", "false")

    await user.click(darkToggle)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    expect(darkToggle).toHaveAttribute("aria-checked", "true")

    await user.click(darkToggle)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
  })
})
