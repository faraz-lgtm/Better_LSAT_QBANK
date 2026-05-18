import { render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PrepCourseOutlinePage } from "./prep-course-outline-page"

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

describe("PrepCourseOutlinePage", () => {
  beforeEach(() => {
    getCourseMock.mockReset()
  })

  it("loads course and links first lesson", async () => {
    getCourseMock.mockResolvedValue({
      course: {
        id: "c1",
        slug: "my-slug",
        title: "My Course",
        description: null,
        is_published: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      lessons: [
        {
          id: "l1",
          course_id: "c1",
          slug: "lesson-1",
          title: "First",
          lesson_type: "video" as const,
          sort_order: 1,
          summary: null,
          duration_minutes: 5,
          video_url: null,
          text_content: null,
          is_published: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={["/app/prep-course/my-slug"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseOutlinePage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(getCourseMock).toHaveBeenCalledWith("my-slug")
    })
    expect(await screen.findByRole("heading", { name: "My Course" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start first lesson" })).toHaveAttribute("href", "/app/prep-course/my-slug/lesson-1")
    const sidebar = screen.getByRole("complementary")
    expect(within(sidebar).getByRole("link", { name: /First/i })).toHaveAttribute("href", "/app/prep-course/my-slug/lesson-1")
  })
})
