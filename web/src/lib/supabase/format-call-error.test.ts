import { describe, expect, it } from "vitest"

import { formatEdgeFunctionError, formatSupabaseCallError } from "./format-call-error"

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

describe("formatEdgeFunctionError", () => {
  it("extracts LSAC JSON error from HTTP wrapper text", () => {
    const err = new Error(
      'POST /api/vendor/BET2026/log: HTTP 400 {"statusCode":400,"error":"VendorId, type, and email address required!"}',
    )
    expect(formatEdgeFunctionError(err)).toBe("VendorId, type, and email address required!")
  })
})
