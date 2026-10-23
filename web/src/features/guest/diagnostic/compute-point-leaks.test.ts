import { describe, expect, it } from 'vitest'

import {
  computePointLeaks,
  recoverablePoints,
} from '@/features/guest/diagnostic/compute-point-leaks'
import { buildDefaultGuestDiagnosticResult } from '@/features/guest/diagnostic/guest-diagnostic-result-storage'

describe('recoverablePoints', () => {
  it('returns missed count for single-item Mini groups (no miss-rate bonus)', () => {
    expect(recoverablePoints(1, 1)).toBe(1)
  })

  it('skips miss-rate bonus when total is under 3', () => {
    expect(recoverablePoints(1, 2)).toBe(1)
    expect(recoverablePoints(2, 2)).toBe(2)
  })

  it('returns missed when miss rate is at most 0.6 with enough sample', () => {
    expect(recoverablePoints(3, 5)).toBe(3)
  })

  it('adds +1 when miss rate is above 0.6 and total >= 3', () => {
    expect(recoverablePoints(3, 4)).toBe(4)
  })
})

describe('computePointLeaks', () => {
  it('gives +1 per Mini leak when each type appears once', () => {
    const result = buildDefaultGuestDiagnosticResult('mini')
    // Default mini: first 3 correct, rest missed → 7 unique missed types
    const leaks = computePointLeaks(result.outcomes, 'mini')
    expect(leaks.length).toBe(7)
    for (const leak of leaks) {
      expect(leak.total).toBe(1)
      expect(leak.missed).toBe(1)
      expect(leak.pointsRecoverable).toBe(1)
    }
  })
})
