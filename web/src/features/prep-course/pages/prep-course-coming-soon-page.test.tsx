import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { PrepCourseComingSoonPage } from "./prep-course-coming-soon-page"

describe("PrepCourseComingSoonPage", () => {
  it("shows the course title and coming soon copy", () => {
    render(
      <MemoryRouter initialEntries={["/app/prep-course/lr-mastery-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseComingSoonPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: "LR Mastery Course" })).toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open LSAT Essential Course" })).toHaveAttribute(
      "href",
      "/app/prep-course/betterlsat-core-syllabus-structure-content",
    )
  })
})
