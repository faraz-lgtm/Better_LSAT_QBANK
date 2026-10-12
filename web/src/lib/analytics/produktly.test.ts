import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { clearProduktlyUser, identifyProduktlyUser } from "./produktly"

describe("produktly helpers", () => {
  const identifyUser = vi.fn()
  const clearCurrentUser = vi.fn()

  beforeEach(() => {
    identifyUser.mockReset()
    clearCurrentUser.mockReset()
    window.Produktly = {
      identifyUser,
      clearCurrentUser,
      configure: vi.fn(),
    }
  })

  afterEach(() => {
    delete window.Produktly
  })

  it("identifyProduktlyUser forwards id and metadata", () => {
    identifyProduktlyUser("user-1", { email: "a@b.com", plan: "pro" })
    expect(identifyUser).toHaveBeenCalledWith("user-1", {
      email: "a@b.com",
      plan: "pro",
    })
  })

  it("identifyProduktlyUser no-ops for empty user id", () => {
    identifyProduktlyUser("")
    expect(identifyUser).not.toHaveBeenCalled()
  })

  it("clearProduktlyUser calls clearCurrentUser", () => {
    clearProduktlyUser()
    expect(clearCurrentUser).toHaveBeenCalledTimes(1)
  })

  it("helpers no-op when Produktly is missing", () => {
    delete window.Produktly
    expect(() => identifyProduktlyUser("user-1")).not.toThrow()
    expect(() => clearProduktlyUser()).not.toThrow()
  })
})
