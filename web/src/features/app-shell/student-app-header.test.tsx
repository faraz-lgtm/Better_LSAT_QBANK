import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import {
  formatHeaderProfileName,
  StudentAppHeader,
} from "@/features/app-shell/student-app-header"

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: "assad@acelebrands.co" } },
      }),
      signOut: vi.fn(),
    },
  }),
}))

vi.mock("@/lib/api/users", () => ({
  createUsersApi: () => ({
    getMyProfile: vi.fn().mockResolvedValue({
      first_name: "Assad",
      last_name: "Khan",
      full_name: "Assad Khan",
    }),
  }),
}))

describe("formatHeaderProfileName", () => {
  it("uses first name and last initial", () => {
    expect(
      formatHeaderProfileName({
        firstName: "Masud",
        lastName: "Holt",
        fullName: "Masud Holt",
        email: "masud.holt@example.com",
      }),
    ).toBe("Masud H.")
  })

  it("falls back to the email local part", () => {
    expect(
      formatHeaderProfileName({
        firstName: "",
        lastName: "",
        fullName: "",
        email: "assad@acelebrands.co",
      }),
    ).toBe("Assad")
  })
})

describe("StudentAppHeader", () => {
  it("renders the premium dashboard header from Figma 19956:63585", async () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <StudentAppHeader onOpenMobileNav={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByText("Main")).toBeInTheDocument()
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Notifications" })).not.toBeInTheDocument()
    expect(screen.getByLabelText("Plan: Premium")).toHaveTextContent("Premium")
    expect(screen.getByRole("banner").firstElementChild?.className).toMatch(/max-w-\[1168px\]/)

    await waitFor(() => {
      expect(screen.getByText("Assad K.")).toBeInTheDocument()
    })
    expect(screen.getByText("assad@acelebrands.co")).toBeInTheDocument()
  })

  it("keeps non-dashboard breadcrumbs and the profile menu", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app/practice/drills"]}>
        <StudentAppHeader onOpenMobileNav={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByText("Prep")).toBeInTheDocument()
    expect(screen.getByText("Drills")).toBeInTheDocument()
    expect(screen.queryByText("Main")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Open profile menu" }))
    expect(screen.getByRole("link", { name: "Account" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument()
  })
})
