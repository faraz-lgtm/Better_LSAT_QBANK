import type { Session, User } from "@supabase/supabase-js"
import { describe, expect, it } from "vitest"

import { sessionUsedPasswordAuth, userNeedsPasswordSetup } from "./password-setup"

function jwtWithAmr(amr: Array<{ method: string; timestamp?: number }>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
  const payload = btoa(JSON.stringify({ amr }))
  return `${header}.${payload}.sig`
}

function sessionWithAmr(amr: Array<{ method: string }>): Session {
  return {
    access_token: jwtWithAmr(amr),
    refresh_token: "refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: { id: "u-1" } as User,
  }
}

describe("password-setup", () => {
  it("sessionUsedPasswordAuth is true when amr includes password", () => {
    expect(sessionUsedPasswordAuth(sessionWithAmr([{ method: "password" }]))).toBe(true)
  })

  it("sessionUsedPasswordAuth is false for otp-only sessions", () => {
    expect(sessionUsedPasswordAuth(sessionWithAmr([{ method: "otp" }]))).toBe(false)
  })

  it("userNeedsPasswordSetup is false for password sign-in", () => {
    const user = {
      id: "u-1",
      app_metadata: { provider: "email" },
      identities: [{ provider: "email" }],
    } as User
    expect(userNeedsPasswordSetup(user, sessionWithAmr([{ method: "password" }]))).toBe(false)
  })

  it("userNeedsPasswordSetup is true for magic-link sign-in", () => {
    const user = {
      id: "u-1",
      app_metadata: { provider: "email" },
      identities: [{ provider: "email" }],
    } as User
    expect(userNeedsPasswordSetup(user, sessionWithAmr([{ method: "otp" }]))).toBe(true)
  })

  it("userNeedsPasswordSetup is false for Google users", () => {
    const user = {
      id: "u-1",
      app_metadata: { provider: "google" },
      identities: [{ provider: "google" }],
    } as User
    expect(userNeedsPasswordSetup(user, sessionWithAmr([{ method: "oauth" }]))).toBe(false)
  })
})
