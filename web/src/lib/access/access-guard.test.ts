import { describe, expect, it } from 'vitest'
import { getAccessGateView } from './access-guard'

describe('getAccessGateView', () => {
  it('maps AUTH_REQUIRED to auth wall', () => {
    expect(getAccessGateView('AUTH_REQUIRED')).toBe('auth-wall')
  })

  it('maps LSAC_REQUIRED to lsac wall', () => {
    expect(getAccessGateView('LSAC_REQUIRED')).toBe('lsac-wall')
  })

  it('maps FULL_ACCESS to app', () => {
    expect(getAccessGateView('FULL_ACCESS')).toBe('app')
  })
})
