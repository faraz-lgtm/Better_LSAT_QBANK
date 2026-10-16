import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearProduktlyUser,
  closeProduktlyFeedback,
  identifyProduktlyUser,
  openProduktlyFeedback,
  startProduktlyTour,
} from "./produktly"

describe("produktly helpers", () => {
  const identifyUser = vi.fn()
  const clearCurrentUser = vi.fn()
  const startTour = vi.fn()
  const openFeedback = vi.fn()
  const closeFeedback = vi.fn()

  beforeEach(() => {
    identifyUser.mockReset()
    clearCurrentUser.mockReset()
    startTour.mockReset()
    openFeedback.mockReset()
    closeFeedback.mockReset()
    clearProduktlyUser()
    clearCurrentUser.mockReset()
    window.Produktly = {
      identifyUser,
      clearCurrentUser,
      configure: vi.fn(),
      startTour,
      openFeedback,
      closeFeedback,
    }
  })

  afterEach(() => {
    clearProduktlyUser()
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

  it("identifyProduktlyUser skips duplicate identify for the same user id", () => {
    identifyProduktlyUser("user-1", { email: "a@b.com" })
    identifyProduktlyUser("user-1", { email: "a@b.com" })
    identifyProduktlyUser("user-1", { email: "other@b.com" })
    expect(identifyUser).toHaveBeenCalledTimes(1)
  })

  it("identifyProduktlyUser re-identifies after clear or user switch", () => {
    identifyProduktlyUser("user-1")
    clearProduktlyUser()
    identifyProduktlyUser("user-1")
    identifyProduktlyUser("user-2")
    expect(identifyUser).toHaveBeenCalledTimes(3)
    expect(identifyUser).toHaveBeenNthCalledWith(3, "user-2", undefined)
  })

  it("clearProduktlyUser calls clearCurrentUser", () => {
    clearProduktlyUser()
    expect(clearCurrentUser).toHaveBeenCalledTimes(1)
  })

  it("helpers no-op when Produktly is missing", () => {
    delete window.Produktly
    expect(() => identifyProduktlyUser("user-1")).not.toThrow()
    expect(() => clearProduktlyUser()).not.toThrow()
    expect(() => startProduktlyTour({ tourId: 99 })).not.toThrow()
    expect(() => openProduktlyFeedback(2722)).not.toThrow()
    expect(() => closeProduktlyFeedback(2722)).not.toThrow()
  })

  it("startProduktlyTour forwards params", () => {
    startProduktlyTour({ tourId: 99, stepIndex: 2 })
    expect(startTour).toHaveBeenCalledWith({ tourId: 99, stepIndex: 2 })
  })

  it("startProduktlyTour adds refreshToken when clearing progress so dismissed tours restart", () => {
    startProduktlyTour({ tourId: 99, clearProgress: true })
    expect(startTour).toHaveBeenCalledWith({
      tourId: 99,
      clearProgress: true,
      refreshToken: expect.any(Number),
    })
  })

  it("startProduktlyTour keeps an explicit refreshToken when clearing progress", () => {
    startProduktlyTour({ tourId: 99, clearProgress: true, refreshToken: "manual" })
    expect(startTour).toHaveBeenCalledWith({
      tourId: 99,
      clearProgress: true,
      refreshToken: "manual",
    })
  })

  it("startProduktlyTour no-ops for empty tour id", () => {
    startProduktlyTour({ tourId: 0 })
    expect(startTour).not.toHaveBeenCalled()
  })

  it("openProduktlyFeedback forwards id", () => {
    openProduktlyFeedback(2722)
    expect(openFeedback).toHaveBeenCalledWith({ id: 2722, ignorePublish: true })
  })

  it("closeProduktlyFeedback forwards id", () => {
    closeProduktlyFeedback(2722)
    expect(closeFeedback).toHaveBeenCalledWith({ id: 2722 })
  })
})
