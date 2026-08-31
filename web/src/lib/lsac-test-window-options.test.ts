import { describe, expect, it } from "vitest"

import {
  findLsacTestWindow,
  formatLsacTestWindowMeta,
  resolveLsacTestWindowValue,
  toLsacSelectOptions,
} from "@/lib/lsac-test-window-options"

describe("lsac-test-window-options", () => {
  it("lists official LSAC registration windows", () => {
    const options = toLsacSelectOptions()
    expect(options).toEqual([
      { label: "September 2026: Test dates Sep 9–12, 2026", value: "2026-09-09" },
      { label: "October 2026: Test dates Oct 7–10, 2026", value: "2026-10-07" },
      { label: "November 2026: Test dates Nov 11–14, 2026", value: "2026-11-11" },
      { label: "January 2027: Test dates Jan 13–16, 2027", value: "2027-01-13" },
      { label: "February 2027: Test dates Feb 12–13, 2027", value: "2027-02-12" },
      { label: "April 2027: Test dates Apr 8–10, 2027", value: "2027-04-08" },
      { label: "June 2027: Test dates Jun 9–12, 2027", value: "2027-06-09" },
    ])
  })

  it("matches legacy first-of-month values to official windows", () => {
    expect(findLsacTestWindow("2026-11-01")?.value).toBe("2026-11-11")
    expect(resolveLsacTestWindowValue("2026-11-01", null)).toBe("2026-11-11")
  })

  it("formats meta with official date ranges", () => {
    expect(formatLsacTestWindowMeta("2026-11-11")).toBe("LSAC · Nov 11–14, 2026")
    expect(formatLsacTestWindowMeta("2026-11-01")).toBe("LSAC · Nov 11–14, 2026")
  })
})
