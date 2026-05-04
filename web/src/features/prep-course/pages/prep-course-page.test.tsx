import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PrepCoursePage } from "./prep-course-page"

const getCourseMock = vi.fn()

vi.mock("@/lib/api/prep-course", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/prep-course")>("@/lib/api/prep-course")
  return {
    ...actual,
    createPrepCourseApi: () => ({
      getCourse: getCourseMock,
    }),
  }
})

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

describe("PrepCoursePage", () => {
  beforeEach(() => {
    getCourseMock.mockReset()
  })

  it("loads prep course data from api", async () => {
    getCourseMock.mockResolvedValue({
      course: {
        id: "c1",
        slug: "prep-course",
        title: "Prep Course",
        description: null,
        is_published: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      lessons: [
        {
          id: "l1",
          course_id: "c1",
          slug: "intro",
          title: "Introduction",
          lesson_type: "video",
          sort_order: 1,
          summary: "Intro",
          duration_minutes: 3,
          video_url: "https://example.com/video",
          text_content: null,
          is_published: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
    })

    render(
      <MemoryRouter>
        <PrepCoursePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(getCourseMock).toHaveBeenCalledWith("prep-course")
    })
    expect(await screen.findByRole("heading", { name: "Prep Course" })).toBeInTheDocument()
  })
})
