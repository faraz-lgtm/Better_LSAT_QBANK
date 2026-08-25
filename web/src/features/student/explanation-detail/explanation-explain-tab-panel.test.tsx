import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ExplanationExplainTabPanel } from "./explanation-explain-tab-panel"

describe("ExplanationExplainTabPanel", () => {
  it("hides cards with no video or written content", () => {
    render(
      <ExplanationExplainTabPanel
        videos={[
          {
            id: "v-passage",
            headerVariant: "yellow",
            authorTitle: "Passage Explanation",
            dropdownLabel: "Passage explanation",
            dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
            postedLine: "",
            videoUrl: null,
            explanationHtml: null,
          },
          {
            id: "v-question",
            headerVariant: "muted",
            authorTitle: "Video Explanation",
            dropdownLabel: "Question explanation",
            dropdownOptions: [{ value: "question", label: "Question explanation" }],
            postedLine: "",
            videoUrl: null,
            explanationHtml: null,
          },
        ]}
      />,
    )

    expect(screen.queryByText("Explanation not given")).not.toBeInTheDocument()
    expect(screen.queryByText("Passage explanation")).not.toBeInTheDocument()
    expect(screen.queryByText("Question explanation")).not.toBeInTheDocument()
  })

  it("hides empty question card when only passage analysis exists", () => {
    render(
      <ExplanationExplainTabPanel
        videos={[
          {
            id: "v-passage",
            headerVariant: "yellow",
            authorTitle: "Passage Explanation",
            dropdownLabel: "Passage explanation",
            dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
            postedLine: "",
            videoUrl: null,
            explanationHtml: "<p>Stimulus analysis for this passage</p>",
          },
          {
            id: "v-question",
            headerVariant: "muted",
            authorTitle: "Video Explanation",
            dropdownLabel: "Question explanation",
            dropdownOptions: [{ value: "question", label: "Question explanation" }],
            postedLine: "",
            videoUrl: null,
            explanationHtml: null,
          },
        ]}
      />,
    )

    expect(screen.getByText("Stimulus analysis for this passage")).toBeInTheDocument()
    expect(screen.getByText("Passage explanation")).toBeInTheDocument()
    expect(screen.queryByText("Question explanation")).not.toBeInTheDocument()
    expect(screen.queryByText("Explanation not given")).not.toBeInTheDocument()
  })

  it("renders video player when video url exists", () => {
    render(
      <ExplanationExplainTabPanel
        videos={[
          {
            id: "v-question",
            headerVariant: "muted",
            authorTitle: "Video Explanation",
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

  it("renders passage analysis html when provided", () => {
    render(
      <ExplanationExplainTabPanel
        videos={[
          {
            id: "v-passage",
            headerVariant: "yellow",
            authorTitle: "Passage Explanation",
            dropdownLabel: "Passage explanation",
            dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
            postedLine: "",
            videoUrl: null,
            explanationHtml: "<p>Stimulus analysis for this passage</p>",
          },
        ]}
      />,
    )

    expect(screen.queryByText("Explanation not given")).not.toBeInTheDocument()
    expect(screen.getByText("Stimulus analysis for this passage")).toBeInTheDocument()
    expect(screen.getByText("Passage explanation")).toBeInTheDocument()
  })

  it("videoOnly hides written passage text and empty cards", () => {
    render(
      <ExplanationExplainTabPanel
        videoOnly
        videos={[
          {
            id: "v-passage",
            headerVariant: "yellow",
            authorTitle: "J.Y.'s explanation",
            dropdownLabel: "Passage explanation",
            dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
            postedLine: "",
            videoUrl: null,
            explanationHtml: "<p>Stimulus analysis for this passage</p>",
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

    expect(screen.queryByText("Stimulus analysis for this passage")).not.toBeInTheDocument()
    expect(screen.getByText("No video explanation available yet.")).toBeInTheDocument()
  })

  it("videoOnly renders only cards with a video url", () => {
    render(
      <ExplanationExplainTabPanel
        videoOnly
        videos={[
          {
            id: "v-passage",
            headerVariant: "yellow",
            authorTitle: "J.Y.'s explanation",
            dropdownLabel: "Passage explanation",
            dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
            postedLine: "",
            videoUrl: null,
            explanationHtml: "<p>Should not show</p>",
          },
          {
            id: "v-question",
            headerVariant: "muted",
            authorTitle: "J.Y.'s explanation",
            dropdownLabel: "Question explanation",
            dropdownOptions: [{ value: "question", label: "Question explanation" }],
            postedLine: "",
            videoUrl: "https://example.com/video.mp4",
            explanationHtml: null,
          },
        ]}
      />,
    )

    expect(screen.queryByText("Should not show")).not.toBeInTheDocument()
    expect(screen.queryByText("Passage explanation")).not.toBeInTheDocument()
    expect(screen.getByText("Question explanation")).toBeInTheDocument()
    expect(document.querySelector("video")).toHaveAttribute("src", "https://example.com/video.mp4")
  })
})
