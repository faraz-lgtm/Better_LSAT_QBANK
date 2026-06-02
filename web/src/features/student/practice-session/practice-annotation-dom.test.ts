import { describe, expect, it } from "vitest"

import {
  annotationContainingRange,
  rangeFullyInsideElement,
  underlineContainingRange,
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
})
