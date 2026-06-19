import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ExplanationExplainTabPanel } from "./explanation-explain-tab-panel"

describe("ExplanationExplainTabPanel", () => {
  it("shows explanation not given when no video or written content", () => {
    render(
      <ExplanationExplainTabPanel
        videos={[
          {
            id: "v-passage",
            headerVariant: "yellow",
            authorTitle: "J.Y.'s explanation",
            dropdownLabel: "Passage explanation",
            dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
            postedLine: "",
            videoUrl: null,
            explanationHtml: null,
          },
          {
            id: "v-question",
            headerVariant: "muted",
            authorTitle: "J.Y.'s explanation",
            dropdownLabel: "Question explanation",
            dropdownOptions: [{ value: "question", label: "Question explanation" }],
            postedLine: "",
            videoUrl: null,
            explanationHtml: null,
          },
        ]}
      />,
    )

    expect(screen.getAllByText("Explanation not given")).toHaveLength(2)
    expect(screen.getByText("Passage explanation")).toBeInTheDocument()
    expect(screen.getByText("Question explanation")).toBeInTheDocument()
  })

  it("renders video player when video url exists", () => {
    render(
      <ExplanationExplainTabPanel
        videos={[
          {
            id: "v-question",
            headerVariant: "muted",
            authorTitle: "J.Y.'s explanation",
            dropdownLabel: "Question explanation",
            dropdownOptions: [{ value: "question", label: "Question explanation" }],
            postedLine: "Posted Wednesday, Jun 4, 2025 • Taken on LawHub",
            videoUrl: "https://example.com/video.mp4",
            explanationHtml: null,
          },
        ]}
      />,
    )

    expect(screen.queryByText("Explanation not given")).not.toBeInTheDocument()
    expect(document.querySelector("video")).toHaveAttribute("src", "https://example.com/video.mp4")
  })
})
