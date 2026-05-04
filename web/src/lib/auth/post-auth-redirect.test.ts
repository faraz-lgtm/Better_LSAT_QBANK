import { describe, expect, it } from "vitest"

import { getPostAuthDestination } from "./post-auth-redirect"

describe("getPostAuthDestination", () => {
  it("returns onboarding when profile is missing", () => {
    expect(getPostAuthDestination(null)).toBe("/onboarding")
  })

  it("returns onboarding when student is first-time login", () => {
    expect(
      getPostAuthDestination({
        id: "u-1",
        email: "x@example.com",
        full_name: "X",
        role: "student",
        student_coaching_id: null,
        is_first_time_login: true,
        created_at: "",
        updated_at: "",
      }),
    ).toBe("/onboarding")
  })

  it("returns app when student is not first-time login", () => {
    expect(
      getPostAuthDestination({
        id: "u-1",
        email: "x@example.com",
        full_name: "X",
        role: "student",
        student_coaching_id: "coach-123",
        is_first_time_login: false,
        created_at: "",
        updated_at: "",
      }),
    ).toBe("/app")
  })
})
