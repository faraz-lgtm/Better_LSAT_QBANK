import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PrepCourseDetailPage } from "./prep-course-detail-page"

const getCourseMock = vi.fn()
const getLessonMock = vi.fn()

vi.mock("@/lib/api/prep-course", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/prep-course")>("@/lib/api/prep-course")
  return {
    ...actual,
    createPrepCourseApi: () => ({
      getCourse: getCourseMock,
      getLesson: getLessonMock,
    }),
  }
})

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

const course = {
  id: "c1",
  slug: "prep-course",
  title: "Prep Course",
  description: null,
  is_published: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const introLesson = {
  id: "l1",
  course_id: "c1",
  slug: "intro",
  title: "Introduction",
  lesson_type: "video" as const,
  sort_order: 1,
  summary: "Intro summary",
  duration_minutes: 3,
  video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  text_content: null,
  is_published: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const secondLesson = {
  ...introLesson,
  id: "l2",
  slug: "grammar-basics",
  title: "Grammar Basics",
  sort_order: 2,
  summary: "Grammar summary",
  duration_minutes: 10,
  text_content: "<p>Grammar content</p>",
  video_url: null,
  lesson_type: "text" as const,
}

describe("PrepCourseDetailPage", () => {
  beforeEach(() => {
    getCourseMock.mockReset()
    getLessonMock.mockReset()
    getCourseMock.mockResolvedValue({
      course,
      lessons: [introLesson, secondLesson],
    })
    getLessonMock.mockImplementation(async (_courseSlug: string, lessonSlug: string) => {
      const lesson = lessonSlug === "grammar-basics" ? secondLesson : introLesson
      return { course, lesson, linkedQuestionRefs: [] }
    })
  })

  it("loads prep course data for slug from route", async () => {
    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(getCourseMock).toHaveBeenCalledWith("prep-course")
    })
    expect(await screen.findByRole("heading", { name: "All Lessons" })).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument()
  })

  it("shows lesson sidebar and first lesson content with figma-style header", async () => {
    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(getLessonMock).toHaveBeenCalledWith("prep-course", "intro")
    })

    expect(await screen.findByRole("heading", { name: "Introduction", level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Intro summary • 3 mins/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bookmark lesson" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mark Complete & Continue" })).toBeInTheDocument()
    expect(screen.getByLabelText("Course lessons")).toBeInTheDocument()
  })

  it("loads selected lesson when clicking sidebar", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(getLessonMock).toHaveBeenCalledWith("prep-course", "intro")
    })

    const grammarButton = screen.getByRole("button", { name: /Grammar Basics/i })
    await user.click(grammarButton)

    await waitFor(() => {
      expect(getLessonMock).toHaveBeenCalledWith("prep-course", "grammar-basics")
    })

    expect(await screen.findByRole("heading", { name: "Grammar Basics", level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Grammar summary • 10 mins/)).toBeInTheDocument()
    expect(screen.getByText("Grammar content")).toBeInTheDocument()
  })

  it("marks lesson complete and advances to next lesson", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(getLessonMock).toHaveBeenCalledWith("prep-course", "intro")
    })

    await user.click(screen.getByRole("button", { name: "Mark Complete & Continue" }))

    await waitFor(() => {
      expect(getLessonMock).toHaveBeenCalledWith("prep-course", "grammar-basics")
    })
    expect(await screen.findByRole("heading", { name: "Grammar Basics", level: 1 })).toBeInTheDocument()
  })
})
