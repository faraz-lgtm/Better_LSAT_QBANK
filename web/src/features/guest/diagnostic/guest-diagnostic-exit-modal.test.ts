import { describe, expect, it } from "vitest"

import {
  GUEST_DIAGNOSTIC_EXIT_DISCARD_MESSAGE,
  GUEST_DIAGNOSTIC_EXIT_SAVE_MESSAGE,
} from "@/features/guest/diagnostic/guest-diagnostic-exit-modal"

describe("guest diagnostic exit modal", () => {
  it("warns that save-and-exit returns to the platform with progress kept", () => {
    expect(GUEST_DIAGNOSTIC_EXIT_SAVE_MESSAGE).toBe(
      "Are you sure you want to leave this diagnostic? Your progress will be saved and you will return to the platform.",
    )
  })

  it("warns that exit-without-saving discards answers and returns to the platform", () => {
    expect(GUEST_DIAGNOSTIC_EXIT_DISCARD_MESSAGE).toBe(
      "Are you sure you want to exit without saving? Your answers will be lost and you will return to the platform.",
    )
  })
})
