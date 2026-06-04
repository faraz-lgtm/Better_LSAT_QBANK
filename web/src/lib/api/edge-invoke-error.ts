import { FunctionsHttpError } from "@supabase/functions-js"

/** Surfaces `{ error: string }` bodies from Supabase edge function responses. */
export async function throwIfEdgeInvokeFailed(error: unknown): Promise<never> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = (await error.context.json()) as { error?: string }
      if (typeof payload?.error === "string" && payload.error.trim().length > 0) {
        throw new Error(payload.error.trim())
      }
    } catch (nested) {
      if (nested instanceof Error && nested.message !== error.message) throw nested
    }
  }
  throw error instanceof Error ? error : new Error("Request failed")
}
