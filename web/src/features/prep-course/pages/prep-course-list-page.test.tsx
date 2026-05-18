import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
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

  it("loads courses and links to course detail", async () => {
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
      <MemoryRouter>
        <PrepCourseListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(listCoursesMock).toHaveBeenCalled()
    })

    expect(screen.getByRole("heading", { level: 1, name: "Prep Course" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Prep Course" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Foundational LSAT course/i })).toHaveAttribute(
      "href",
      "/app/prep-course/prep-course",
    )
    expect(screen.getByRole("link", { name: /BetterLSAT Core/i })).toHaveAttribute(
      "href",
      "/app/prep-course/betterlsat-core-syllabus",
    )
  })
})
