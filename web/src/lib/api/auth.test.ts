import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"
import { createAuthApi } from "./auth"

function mockSupabase(authOverrides: Record<string, ReturnType<typeof vi.fn>>): SupabaseClient {
  return {
    auth: authOverrides,
  } as unknown as SupabaseClient
}

describe("createAuthApi", () => {
  it("sendMagicLink calls signInWithOtp with redirect", async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
    const api = createAuthApi(mockSupabase({ signInWithOtp }))

    await api.sendMagicLink("test@example.com", "http://localhost:5173/auth/callback")

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      options: { emailRedirectTo: "http://localhost:5173/auth/callback" },
    })
  })

  it("signInWithPassword calls password auth", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null })
    const api = createAuthApi(mockSupabase({ signInWithPassword }))

    await api.signInWithPassword("test@example.com", "secret-password")

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "secret-password",
    })
  })

  it("signInWithGoogle calls oauth with google provider", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ error: null })
    const api = createAuthApi(mockSupabase({ signInWithOAuth }))

    await api.signInWithGoogle("http://localhost:5173/auth/callback")

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "http://localhost:5173/auth/callback" },
    })
  })

  it("getCurrentUser returns authenticated user", async () => {
    const user = { id: "u-1", email: "u@example.com" }
    const getUser = vi.fn().mockResolvedValue({ data: { user }, error: null })
    const api = createAuthApi(mockSupabase({ getUser }))

    const out = await api.getCurrentUser()

    expect(out).toEqual(user)
  })

  it("updatePassword calls updateUser with password", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    const api = createAuthApi(mockSupabase({ updateUser }))

    await api.updatePassword("super-secret")

    expect(updateUser).toHaveBeenCalledWith({ password: "super-secret" })
  })

  it("sendPasswordResetEmail calls resetPasswordForEmail with redirect", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null })
    const api = createAuthApi(mockSupabase({ resetPasswordForEmail }))

    await api.sendPasswordResetEmail(
      "user@example.com",
      "http://localhost:5173/auth/callback?type=recovery",
    )

    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "http://localhost:5173/auth/callback?type=recovery",
    })
  })

  it("sendPasswordResetEmail surfaces supabase error", async () => {
    const resetPasswordForEmail = vi
      .fn()
      .mockResolvedValue({ error: new Error("rate limit") })
    const api = createAuthApi(mockSupabase({ resetPasswordForEmail }))

    await expect(
      api.sendPasswordResetEmail("user@example.com", "http://localhost/cb"),
    ).rejects.toThrow("rate limit")
  })
})
