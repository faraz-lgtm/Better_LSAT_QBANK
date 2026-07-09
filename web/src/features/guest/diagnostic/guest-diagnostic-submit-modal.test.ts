import { describe, expect, it } from "vitest"

import { GUEST_DIAGNOSTIC_SUBMIT_MESSAGE } from "@/features/guest/diagnostic/guest-diagnostic-submit-modal"

describe("guest diagnostic submit modal", () => {
  it("uses the Figma confirmation copy", () => {
    expect(GUEST_DIAGNOSTIC_SUBMIT_MESSAGE).toBe(
      "Are you sure you want to submit this Test? You still have time left on the timer.",
    )
  })
})
