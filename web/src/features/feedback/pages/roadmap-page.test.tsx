import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/analytics/produktly-widgets", () => ({
  PRODUKTLY_ROADMAP_EDIT_ID: 2445,
  PRODUKTLY_ROADMAP_PUBLIC_URL: "https://produktly.com/roadmap/produktly/test-public-id",
  isProduktlyRoadmapEditIdUrl: () => false,
}))

import { RoadmapPage } from "@/features/feedback/pages/roadmap-page"

describe("RoadmapPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true } as Response),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("embeds the Produktly public roadmap after the public API succeeds", async () => {
    render(<RoadmapPage />)

    await waitFor(() => {
      expect(screen.getByTitle("betterLSAT product roadmap")).toHaveAttribute(
        "src",
        "https://produktly.com/roadmap/produktly/test-public-id",
      )
    })
    expect(screen.getByRole("link", { name: /Open in new tab/i })).toHaveAttribute(
      "href",
      "https://produktly.com/roadmap/produktly/test-public-id",
    )
  })
})
