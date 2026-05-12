import type { User } from "@supabase/supabase-js"
import { describe, expect, it } from "vitest"

import { isGoogleLinkedUser } from "./oauth-provider"

describe("isGoogleLinkedUser", () => {
  it("returns false for null user", () => {
    expect(isGoogleLinkedUser(null)).toBe(false)
  })

  it("returns false when no identities exist", () => {
    const user = { identities: [] } as unknown as User
    expect(isGoogleLinkedUser(user)).toBe(false)
  })

  it("returns true when a google identity exists", () => {
    const user = {
      identities: [{ provider: "email" }, { provider: "google" }],
    } as unknown as User
    expect(isGoogleLinkedUser(user)).toBe(true)
  })

  it("returns true when app_metadata provider is google", () => {
    const user = {
      app_metadata: { provider: "google" },
      identities: [],
    } as unknown as User
    expect(isGoogleLinkedUser(user)).toBe(true)
  })
})
