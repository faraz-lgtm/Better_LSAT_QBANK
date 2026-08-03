import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PrepCourseListPage } from "./prep-course-list-page"

const listCoursesMock = vi.fn()

vi.mock("@/lib/api/prep-course", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/prep-course")>("@/lib/api/prep-course")
  return {
    ...actual,
    createPrepCourseApi: () => ({
      listCourses: listCoursesMock,
    }),
  }
})

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

describe("PrepCourseListPage", () => {
  beforeEach(() => {
    listCoursesMock.mockReset()
  })

  it("redirects to the first course when courses exist", async () => {
    listCoursesMock.mockResolvedValue([
      {
        id: "c1",
        slug: "prep-course",
        title: "Prep Course",
        description: "Foundational LSAT course.",
        is_published: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "c2",
        slug: "betterlsat-core-syllabus",
        title: "BetterLSAT Core",
        description: null,
        is_published: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ])

    render(
      <MemoryRouter initialEntries={["/app/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course" element={<PrepCourseListPage />} />
          <Route path="/app/prep-course/:courseSlug" element={<p>Course content</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("Course content")).toBeInTheDocument()
    })
  })

  it("shows empty state when no courses are available", async () => {
    listCoursesMock.mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={["/app/prep-course"]}>
        <PrepCourseListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("No courses available yet.")).toBeInTheDocument()
    })
  })
})
