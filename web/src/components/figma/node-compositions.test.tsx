import { render, screen } from "@testing-library/react"

import { Node137771222Compositions } from "./node-compositions"

describe("Node137771222Compositions", () => {
  it("renders all requested node sections", () => {
    render(<Node137771222Compositions />)

    expect(screen.getByText(/Node 17775:2512/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 17780:1428/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 17780:1922/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 17788:1790/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 17788:1923/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 17802:3235/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 9761:535/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 238:2409/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 7755:2113/i)).toBeInTheDocument()
  })
})
