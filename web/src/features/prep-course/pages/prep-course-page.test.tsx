import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PrepCoursePage } from "./prep-course-page"

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

const publishedCourse = {
  id: "c1",
  slug: "prep-course",
  title: "LSAT Prep Course",
  description: "Full curriculum",
  is_published: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("PrepCoursePage", () => {
  beforeEach(() => {
    listCoursesMock.mockReset()
  })

  it("loads catalog from listCourses", async () => {
    listCoursesMock.mockResolvedValue([publishedCourse])

    render(
      <MemoryRouter>
        <PrepCoursePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(listCoursesMock).toHaveBeenCalled()
    })
    expect(await screen.findByRole("heading", { name: "LSAT Prep Course" })).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /View lessons/i })
    expect(link).toHaveAttribute("href", "/app/prep-course/prep-course")
  })
})
