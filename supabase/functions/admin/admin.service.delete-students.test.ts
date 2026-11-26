import { assertEquals } from "jsr:@std/assert@1"

import { createAdminService } from "./admin.service.ts"

Deno.test("deleteStudents soft-deletes students and skips self / non-students", async () => {
  const softDeleted: string[] = []
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      getStudentRole: async (id: string) => {
        if (id === "missing") return null
        if (id === "admin-peer") return { id, role: "admin", deleted_at: null }
        if (id === "already-gone") {
          return { id, role: "student", deleted_at: "2026-11-01T00:00:00.000Z" }
        }
        return { id, role: "student", deleted_at: null }
      },
      softDeleteStudent: async (id: string) => {
        softDeleted.push(id)
      },
    } as never,
  })

  const out = await service.deleteStudents("admin-1", [
    "admin-1",
    "student-a",
    "admin-peer",
    "missing",
    "already-gone",
    "student-b",
  ])

  assertEquals(softDeleted, ["student-a", "student-b"])
  assertEquals(out.deleted, 3) // student-a, already-gone (idempotent), student-b
  assertEquals(out.errors.length, 3)
  assertEquals(out.errors.some((e) => e.includes("cannot delete yourself")), true)
  assertEquals(out.errors.some((e) => e.includes("only student")), true)
  assertEquals(out.errors.some((e) => e.includes("not found")), true)
})
