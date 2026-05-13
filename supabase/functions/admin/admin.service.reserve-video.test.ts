import { assertEquals, assertRejects } from "jsr:@std/assert@1"

import { QUESTION_EXPLANATION_VIDEOS_BUCKET } from "../_shared/question-explanation-videos.ts"
import { createAdminService } from "./admin.service.ts"

Deno.test("reserveQuestionVideoUpload returns bucket path and public URL", async () => {
  const prev = Deno.env.get("SUPABASE_URL")
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co")
  try {
    const service = createAdminService({
      repository: {
        getProfileRole: async () => "admin",
        adminQuestionExists: async () => true,
      } as never,
    })
    const qid = "11111111-1111-1111-1111-111111111111"
    const out = await service.reserveQuestionVideoUpload("user-1", qid, "webm")
    assertEquals(out.bucket, QUESTION_EXPLANATION_VIDEOS_BUCKET)
    assertEquals(out.path.startsWith(`${qid}/`), true)
    assertEquals(out.path.endsWith(".webm"), true)
    assertEquals(
      out.publicUrl.startsWith(`https://example.supabase.co/storage/v1/object/public/${QUESTION_EXPLANATION_VIDEOS_BUCKET}/`),
      true,
    )
  } finally {
    if (prev === undefined) Deno.env.delete("SUPABASE_URL")
    else Deno.env.set("SUPABASE_URL", prev)
  }
})

Deno.test("reserveQuestionVideoUpload rejects unknown extension", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co")
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      adminQuestionExists: async () => true,
    } as never,
  })
  await assertRejects(
    () => service.reserveQuestionVideoUpload("user-1", "11111111-1111-1111-1111-111111111111", "exe"),
    Error,
    "Invalid file extension",
  )
})

Deno.test("reserveQuestionVideoUpload rejects missing question", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co")
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      adminQuestionExists: async () => false,
    } as never,
  })
  await assertRejects(
    () => service.reserveQuestionVideoUpload("user-1", "11111111-1111-1111-1111-111111111111", "webm"),
    Error,
    "Question not found",
  )
})
