import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"

describe("PracticeSessionFinishMenu", () => {
  it("opens submit and exit options when Finish is clicked", async () => {
    const user = userEvent.setup()
    const onSubmitSection = vi.fn()
    const onExit = vi.fn()

    render(
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

    render(
      <PracticeSessionFinishMenu onSubmitSection={vi.fn()} onExit={vi.fn()} />,
    )

    await user.click(screen.getByRole("button", { name: /finish/i }))
    expect(document.documentElement.classList.contains("practice-finish-menu-open")).toBe(true)

    await user.keyboard("{Escape}")
    expect(document.documentElement.classList.contains("practice-finish-menu-open")).toBe(false)
  })

  it("renders the Figma dots-circle icon for the exam more trigger", () => {
    render(
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

    render(
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
    expect(screen.getByText("Official Interface")).toBeInTheDocument()
    expect(document.documentElement.classList.contains("practice-exam-more-open")).toBe(true)
    expect(screen.getByRole("button", { name: "Submit" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-finish/sent-fast.svg",
    )

    await user.click(screen.getByRole("button", { name: "Save and exit" }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(document.documentElement.classList.contains("practice-exam-more-open")).toBe(false)
  })

  it("enables Official Interface and reports the toggle change", async () => {
    const user = userEvent.setup()
    const onOfficialInterfaceChange = vi.fn()

    render(
      <PracticeSessionFinishMenu
        iconTrigger
        officialInterface={false}
        onOfficialInterfaceChange={onOfficialInterfaceChange}
        onSubmitSection={vi.fn()}
        onExit={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "More options" }))
    const toggle = screen.getByRole("switch", { name: "Official Interface" })
    expect(toggle).toHaveAttribute("aria-checked", "false")
    expect(toggle.querySelector("img")).toHaveAttribute("src", "/figma/exam-finish/toggle-off.svg")

    await user.click(toggle)
    expect(onOfficialInterfaceChange).toHaveBeenCalledWith(true)
  })
})
