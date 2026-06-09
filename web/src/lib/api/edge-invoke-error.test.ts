import { FunctionsHttpError } from "@supabase/functions-js"
import { describe, expect, it } from "vitest"

import { throwIfEdgeInvokeFailed } from "@/lib/api/edge-invoke-error"

describe("throwIfEdgeInvokeFailed", () => {
  it("throws message from edge function JSON body", async () => {
    const err = new FunctionsHttpError(
      new Response(JSON.stringify({ error: "No PrepTest question is linked" }), { status: 400 }),
    )
    await expect(throwIfEdgeInvokeFailed(err)).rejects.toThrow("No PrepTest question is linked")
  })
})
