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

  it("lessonDrill saves pasted URL via updateLesson", async () => {
    const user = userEvent.setup()
    const updateLesson = vi.fn().mockResolvedValue({})
    const onOpenChange = vi.fn()
    const onVideoUrlSaved = vi.fn()

    render(
      <VideoExplanationModal
        mode="lessonDrill"
        open
        onOpenChange={onOpenChange}
        lessonId="22222222-2222-2222-2222-222222222222"
        recordPrepTestId="pt-1"
        recordSectionId="sec-1"
        recordQuestionId="11111111-1111-1111-1111-111111111111"
        lessonDrillQuery="active"
        currentVideoUrl=""
        adminApi={{ updateLesson } as never}
        onVideoUrlSaved={onVideoUrlSaved}
      />,
    )

    const input = screen.getByPlaceholderText(/https/i)
    await user.clear(input)
    await user.type(input, "https://cdn.example.com/intro.mp4")
    await user.click(screen.getByRole("button", { name: /save url/i }))

    expect(updateLesson).toHaveBeenCalledWith("22222222-2222-2222-2222-222222222222", {
      videoUrl: "https://cdn.example.com/intro.mp4",
    })
    expect(onVideoUrlSaved).toHaveBeenCalledWith("https://cdn.example.com/intro.mp4")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
