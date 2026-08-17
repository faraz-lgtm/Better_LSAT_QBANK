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
  it("renders numbered section cards with label and h1", () => {
    render(
      <LessonHtmlContent
        html={[
          '<section data-lesson-section="true" data-label="THE BIG PICTURE"><h1>LSAC and the move to in-person testing</h1><p>Body one</p></section>',
          '<section data-lesson-section="true" data-label="THE PLAYERS"><h1>Logical Reasoning vs. Reading Comp</h1><p>Body two</p></section>',
        ].join("")}
      />,
    )

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("THE BIG PICTURE")).toBeInTheDocument()
    expect(screen.getByText("THE PLAYERS")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1, name: "LSAC and the move to in-person testing" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1, name: "Logical Reasoning vs. Reading Comp" })).toBeInTheDocument()
    expect(screen.getByText("Body one")).toBeInTheDocument()
  })

  it("renders empty sections without a numbered heading row", () => {
    render(
      <LessonHtmlContent
        html='<section data-lesson-section="true" data-variant="empty" data-bg="#f3f7ff"><p></p></section>'
      />,
    )
    expect(screen.queryByText("1")).not.toBeInTheDocument()
    expect(document.querySelector("section")?.getAttribute("style")).toContain("background-color")
  })

  it("renders plain html without section cards", () => {
    render(<LessonHtmlContent html="<p>Legacy paragraph</p>" />)
    expect(screen.getByText("Legacy paragraph")).toBeInTheDocument()
    expect(screen.queryByText("1")).not.toBeInTheDocument()
  })
})
