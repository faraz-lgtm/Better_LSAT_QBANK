import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FindableHtmlContent } from "@/lib/html/findable-html-content"

describe("FindableHtmlContent", () => {
  it("does not replace innerHTML when parent re-renders with the same html", () => {
    let renderCount = 0

    function Wrapper({ tick }: { tick: number }) {
      renderCount += 1
      return (
        <FindableHtmlContent
          html="<p>First paragraph with enough text to scroll.</p><p>Second paragraph at the bottom.</p>"
          data-testid="content"
          data-tick={tick}
        />
      )
    }

    const { rerender } = render(<Wrapper tick={0} />)
    const node = screen.getByTestId("content")
    const initialHtml = node.innerHTML
    expect(initialHtml.length).toBeGreaterThan(0)

    rerender(<Wrapper tick={1} />)
    rerender(<Wrapper tick={2} />)

    expect(renderCount).toBe(3)
    expect(node.innerHTML).toBe(initialHtml)
  })
})
