import { describe, expect, it } from "vitest"

import { formatSupabaseCallError } from "./format-call-error"

describe("formatSupabaseCallError", () => {
  it("maps PKCE verifier errors to actionable copy", () => {
    const err = new Error("PKCE code verifier not found in storage.")
    expect(formatSupabaseCallError(err)).toContain("same browser")
  })

  it("maps same_password to actionable copy", () => {
    const err = new Error("New password should be different from the old password.") as Error & {
      code: string
    }
    err.code = "same_password"

    expect(formatSupabaseCallError(err)).toContain("same as your current account password")
  })
})
