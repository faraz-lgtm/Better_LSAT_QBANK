import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ReviewPassageCardHeader } from "@/features/student/practice-session/review-passage-card-header"

describe("ReviewPassageCardHeader", () => {
  it("hides Analysis View when analysis is unavailable (e.g. LR)", () => {
    render(<ReviewPassageCardHeader analysisEnabled={false} />)
    expect(screen.getByText("Passage Only View")).toBeInTheDocument()
    expect(screen.queryByText("Analysis View")).not.toBeInTheDocument()
    expect(screen.queryByRole("switch", { name: /analysis view/i })).not.toBeInTheDocument()
  })

  it("toggles Analysis View when enabled (RC)", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ReviewPassageCardHeader
        analysisEnabled
        analysisChecked={false}
        onAnalysisCheckedChange={onChange}
      />,
    )
    expect(screen.getByText("Analysis View")).toBeInTheDocument()
    await user.click(screen.getByRole("switch", { name: /analysis view/i }))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
