import { assertEquals, assertRejects } from "jsr:@std/assert@1"

import { AuthorizationError, createAdminService } from "./admin.service.ts"

Deno.test("impersonateStudent rejects non-admin", async () => {
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "student",
    } as never,
  })
  await assertRejects(
    () => service.impersonateStudent("user-1", "student-1"),
    AuthorizationError,
  )
})

Deno.test("impersonateStudent rejects missing / admin / deleted targets", async () => {
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      getImpersonationTargetProfile: async (id: string) => {
        if (id === "missing") return null
        if (id === "admin-peer") {
          return { id, email: "a@x.com", full_name: "Admin", role: "admin", deleted_at: null }
        }
        if (id === "gone") {
          return {
            id,
            email: "g@x.com",
            full_name: "Gone",
            role: "student",
            deleted_at: "2026-11-01T00:00:00.000Z",
          }
        }
        return {
          id,
          email: "s@x.com",
          full_name: "Student",
          role: "student",
          deleted_at: null,
        }
      },
      generateMagicLinkTokenHash: async () => "hash",
      insertImpersonationEvent: async () => undefined,
    } as never,
  })

  await assertRejects(() => service.impersonateStudent("admin-1", "missing"), Error, "Student not found")
  await assertRejects(
    () => service.impersonateStudent("admin-1", "admin-peer"),
    Error,
    "Cannot impersonate an admin account",
  )
  await assertRejects(
    () => service.impersonateStudent("admin-1", "gone"),
    Error,
    "Cannot impersonate a deleted student",
  )
  await assertRejects(
    () => service.impersonateStudent("admin-1", "admin-1"),
    Error,
    "Cannot impersonate yourself",
  )
})

Deno.test("impersonateStudent returns token hash and writes start audit", async () => {
  const events: Array<{
    action: string
    studentUserId: string
    adminUserId: string
    userAgent?: string | null
  }> = []
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "super_admin",
      getImpersonationTargetProfile: async (id: string) => ({
        id,
        email: "student@example.com",
        full_name: "Pat Student",
        role: "student",
        deleted_at: null,
      }),
      generateMagicLinkTokenHash: async (email: string) => {
        assertEquals(email, "student@example.com")
        return "token-hash-abc"
      },
      insertImpersonationEvent: async (input: {
        adminUserId: string
        studentUserId: string
        action: "start" | "end"
        userAgent?: string | null
      }) => {
        events.push(input)
      },
    } as never,
  })

  const out = await service.impersonateStudent("admin-1", "student-1", { userAgent: "test-ua" })
  assertEquals(out.tokenHash, "token-hash-abc")
  assertEquals(out.student, {
    id: "student-1",
    email: "student@example.com",
    full_name: "Pat Student",
  })
  assertEquals(events, [
    { adminUserId: "admin-1", studentUserId: "student-1", action: "start", userAgent: "test-ua" },
  ])
})

Deno.test("endImpersonation writes end audit after requireAdmin", async () => {
  const events: Array<{ action: string }> = []
  const service = createAdminService({
    repository: {
      getProfileRole: async () => "admin",
      insertImpersonationEvent: async (input: { action: "start" | "end" }) => {
        events.push({ action: input.action })
      },
    } as never,
  })

  const out = await service.endImpersonation("admin-1", "student-1")
  assertEquals(out, { success: true })
  assertEquals(events, [{ action: "end" }])
})
