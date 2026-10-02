import { describe, expect, it } from "vitest"

import {
  defaultPrepTestPoolMembership,
  membershipEquals,
  resolvePrepTestPoolMembership,
} from "@/lib/prep-test-pool-defaults"

describe("prep-test-pool-defaults", () => {
  it("assigns drill-only for PT100–122", () => {
    expect(defaultPrepTestPoolMembership(100)).toEqual({
      inDrills: true,
      inSections: false,
      inTests: false,
    })
    expect(defaultPrepTestPoolMembership(122)).toEqual({
      inDrills: true,
      inSections: false,
      inTests: false,
    })
  })

  it("assigns all pools for PT123–152", () => {
    expect(defaultPrepTestPoolMembership(123)).toEqual({
      inDrills: true,
      inSections: true,
      inTests: true,
    })
    expect(defaultPrepTestPoolMembership(152)).toEqual({
      inDrills: true,
      inSections: true,
      inTests: true,
    })
  })

  it("assigns tests-only for PT153+", () => {
    expect(defaultPrepTestPoolMembership(153)).toEqual({
      inDrills: false,
      inSections: false,
      inTests: true,
    })
    expect(defaultPrepTestPoolMembership(159)).toEqual({
      inDrills: false,
      inSections: false,
      inTests: true,
    })
  })

  it("resolves override over default", () => {
    const override = { inDrills: false, inSections: true, inTests: false }
    expect(resolvePrepTestPoolMembership(100, override)).toEqual(override)
    expect(resolvePrepTestPoolMembership(100, null)).toEqual(defaultPrepTestPoolMembership(100))
  })

  it("compares membership flags", () => {
    expect(
      membershipEquals(
        { inDrills: true, inSections: false, inTests: false },
        { inDrills: true, inSections: false, inTests: false },
      ),
    ).toBe(true)
    expect(
      membershipEquals(
        { inDrills: true, inSections: false, inTests: false },
        { inDrills: false, inSections: false, inTests: false },
      ),
    ).toBe(false)
  })
})
