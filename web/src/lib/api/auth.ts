import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js"

import { throwIfEdgeInvokeFailed } from "@/lib/api/edge-invoke-error"

/**
 * Centralized auth API wrapper for UI pages.
 */
export function createAuthApi(supabase: SupabaseClient) {
  return {
    async checkEmailExists(email: string): Promise<boolean> {
      const { data, error } = await supabase.functions.invoke<{ exists?: boolean; error?: string }>(
        "auth-check-email",
        {
          method: "POST",
          body: { email: email.trim().toLowerCase() },
        },
      )
      if (error) await throwIfEdgeInvokeFailed(error)
      if (data && typeof data.error === "string" && data.error.trim()) {
        throw new Error(data.error.trim())
      }
      return Boolean(data?.exists)
    },

    async sendMagicLink(
      email: string,
      redirectTo: string,
      data?: Record<string, unknown>,
    ): Promise<void> {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          ...(data && Object.keys(data).length > 0 ? { data } : {}),
        },
      })
      if (error) throw error
    },

    async signInWithPassword(email: string, password: string): Promise<void> {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    },

    async signInWithGoogle(
      redirectTo: string,
      data?: Record<string, unknown>,
    ): Promise<void> {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          ...(data && Object.keys(data).length > 0 ? { data } : {}),
        },
      })
      if (error) throw error
    },

    async sendPasswordResetEmail(email: string, redirectTo: string): Promise<void> {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (error) throw error
    },

    async exchangeCodeForSession(code: string): Promise<void> {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    },

    /** Email magic-link / recovery via token_hash (works cross-browser; no PKCE verifier). */
    async verifyOtpWithTokenHash(tokenHash: string, type: EmailOtpType): Promise<void> {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })
      if (error) throw error
    },

    async hasSession(): Promise<boolean> {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return Boolean(data.session)
    },

    async getSession() {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session
    },

    async getCurrentUser() {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      return data.user
    },

    async updatePassword(newPassword: string): Promise<void> {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
  }
}

export function getAuthCallbackUrl() {
  return `${window.location.origin}/auth/callback`
}

export function getPasswordResetCallbackUrl() {
  return `${window.location.origin}/auth/callback?type=recovery`
}
