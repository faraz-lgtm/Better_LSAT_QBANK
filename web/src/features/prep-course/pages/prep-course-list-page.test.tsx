import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { PREP_COURSE_ESSENTIALS_SLUG } from "@/features/prep-course/lib/prep-course-nav"

import { PrepCourseListPage } from "./prep-course-list-page"

describe("PrepCourseListPage", () => {
  it("redirects to LSAT Essential Course", () => {
    render(
      <MemoryRouter initialEntries={["/app/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course" element={<PrepCourseListPage />} />
          <Route
            path="/app/prep-course/:courseSlug"
            element={<p>Course {PREP_COURSE_ESSENTIALS_SLUG}</p>}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(`Course ${PREP_COURSE_ESSENTIALS_SLUG}`)).toBeInTheDocument()
  })
})
