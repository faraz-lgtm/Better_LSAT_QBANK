import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HtmlContent, LessonHtmlContent } from "./html-content"

describe("HtmlContent", () => {
  it("renders sanitized paragraph HTML", () => {
    render(<HtmlContent html="<p>Historian Philippe</p>" />)
    expect(screen.getByText("Historian Philippe")).toBeInTheDocument()
    expect(screen.queryByText(/<p>/)).not.toBeInTheDocument()
  })

  it("returns null for empty html", () => {
    const { container } = render(<HtmlContent html="   " />)
    expect(container.firstChild).toBeNull()
  })

  it("does not render script content", () => {
    render(<HtmlContent html='<p>ok</p><script>alert("x")</script>' />)
    expect(screen.getByText("ok")).toBeInTheDocument()
    expect(screen.queryByText('alert("x")')).not.toBeInTheDocument()
  })
})

describe("LessonHtmlContent", () => {
  it("renders callout blocks with label and body", () => {
    render(
      <LessonHtmlContent
        html={[
          '<section data-lesson-section="true" data-label="Key term · stimulus"><p>Body one</p></section>',
          '<section data-lesson-section="true" data-label="Common trap"><p>Body two</p></section>',
        ].join("")}
      />,
    )

    expect(screen.getByText("Key term · stimulus")).toBeInTheDocument()
    expect(screen.getByText("Common trap")).toBeInTheDocument()
    expect(screen.getByText("Body one")).toBeInTheDocument()
    expect(screen.getByText("Body two")).toBeInTheDocument()
    expect(document.querySelectorAll(".lesson-callout")).toHaveLength(2)
    expect(screen.queryByText("1")).not.toBeInTheDocument()
  })

  it("renders empty sections with optional recap-style tag and background color", () => {
    render(
      <LessonHtmlContent
        html='<section data-lesson-section="true" data-variant="empty" data-label="RECAP" data-bg="#478fea"><p>Summary text</p></section>'
      />,
    )
    expect(screen.getByText("RECAP")).toBeInTheDocument()
    expect(screen.getByText("Summary text")).toBeInTheDocument()
    expect(document.querySelector("section")?.getAttribute("style")).toContain("background-color")
  })

  it("renders plain html without callout blocks", () => {
    render(<LessonHtmlContent html="<p>Legacy paragraph</p>" />)
    expect(screen.getByText("Legacy paragraph")).toBeInTheDocument()
    expect(document.querySelector(".lesson-callout")).toBeNull()
  })

  it("renders editor headings as heading elements", () => {
    render(<LessonHtmlContent html="<h2>Myth #1: The LSAT is an IQ Test</h2><p>The Truth: it is not.</p>" />)
    const heading = screen.getByRole("heading", { level: 2, name: "Myth #1: The LSAT is an IQ Test" })
    expect(heading).toBeInTheDocument()
    expect(heading.closest(".lesson-html-body")).not.toBeNull()
  })

  it("renders editor tables as a real table, not stacked paragraphs", () => {
    render(
      <LessonHtmlContent
        html={[
          "<table>",
          "<thead><tr><th>Choice</th><th>Verdict</th><th>Reason</th></tr></thead>",
          "<tbody>",
          "<tr><td>A</td><td>CORRECT</td><td>Value Judgment</td></tr>",
          "<tr><td>B</td><td>Incorrect</td><td>Premise</td></tr>",
          "</tbody>",
          "</table>",
        ].join("")}
      />,
    )

    const table = document.querySelector(".lesson-html-body table")
    expect(table).not.toBeNull()
    expect(table?.querySelectorAll("th")).toHaveLength(3)
    expect(table?.querySelectorAll("tr")).toHaveLength(3)
    expect(screen.getByText("Choice")).toBeInTheDocument()
    expect(screen.getByText("CORRECT")).toBeInTheDocument()
    expect(getComputedStyle(table!).display).toBe("table")
  })
})
