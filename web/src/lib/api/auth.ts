import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Centralized auth API wrapper for UI pages.
 */
export function createAuthApi(supabase: SupabaseClient) {
  return {
    async sendMagicLink(email: string, redirectTo: string): Promise<void> {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
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

    async signInWithGoogle(redirectTo: string): Promise<void> {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })
      if (error) throw error
    },

    async exchangeCodeForSession(code: string): Promise<void> {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    },

    async hasSession(): Promise<boolean> {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return Boolean(data.session)
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
