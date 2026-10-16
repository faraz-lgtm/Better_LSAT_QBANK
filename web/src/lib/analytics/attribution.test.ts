import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  BL_ATTR_COOKIE,
  captureAttributionFromUrl,
  mergeFirstTouch,
  parseBlAttrCookie,
  parseCookieValue,
  readAttribution,
} from "./attribution"

describe("attribution helpers", () => {
  beforeEach(() => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      writable: true,
      value: "",
    })
    vi.stubGlobal("location", {
      hostname: "app.betterlsat.com",
      protocol: "https:",
      origin: "https://app.betterlsat.com",
      pathname: "/signup",
      search: "",
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("parseCookieValue reads a named cookie", () => {
    expect(parseCookieValue("a=1; bl_attr=%7B%22gclid%22%3A%22x%22%7D; b=2", BL_ATTR_COOKIE)).toBe(
      '{"gclid":"x"}',
    )
  })

  it("parseBlAttrCookie returns null for invalid JSON", () => {
    expect(parseBlAttrCookie("not-json")).toBeNull()
  })

  it("mergeFirstTouch does not overwrite existing keys", () => {
    const merged = mergeFirstTouch(
      { gclid: "first", utm_source: "ads" },
      { gclid: "second", utm_medium: "cpc" },
    )
    expect(merged.gclid).toBe("first")
    expect(merged.utm_source).toBe("ads")
    expect(merged.utm_medium).toBe("cpc")
    expect(merged.captured_at).toBeTruthy()
  })

  it("captureAttributionFromUrl writes first-touch bl_attr", () => {
    captureAttributionFromUrl("?utm_source=google&gclid=abc")
    expect(document.cookie).toContain(BL_ATTR_COOKIE)
    const again = captureAttributionFromUrl("?utm_source=bing&gclid=xyz")
    expect(again?.utm_source).toBe("google")
    expect(again?.gclid).toBe("abc")
  })

  it("captureAttributionFromUrl first-touch landing_page even without UTMs", () => {
    vi.stubGlobal("location", {
      hostname: "app.betterlsat.com",
      protocol: "https:",
      origin: "https://app.betterlsat.com",
      pathname: "/signup",
      search: "?plan=monthly",
    })
    const first = captureAttributionFromUrl("?plan=monthly")
    expect(first?.landing_page).toBe("https://app.betterlsat.com/signup?plan=monthly")

    vi.stubGlobal("location", {
      hostname: "app.betterlsat.com",
      protocol: "https:",
      origin: "https://app.betterlsat.com",
      pathname: "/pricing",
      search: "?utm_source=bing",
    })
    const again = captureAttributionFromUrl("?utm_source=bing")
    expect(again?.landing_page).toBe("https://app.betterlsat.com/signup?plan=monthly")
    expect(again?.utm_source).toBe("bing")
  })

  it("readAttribution merges click cookies", () => {
    document.cookie = `${BL_ATTR_COOKIE}=${encodeURIComponent(JSON.stringify({ utm_source: "meta" }))}`
    document.cookie += "; _fbp=fb.1.1; _fbc=fb.1.2; _gcl_aw=GCL.1"
    // jsdom/document.cookie assignment quirks: set via parse path
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () =>
        `${BL_ATTR_COOKIE}=${encodeURIComponent(JSON.stringify({ utm_source: "meta" }))}; _fbp=fb.1.1; _fbc=fb.1.2; _gcl_aw=GCL.1`,
      set: () => {},
    })
    const attr = readAttribution()
    expect(attr.utm_source).toBe("meta")
    expect(attr.fbp).toBe("fb.1.1")
    expect(attr.fbc).toBe("fb.1.2")
    expect(attr.gcl_aw).toBe("GCL.1")
  })
})
