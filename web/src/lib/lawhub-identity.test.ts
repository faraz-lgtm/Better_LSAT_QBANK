import { describe, expect, it } from "vitest"

import { emailAllowsLawHub, profileHasLawHubName, splitFullName } from "./lawhub-identity"

describe("lawhub-identity", () => {
  it("splitFullName requires two parts for LawHub", () => {
    expect(splitFullName("Ada Lovelace")).toEqual({ firstName: "Ada", lastName: "Lovelace" })
    expect(splitFullName("Prince")).toEqual({ firstName: "Prince", lastName: "" })
  })

  it("profileHasLawHubName accepts explicit or full name parts", () => {
    expect(profileHasLawHubName({ first_name: "Ada", last_name: "Lovelace" })).toBe(true)
    expect(profileHasLawHubName({ full_name: "Ada Lovelace" })).toBe(true)
    expect(profileHasLawHubName({ full_name: "Prince" })).toBe(false)
    expect(profileHasLawHubName(null)).toBe(false)
  })

  it("emailAllowsLawHub rejects plus tags", () => {
    expect(emailAllowsLawHub("ada@example.com")).toBe(true)
    expect(emailAllowsLawHub("ada+lsat@example.com")).toBe(false)
  })
})
