import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HtmlContent } from "./html-content"

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
