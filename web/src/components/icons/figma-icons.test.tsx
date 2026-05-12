import { render } from "@testing-library/react"

import { FigmaIcon, figmaIconNames, figmaIconRegistry } from "./figma-icons"

describe("figma icon registry", () => {
  it("has an explicit registry entry for every figma icon name", () => {
    expect(Object.keys(figmaIconRegistry).length).toBe(figmaIconNames.length)
    for (const name of figmaIconNames) {
      expect(figmaIconRegistry[name]).toBeDefined()
    }
  })

  it("renders every figma icon name without crashing", () => {
    for (const name of figmaIconNames) {
      const { container, unmount } = render(<FigmaIcon name={name} data-testid={`icon-${name}`} />)
      expect(container.querySelector("svg")).not.toBeNull()
      unmount()
    }
  })
})
