import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StudentMain } from "./student-main"

describe("StudentMain", () => {
  it("caps the default page container at 1168px", () => {
    render(
      <StudentMain>
        <p>Contained</p>
      </StudentMain>,
    )

    const inner = screen.getByText("Contained").parentElement
    expect(inner?.className).toContain("max-w-[1168px]")
  })

  it("hides the LSAC license banner by default", () => {
    render(
      <StudentMain>
        <p>Contained</p>
      </StudentMain>,
    )

    expect(screen.queryByTestId("lsac-license-banner")).not.toBeInTheDocument()
  })

  it("shows the LSAC license banner when showLsacLicenseBanner is set", () => {
    render(
      <StudentMain showLsacLicenseBanner>
        <p>Contained</p>
      </StudentMain>,
    )

    expect(screen.getByTestId("lsac-license-banner")).toBeInTheDocument()
    expect(screen.getByText("Official LSAC licensed prep")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "About our license" })).toHaveAttribute(
      "href",
      "https://www.lsac.org/",
    )
  })

  it("does not cap immersive layout", () => {
    render(
      <StudentMain layout="immersive">
        <p>Immersive</p>
      </StudentMain>,
    )

    const inner = screen.getByText("Immersive").parentElement
    expect(inner?.className).not.toContain("max-w-[1168px]")
    expect(screen.queryByTestId("lsac-license-banner")).not.toBeInTheDocument()
  })

  it("does not cap fullBleed layout so a 3-col shell can size the center pane", () => {
    render(
      <StudentMain layout="locked" fullBleed>
        <p>Full bleed</p>
      </StudentMain>,
    )

    const inner = screen.getByText("Full bleed").parentElement
    expect(inner?.className).not.toContain("max-w-[1168px]")
    expect(screen.queryByTestId("lsac-license-banner")).not.toBeInTheDocument()
  })
})
