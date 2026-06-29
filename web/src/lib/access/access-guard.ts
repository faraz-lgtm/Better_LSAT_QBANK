import type { AccessState } from '@/lib/api/users'

export type AccessGateView = 'auth-wall' | 'payment-wall' | 'lsac-wall' | 'app'

export function getAccessGateView(accessState: AccessState): AccessGateView {
  switch (accessState) {
    case 'AUTH_REQUIRED':
      return 'auth-wall'
    case 'PAYMENT_REQUIRED':
      return 'payment-wall'
    case 'LSAC_REQUIRED':
      return 'lsac-wall'
    case 'FULL_ACCESS':
      return 'app'
    default: {
      const exhaustive: never = accessState
      throw new Error(`Unhandled access state: ${String(exhaustive)}`)
    }
  }
}
