import Stripe from 'npm:stripe@17.7.0'
import { resolveAppBaseUrlForCheckout, resolveAppBaseUrlFromEnv } from '../_shared/app-base-url.ts'
import { CORS_EDGE_NARROW, json, optionsOk, requireAuthUser } from '../_shared/edge-http.ts'
import { formatUnknownError } from '../_shared/format-error.ts'
import { createStripeClient } from '../_shared/stripe-client.ts'
import { parseStripeEnv } from '../_shared/stripe-env.ts'
import { createServiceRoleClient } from '../users/users.repository.ts'
import { createBillingRepository } from './billing.repository.ts'
import { createBillingService, parseCheckoutPlan } from './billing.service.ts'

const cors = CORS_EDGE_NARROW

function stripeDisabled(): Response {
  return json(
    { error: 'Stripe is not configured on the server (missing STRIPE_* environment variables)' },
    { status: 503 },
    cors,
  )
}

function buildBillingService(getAppBaseUrl: () => string) {
  const raw = Deno.env.toObject()
  const env = parseStripeEnv(raw)
  if (!env) return null
  const stripe = createStripeClient({ getEnv: () => env })
  const repository = createBillingRepository(createServiceRoleClient())
  return createBillingService({
    getEnv: () => env,
    stripe,
    repository,
    getAppBaseUrl,
  })
}

export async function handleBillingCreateCheckoutSession(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  let appBaseUrl: string
  try {
    const body = (await req.clone().json().catch(() => ({}))) as Record<string, unknown>
    appBaseUrl = resolveAppBaseUrlForCheckout(req, body.appBaseUrl)
  } catch (error) {
    const message = formatUnknownError(error)
    return json({ error: message }, { status: 500 }, cors)
  }

  const service = buildBillingService(() => appBaseUrl)
  if (!service) return stripeDisabled()

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const plan = parseCheckoutPlan(body.plan)
    const includeLawHub = body.includeLawHub !== false
    const result = await service.createCheckoutSession(
      auth.user.id,
      auth.user.email ?? null,
      plan,
      { includeLawHub },
    )
    return json(result, {}, cors)
  } catch (error) {
    const message = formatUnknownError(error)
    return json({ error: message }, { status: 500 }, cors)
  }
}

export async function handleBillingGetStatus(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  const service = buildBillingService(() => resolveAppBaseUrlFromEnv() ?? 'http://localhost:5173')
  if (!service) return stripeDisabled()

  try {
    const status = await service.getStatus(auth.user.id)
    return json({ status }, {}, cors)
  } catch (error) {
    const message = formatUnknownError(error)
    return json({ error: message }, { status: 500 }, cors)
  }
}

export async function handleBillingGetPublicConfig(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const service = buildBillingService(() => resolveAppBaseUrlFromEnv() ?? 'http://localhost:5173')
  if (!service) return stripeDisabled()

  return json({ config: service.getPublicConfig() }, {}, cors)
}

export async function handleBillingGetPlans(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const service = buildBillingService(() => resolveAppBaseUrlFromEnv() ?? 'http://localhost:5173')
  if (!service) return stripeDisabled()

  return json({ catalog: service.getPlans() }, {}, cors)
}

export async function handleStripeWebhook(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 })
  }

  const raw = Deno.env.toObject()
  const env = parseStripeEnv(raw)
  if (!env) {
    return json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await Stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.webhookSecret,
    )
  } catch (error) {
    const message = formatUnknownError(error)
    return json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  const service = buildBillingService(() => resolveAppBaseUrlFromEnv() ?? 'http://localhost:5173')
  if (!service) {
    return json({ error: 'Stripe not configured' }, { status: 503 })
  }

  try {
    await service.handleWebhookEvent(event)
    return json({ received: true })
  } catch (error) {
    const message = formatUnknownError(error)
    return json({ error: message }, { status: 500 })
  }
}
