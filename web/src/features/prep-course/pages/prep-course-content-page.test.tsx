import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PrepCourseContentPage } from "./prep-course-content-page"

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

const course = {
  id: "c1",
  slug: "prep-course",
  title: "Prep Course",
  description: null,
  is_published: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const lessonA = {
  id: "l1",
  course_id: "c1",
  slug: "lesson-a",
  title: "Lesson A",
  lesson_type: "video_text" as const,
  sort_order: 1,
  summary: null,
  duration_minutes: 5,
  video_url: null,
  text_content: null,
  is_published: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const lessonB = {
  ...lessonA,
  id: "l2",
  slug: "lesson-b",
  title: "Lesson B",
  sort_order: 2,
}

describe("PrepCourseContentPage", () => {
  beforeEach(() => {
    getCourseMock.mockReset()
  })

  it("renders Course Content layout with modules and expandable sections", async () => {
    getCourseMock.mockResolvedValue({
      course,
      lessons: [lessonA, lessonB],
      curriculum: {
        modules: [
          {
            id: "m1",
            course_id: "c1",
            title: "Module One",
            sort_order: 1,
            duration_minutes: null,
            sections: [
              {
                id: "s1",
                module_id: "m1",
                title: "Section Alpha",
                sort_order: 1,
                duration_minutes: null,
                lessons: [lessonA],
              },
            ],
          },
          {
            id: "m2",
            course_id: "c1",
            title: "Module Two",
            sort_order: 2,
            duration_minutes: null,
            sections: [
              {
                id: "s2",
                module_id: "m2",
                title: "Section Beta",
                sort_order: 1,
                duration_minutes: null,
                lessons: [lessonB],
              },
            ],
          },
        ],
      },
    })

    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseContentPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(getCourseMock).toHaveBeenCalledWith("prep-course")
    })

    expect(await screen.findByRole("heading", { name: "Course Content" })).toBeInTheDocument()
    expect(screen.getByText("Show All Bookmark")).toBeInTheDocument()
    expect(screen.getByText("Modules")).toBeInTheDocument()
    expect(screen.getByText("Sections")).toBeInTheDocument()

    const moduleSidebar = screen.getByRole("complementary", { name: "Course modules" })
    expect(within(moduleSidebar).getByText("Module One")).toBeInTheDocument()
    expect(within(moduleSidebar).getByText("Module Two")).toBeInTheDocument()

    expect(screen.getByText("Section Alpha")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Lesson A/i })).toHaveAttribute(
      "href",
      "/app/prep-course/prep-course/lesson-a",
    )
  })

  it("switches module panel when another module is selected", async () => {
    getCourseMock.mockResolvedValue({
      course,
      lessons: [lessonA, lessonB],
      curriculum: {
        modules: [
          {
            id: "m1",
            course_id: "c1",
            title: "Module One",
            sort_order: 1,
            duration_minutes: null,
            sections: [
              {
                id: "s1",
                module_id: "m1",
                title: "Section Alpha",
                sort_order: 1,
                duration_minutes: null,
                lessons: [lessonA],
              },
            ],
          },
          {
            id: "m2",
            course_id: "c1",
            title: "Module Two",
            sort_order: 2,
            duration_minutes: null,
            sections: [
              {
                id: "s2",
                module_id: "m2",
                title: "Section Beta",
                sort_order: 1,
                duration_minutes: null,
                lessons: [lessonB],
              },
            ],
          },
        ],
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseContentPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText("Section Alpha")
    await user.click(screen.getByRole("button", { name: /Module Two/i }))
    expect(await screen.findByText("Section Beta")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Lesson B/i })).toBeInTheDocument()
  })

  it("shows completion checkmarks and module progress for completed lessons", async () => {
    getCourseMock.mockResolvedValue({
      course,
      lessons: [lessonA, lessonB],
      completedLessonSlugs: ["lesson-a"],
      curriculum: {
        modules: [
          {
            id: "m1",
            course_id: "c1",
            title: "Module One",
            sort_order: 1,
            duration_minutes: null,
            sections: [
              {
                id: "s1",
                module_id: "m1",
                title: "Section Alpha",
                sort_order: 1,
                duration_minutes: null,
                lessons: [lessonA, lessonB],
              },
            ],
          },
        ],
      },
    })

    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseContentPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const lessonALink = await screen.findByRole("link", { name: /Lesson A/i })
    expect(within(lessonALink).getByLabelText("Completed")).toBeInTheDocument()
    expect(within(screen.getByRole("link", { name: /Lesson B/i })).queryByLabelText("Completed")).toBeNull()
    expect(screen.getByText(/1 of 2 Lessons completed/)).toBeInTheDocument()
    expect(within(screen.getByRole("complementary", { name: "Course modules" })).getByText("50%")).toBeInTheDocument()
  })

  it("expands and collapses sections with Figma expand controls", async () => {
    getCourseMock.mockResolvedValue({
      course,
      lessons: [lessonA, lessonB],
      curriculum: {
        modules: [
          {
            id: "m1",
            course_id: "c1",
            title: "Module One",
            sort_order: 1,
            duration_minutes: null,
            sections: [
              {
                id: "s1",
                module_id: "m1",
                title: "Section Alpha",
                sort_order: 1,
                duration_minutes: null,
                lessons: [lessonA],
              },
              {
                id: "s1b",
                module_id: "m1",
                title: "Section Gamma",
                sort_order: 2,
                duration_minutes: null,
                lessons: [],
              },
            ],
          },
        ],
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseContentPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText("Section Alpha")
    expect(screen.getByRole("link", { name: /Lesson A/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Expand this Sections" }))
    expect(screen.getByRole("link", { name: /Lesson A/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Collapse this Sections" }))
    expect(screen.queryByRole("link", { name: /Lesson A/i })).not.toBeInTheDocument()
  })

  it("toggles module bookmark switch", async () => {
    getCourseMock.mockResolvedValue({
      course,
      lessons: [lessonA],
      curriculum: {
        modules: [
          {
            id: "m1",
            course_id: "c1",
            title: "Module One",
            sort_order: 1,
            duration_minutes: null,
            sections: [
              {
                id: "s1",
                module_id: "m1",
                title: "Section Alpha",
                sort_order: 1,
                duration_minutes: null,
                lessons: [lessonA],
              },
            ],
          },
        ],
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/app/prep-course/prep-course"]}>
        <Routes>
          <Route path="/app/prep-course/:courseSlug" element={<PrepCourseContentPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const bookmarkSwitch = await screen.findByRole("switch", { name: "Bookmark module" })
    expect(bookmarkSwitch).not.toBeChecked()

    await user.click(bookmarkSwitch)
    expect(bookmarkSwitch).toBeChecked()

    await user.click(bookmarkSwitch)
    expect(bookmarkSwitch).not.toBeChecked()
  })
})
