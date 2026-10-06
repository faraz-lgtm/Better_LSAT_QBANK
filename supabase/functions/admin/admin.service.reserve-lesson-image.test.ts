import { assertEquals, assertRejects } from "jsr:@std/assert@1"

import { LESSON_IMAGES_BUCKET } from "../_shared/lesson-images.ts"
import { createAdminService } from "./admin.service.ts"

Deno.test("reserveLessonImageUpload returns bucket path and public URL", async () => {
  const prev = Deno.env.get("SUPABASE_URL")
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co")
  try {
    const service = createAdminService({
      repository: {
        getProfileRole: async () => "admin",
        getCourseById: async () => ({ id: "course-1" }),
      } as never,
    })
    const courseId = "11111111-1111-1111-1111-111111111111"
    const out = await service.reserveLessonImageUpload("user-1", courseId, "png")
    assertEquals(out.bucket, LESSON_IMAGES_BUCKET)
    assertEquals(out.path.startsWith(`${courseId}/`), true)
    assertEquals(out.path.endsWith(".png"), true)
    assertEquals(
      out.publicUrl.startsWith(`https://example.supabase.co/storage/v1/object/public/${LESSON_IMAGES_BUCKET}/`),
      true,
    )
  } finally {
    if (prev === undefined) Deno.env.delete("SUPABASE_URL")
    else Deno.env.set("SUPABASE_URL", prev)
  }
})

Deno.test("reserveLessonImageUpload normalizes jpeg to jpg", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co")
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      getCourseById: async () => ({ id: "course-1" }),
    } as never,
  })
  const out = await service.reserveLessonImageUpload(
    "user-1",
    "11111111-1111-1111-1111-111111111111",
    "jpeg",
  )
  assertEquals(out.path.endsWith(".jpg"), true)
})

Deno.test("reserveLessonImageUpload rejects unknown extension", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co")
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      getCourseById: async () => ({ id: "course-1" }),
    } as never,
  })
  await assertRejects(
    () => service.reserveLessonImageUpload("user-1", "11111111-1111-1111-1111-111111111111", "exe"),
    Error,
    "Invalid file extension",
  )
})

Deno.test("reserveLessonImageUpload rejects missing course", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co")
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      getCourseById: async () => null,
    } as never,
  })
  await assertRejects(
    () => service.reserveLessonImageUpload("user-1", "11111111-1111-1111-1111-111111111111", "png"),
    Error,
    "Course not found",
  )
})
