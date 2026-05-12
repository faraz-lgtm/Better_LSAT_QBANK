import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { VideoExplanationModal } from "./video-explanation-modal"

describe("VideoExplanationModal", () => {
  it("saves pasted URL via admin API", async () => {
    const user = userEvent.setup()
    const updateQuestionMeta = vi.fn().mockResolvedValue({})
    const onOpenChange = vi.fn()
    const onVideoUrlSaved = vi.fn()

    render(
      <VideoExplanationModal
        open
        onOpenChange={onOpenChange}
        questionId="11111111-1111-1111-1111-111111111111"
        prepTestId="pt-1"
        sectionId="sec-1"
        currentVideoUrl=""
        adminApi={{ updateQuestionMeta } as never}
        onVideoUrlSaved={onVideoUrlSaved}
      />,
    )

    const input = screen.getByPlaceholderText(/https/i)
    await user.clear(input)
    await user.type(input, "https://example.com/v")
    await user.click(screen.getByRole("button", { name: /save url/i }))

    expect(updateQuestionMeta).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111", {
      video_url: "https://example.com/v",
    })
    expect(onVideoUrlSaved).toHaveBeenCalledWith("https://example.com/v")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
