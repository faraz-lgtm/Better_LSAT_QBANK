import { describe, expect, it } from "vitest"

import {
  getAccountNameTypingError,
  getAccountPhoneTypingError,
  validateAccountNameParts,
  validateAccountPhone,
} from "./profile-field-validation"

describe("validateAccountNameParts", () => {
  it("requires first and last name", () => {
    expect(validateAccountNameParts("", "Siyi")).toBe("First and last name are required.")
    expect(validateAccountNameParts("Assad", "  ")).toBe("First and last name are required.")
  })

  it("rejects digits in either name part", () => {
    expect(validateAccountNameParts("Assad1212", "Siyi")).toBe("Name cannot include numbers.")
    expect(validateAccountNameParts("Assad", "Siyi2")).toBe("Name cannot include numbers.")
  })

  it("allows letter names with punctuation", () => {
    expect(validateAccountNameParts("Mary-Jane", "O'Brien")).toBeNull()
  })
})

describe("getAccountNameTypingError", () => {
  it("flags digits while typing without requiring both parts yet", () => {
    expect(getAccountNameTypingError("Assad1212", "")).toBe("Name cannot include numbers.")
    expect(getAccountNameTypingError("Assad", "Ulyat")).toBeNull()
  })
})

describe("validateAccountPhone", () => {
  it("requires a value", () => {
    expect(validateAccountPhone("   ")).toBe("Phone is required.")
  })

  it("rejects letters", () => {
    expect(validateAccountPhone("aaa1133")).toBe("Phone number cannot include letters.")
    expect(validateAccountPhone("sdsdd3434")).toBe("Phone number cannot include letters.")
  })

  it("rejects values that are not phone-shaped", () => {
    expect(validateAccountPhone("555-12#99")).toBe("Enter a valid phone number.")
    expect(validateAccountPhone("123")).toBe("Enter a valid phone number.")
  })

  it("allows formatted phone numbers", () => {
    expect(validateAccountPhone("+1 555 987 6543")).toBeNull()
    expect(validateAccountPhone("(555) 123-4567")).toBeNull()
  })
})

describe("getAccountPhoneTypingError", () => {
  it("allows empty and short numeric values while typing", () => {
    expect(getAccountPhoneTypingError("")).toBeNull()
    expect(getAccountPhoneTypingError("14")).toBeNull()
  })

  it("shows letter and symbol errors immediately", () => {
    expect(getAccountPhoneTypingError("sdsdd3434")).toBe("Phone number cannot include letters.")
    expect(getAccountPhoneTypingError("555#99")).toBe("Enter a valid phone number.")
  })
})
