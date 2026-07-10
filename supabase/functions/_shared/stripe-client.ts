import Stripe from 'npm:stripe@17.7.0'
import type { StripeRuntimeEnv } from './stripe-env.ts'

export type StripeClientDeps = {
  getEnv: () => StripeRuntimeEnv
  fetchImpl?: typeof fetch
}

export function createStripeClient(deps: StripeClientDeps): Stripe {
  const env = deps.getEnv()
  return new Stripe(env.secretKey, {
    httpClient: Stripe.createFetchHttpClient(deps.fetchImpl ?? globalThis.fetch),
  })
}
