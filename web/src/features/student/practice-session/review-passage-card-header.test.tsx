import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ReviewPassageCardHeader } from "@/features/student/practice-session/review-passage-card-header"

describe("ReviewPassageCardHeader", () => {
  it("keeps Analysis View disabled when analysis is unavailable", () => {
    render(<ReviewPassageCardHeader analysisEnabled={false} />)
    expect(screen.getByLabelText("Analysis View is display only")).toBeInTheDocument()
    expect(screen.queryByRole("switch", { name: /analysis view/i })).not.toBeInTheDocument()
  })

  it("toggles Analysis View when enabled", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ReviewPassageCardHeader
        analysisEnabled
        analysisChecked={false}
        onAnalysisCheckedChange={onChange}
      />,
    )
    await user.click(screen.getByRole("switch", { name: /analysis view/i }))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
