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
  const closeTour = vi.fn()
  const openFeedback = vi.fn()
  const closeFeedback = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    identifyUser.mockReset()
    clearCurrentUser.mockReset()
    startTour.mockReset()
    closeTour.mockReset()
    openFeedback.mockReset()
    closeFeedback.mockReset()
    clearProduktlyUser()
    clearCurrentUser.mockReset()
    document.getElementById("produktly-card-iframe")?.remove()
    window.Produktly = {
      identifyUser,
      clearCurrentUser,
      configure: vi.fn(),
      startTour,
      closeTour,
      openFeedback,
      closeFeedback,
    }
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    clearProduktlyUser()
    document.getElementById("produktly-card-iframe")?.remove()
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

  it("startProduktlyTour closes any open tour then forwards params", () => {
    startProduktlyTour({ tourId: 99, stepIndex: 2 })
    expect(closeTour).toHaveBeenCalledWith({ id: 99 })
    expect(startTour).toHaveBeenCalledWith({
      tourId: 99,
      stepIndex: 2,
      respectAllTourSettings: false,
    })
  })

  it("startProduktlyTour defaults to step 0 and ignores once-per-user settings", () => {
    startProduktlyTour({ tourId: 99, clearProgress: true })
    expect(startTour).toHaveBeenCalledWith({
      tourId: 99,
      stepIndex: 0,
      respectAllTourSettings: false,
      clearProgress: true,
      refreshToken: expect.any(Number),
    })
  })

  it("startProduktlyTour bumps refreshToken on every retry when clearing progress", () => {
    startProduktlyTour({ tourId: 99, clearProgress: true, refreshToken: "manual" })
    expect(startTour).toHaveBeenCalledWith(
      expect.objectContaining({
        tourId: 99,
        clearProgress: true,
        refreshToken: expect.any(Number),
      }),
    )
  })

  it("startProduktlyTour no-ops for empty tour id", () => {
    startProduktlyTour({ tourId: 0 })
    expect(startTour).not.toHaveBeenCalled()
    expect(closeTour).not.toHaveBeenCalled()
  })

  it("startProduktlyTour retries until the tour card iframe mounts", () => {
    startTour.mockImplementation(() => {
      if (startTour.mock.calls.length >= 3) {
        const iframe = document.createElement("iframe")
        iframe.id = "produktly-card-iframe"
        document.body.appendChild(iframe)
      }
    })

    startProduktlyTour({ tourId: 99, clearProgress: true })
    expect(closeTour).toHaveBeenCalledWith({ id: 99 })
    expect(startTour).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(250)
    expect(startTour).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(250)
    expect(startTour).toHaveBeenCalledTimes(3)

    vi.advanceTimersByTime(1000)
    expect(startTour).toHaveBeenCalledTimes(3)
  })

  it("startProduktlyTour does not treat a pre-existing iframe as success", () => {
    const iframe = document.createElement("iframe")
    iframe.id = "produktly-card-iframe"
    document.body.appendChild(iframe)

    closeTour.mockImplementation(() => {
      document.getElementById("produktly-card-iframe")?.remove()
    })

    startTour.mockImplementation(() => {
      if (startTour.mock.calls.length >= 2) {
        const next = document.createElement("iframe")
        next.id = "produktly-card-iframe"
        document.body.appendChild(next)
      }
    })

    startProduktlyTour({ tourId: 99, clearProgress: true })
    expect(closeTour).toHaveBeenCalledWith({ id: 99 })
    expect(document.getElementById("produktly-card-iframe")).toBeNull()
    expect(startTour).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(250)
    expect(startTour).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(250)
    expect(startTour).toHaveBeenCalledTimes(2)
    expect(document.getElementById("produktly-card-iframe")).toBeTruthy()
  })

  it("startProduktlyTour stops retrying after max attempts when the card never mounts", () => {
    startProduktlyTour({ tourId: 99, clearProgress: true })
    vi.advanceTimersByTime(250 * 10)
    expect(startTour).toHaveBeenCalledTimes(8)
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
