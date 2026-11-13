import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DialogContent, DialogDescription, DialogHeader, DialogRoot, DialogTitle } from "@/components/ui/dialog"

describe("DialogContent", () => {
  it("centers inside a fixed inset-0 positioner without top/left 50% fixed offsets", () => {
    render(
      <DialogRoot open onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test modal</DialogTitle>
            <DialogDescription>Centered dialog description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </DialogRoot>,
    )

    const dialog = screen.getByRole("dialog")
    const positioner = dialog.closest('[data-slot="dialog-positioner"]')
    expect(positioner).not.toBeNull()
    expect(positioner).toHaveClass("fixed", "inset-0", "flex", "overflow-y-auto")
    expect(dialog).toHaveClass("relative", "m-auto")
    expect(dialog.style.position).toBe("")
    expect(dialog.style.top).toBe("")
    expect(dialog.style.left).toBe("")
  })
})
