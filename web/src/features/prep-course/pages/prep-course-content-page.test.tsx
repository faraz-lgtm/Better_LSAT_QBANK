import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { PREP_COURSE_ESSENTIALS_SLUG } from "@/features/prep-course/lib/prep-course-nav"

import { PrepCourseContentPage } from "./prep-course-content-page"

const getCourseMock = vi.fn()
const setModuleBookmarkMock = vi.fn()
const setLessonBookmarkMock = vi.fn()

let bookmarkState = { moduleIds: [] as string[], lessonSlugs: [] as string[] }
let entitlementMock: {
  entitlement: { hasActiveCore: boolean; accessState: "PAYMENT_REQUIRED" | "FULL_ACCESS" }
  loading: boolean
} | null = null

vi.mock("@/lib/api/prep-course", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/prep-course")>("@/lib/api/prep-course")
  return {
    ...actual,
    createPrepCourseApi: () => ({
      getCourse: getCourseMock,
      setModuleBookmark: setModuleBookmarkMock,
      setLessonBookmark: setLessonBookmarkMock,
    }),
  }
})

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/features/app-shell/student-entitlement-context", async () => {
  const actual = await vi.importActual<typeof import("@/features/app-shell/student-entitlement-context")>(
    "@/features/app-shell/student-entitlement-context",
  )
  return {
    ...actual,
    useStudentEntitlementOptional: () => entitlementMock,
  }
})

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
    setModuleBookmarkMock.mockReset()
    setLessonBookmarkMock.mockReset()
    entitlementMock = null
    bookmarkState = { moduleIds: [], lessonSlugs: [] }
    setModuleBookmarkMock.mockImplementation(async (_courseSlug: string, moduleId: string, bookmarked: boolean) => {
      bookmarkState = {
        ...bookmarkState,
        moduleIds: bookmarked
          ? [...new Set([...bookmarkState.moduleIds, moduleId])]
          : bookmarkState.moduleIds.filter((id) => id !== moduleId),
      }
      return { bookmarks: { ...bookmarkState } }
    })
    setLessonBookmarkMock.mockImplementation(async (_courseSlug: string, lessonSlug: string, bookmarked: boolean) => {
      bookmarkState = {
        ...bookmarkState,
        lessonSlugs: bookmarked
          ? [...new Set([...bookmarkState.lessonSlugs, lessonSlug])]
          : bookmarkState.lessonSlugs.filter((slug) => slug !== lessonSlug),
      }
      return { bookmarks: { ...bookmarkState } }
    })
    window.localStorage.clear()
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
    expect(screen.getByRole("button", { name: "Expand All" })).toBeInTheDocument()
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

    await screen.findByText("Section Alpha")

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

    await user.click(screen.getByRole("button", { name: "Collapse this Section" }))
    expect(screen.queryByRole("link", { name: /Lesson A/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Expand this Sections" }))
    expect(screen.getByRole("link", { name: /Lesson A/i })).toBeInTheDocument()
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

  it("shows only bookmarked lessons when module Bookmark toggle is on", async () => {
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
                lessons: [lessonA, lessonB],
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
    await user.click(screen.getByRole("button", { name: "Bookmark Lesson A" }))

    expect(screen.getByRole("link", { name: /Lesson B/i })).toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Bookmark module" }))

    expect(screen.getByRole("link", { name: /Lesson A/i })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Lesson B/i })).not.toBeInTheDocument()
  })

  it("filters sidebar to bookmarked modules when Show All Bookmark is on", async () => {
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

    const moduleSidebar = await screen.findByRole("complementary", { name: "Course modules" })
    expect(within(moduleSidebar).getByText("Module One")).toBeInTheDocument()
    expect(within(moduleSidebar).getByText("Module Two")).toBeInTheDocument()

    await user.click(await screen.findByRole("switch", { name: "Bookmark module" }))
    await user.click(screen.getByRole("switch", { name: "Show all bookmark" }))

    expect(within(moduleSidebar).getByText("Module One")).toBeInTheDocument()
    expect(within(moduleSidebar).queryByText("Module Two")).not.toBeInTheDocument()
  })

  it("shows only bookmarked lessons when Show All Bookmark is on", async () => {
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
                lessons: [lessonA, lessonB],
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

    await user.click(screen.getByRole("button", { name: "Bookmark Lesson A" }))
    await user.click(screen.getByRole("switch", { name: "Show all bookmark" }))

    expect(screen.getByRole("link", { name: /Lesson A/i })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Lesson B/i })).not.toBeInTheDocument()
  })

  it("lets free students open The Kickoff and locks later modules behind the pricing popup", async () => {
    entitlementMock = {
      entitlement: { hasActiveCore: false, accessState: "PAYMENT_REQUIRED" },
      loading: false,
    }
    const essentialsCourse = { ...course, slug: PREP_COURSE_ESSENTIALS_SLUG }
    const kickoffLesson = { ...lessonA, course_id: "c1", slug: "welcome-to-the-arena", title: "Welcome to the Arena" }
    const lockedLesson = { ...lessonB, course_id: "c1", slug: "argument-basics", title: "Argument Basics" }
    getCourseMock.mockResolvedValue({
      course: essentialsCourse,
      lessons: [kickoffLesson, lockedLesson],
      curriculum: {
        modules: [
          {
            id: "kickoff",
            course_id: "c1",
            title: "The Kickoff",
            sort_order: 1,
            duration_minutes: null,
            sections: [
              {
                id: "s1",
                module_id: "kickoff",
                title: "General",
                sort_order: 1,
                duration_minutes: null,
                lessons: [kickoffLesson],
              },
            ],
          },
          {
            id: "anatomy",
            course_id: "c1",
            title: "The Anatomy of an Argument",
            sort_order: 2,
            duration_minutes: null,
            sections: [
              {
                id: "s2",
                module_id: "anatomy",
                title: "General",
                sort_order: 1,
                duration_minutes: null,
                lessons: [lockedLesson],
              },
            ],
          },
        ],
      },
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={[`/app/prep-course/${PREP_COURSE_ESSENTIALS_SLUG}`]}>
        <GuestPricingModalProvider>
          <Routes>
            <Route path="/app/prep-course/:courseSlug" element={<PrepCourseContentPage />} />
          </Routes>
        </GuestPricingModalProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole("heading", { name: "The Kickoff" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Welcome to the Arena/i })).toHaveAttribute(
      "href",
      `/app/prep-course/${PREP_COURSE_ESSENTIALS_SLUG}/welcome-to-the-arena`,
    )

    const moduleSidebar = screen.getByRole("complementary", { name: "Course modules" })
    expect(within(moduleSidebar).getByRole("button", { name: "The Anatomy of an Argument (locked)" })).toBeInTheDocument()

    await user.click(within(moduleSidebar).getByRole("button", { name: "The Anatomy of an Argument (locked)" }))
    expect(screen.getByRole("dialog", { name: "Subscriber-Only Content" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "The Kickoff" })).toBeInTheDocument()
  })
})
