import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ExplanationExplainTabPanel } from "./explanation-explain-tab-panel"

const baseVideos = [
  {
    id: "v-passage",
    headerVariant: "yellow" as const,
    authorTitle: "J.Y.'s explanation",
    dropdownLabel: "Passage explanation",
    dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
    postedLine: "",
    videoUrl: null,
    explanationHtml: null,
  },
  {
    id: "v-question",
    headerVariant: "muted" as const,
    authorTitle: "J.Y.'s explanation",
    dropdownLabel: "Question explanation",
    dropdownOptions: [{ value: "question", label: "Question explanation" }],
    postedLine: "",
    videoUrl: null,
    explanationHtml: null,
  },
]

describe("ExplanationExplainTabPanel", () => {
  it("shows empty state when urls are missing", () => {
    render(<ExplanationExplainTabPanel videoOnly videos={baseVideos} />)

    expect(screen.getByText("No videos available yet")).toBeInTheDocument()
    expect(screen.queryByText("Passage explanation")).not.toBeInTheDocument()
    expect(screen.queryByText("Question explanation")).not.toBeInTheDocument()
  })

  it("shows both cards with No videos available yet when urls are missing and videoOnly is off", () => {
    render(<ExplanationExplainTabPanel videos={baseVideos} />)

    expect(screen.getAllByText("No videos available yet")).toHaveLength(2)
    expect(screen.getByText("Passage explanation")).toBeInTheDocument()
    expect(screen.getByText("Question explanation")).toBeInTheDocument()
  })

  it("renders video player when video url exists", () => {
    render(
      <ExplanationExplainTabPanel
        videos={[
          {
            ...baseVideos[1]!,
            videoUrl: "https://example.com/video.mp4",
          },
        ]}
      />,
    )

    expect(screen.queryByText("No videos available yet")).not.toBeInTheDocument()
    expect(document.querySelector("video")).toHaveAttribute("src", "https://example.com/video.mp4")
  })

  it("videoOnly hides cards without a video url", () => {
    render(
      <ExplanationExplainTabPanel
        videoOnly
        videos={[
          baseVideos[0]!,
          {
            ...baseVideos[1]!,
            videoUrl: "https://example.com/video.mp4",
          },
        ]}
      />,
    )

    expect(screen.queryByText("Passage explanation")).not.toBeInTheDocument()
    expect(screen.getByText("Question explanation")).toBeInTheDocument()
    expect(document.querySelector("video")).toHaveAttribute("src", "https://example.com/video.mp4")
  })

  it("videoOnly shows No videos available yet when no cards have urls", () => {
    render(<ExplanationExplainTabPanel videoOnly videos={baseVideos} />)

    expect(screen.getByText("No videos available yet")).toBeInTheDocument()
    expect(screen.queryByText("Passage explanation")).not.toBeInTheDocument()
  })
})
