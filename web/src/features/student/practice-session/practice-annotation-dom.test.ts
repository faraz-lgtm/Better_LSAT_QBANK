import { describe, expect, it } from "vitest"

import {
  annotationContainingRange,
  rangeFullyInsideElement,
  underlineContainingRange,
  wrapRangeWithElement,
} from "./practice-annotation-dom"

describe("practice-annotation-dom", () => {
  it("detects underline fully containing a range", () => {
    const container = document.createElement("div")
    container.innerHTML = "<p>Hello <u>world</u> today</p>"
    document.body.appendChild(container)

    const u = container.querySelector("u")!
    const textNode = u.firstChild as Text
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 5)

    expect(rangeFullyInsideElement(range, u)).toBe(true)
    expect(underlineContainingRange(range, container)).toBe(u)

    document.body.removeChild(container)
  })

  it("returns null when range extends outside underline", () => {
    const container = document.createElement("div")
    container.innerHTML = "<p>Hello <u>world</u> today</p>"
    document.body.appendChild(container)

    const range = document.createRange()
    range.selectNodeContents(container.querySelector("p")!)
    expect(underlineContainingRange(range, container)).toBeNull()

    document.body.removeChild(container)
  })

  it("finds mark annotation containing selection for eraser", () => {
    const container = document.createElement("div")
    container.innerHTML = '<p>See <mark data-highlight="yellow">here</mark> now</p>'
    document.body.appendChild(container)

    const mark = container.querySelector("mark")!
    const textNode = mark.firstChild as Text
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 4)

    expect(annotationContainingRange(range, container)).toBe(mark)

    document.body.removeChild(container)
  })

  it("wraps range when surroundContents fails", () => {
    const container = document.createElement("div")
    container.innerHTML = "<p>Hello <strong>world</strong> today</p>"
    document.body.appendChild(container)

    const p = container.querySelector("p")!
    const range = document.createRange()
    range.setStart(p.firstChild!, 6)
    range.setEnd(p.lastChild!, 5)

    const mark = document.createElement("mark")
    mark.setAttribute("data-highlight", "yellow")
    expect(wrapRangeWithElement(range, mark)).toBe(true)
    expect(container.querySelector("mark[data-highlight='yellow']")).not.toBeNull()

    document.body.removeChild(container)
  })
})
