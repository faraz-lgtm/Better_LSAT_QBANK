import { parseAmeliaEnv } from '../_shared/amelia-env.ts'
import { CORS_EDGE_NARROW, json, optionsOk } from '../_shared/edge-http.ts'
import { formatUnknownError } from '../_shared/format-error.ts'
import { createAmeliaWebhookService } from './amelia-webhook.service.ts'
import { createServiceRoleClient, createTutoringRepository } from './tutoring.repository.ts'

const cors = CORS_EDGE_NARROW

export async function handleAmeliaWebhook(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const env = parseAmeliaEnv()
  const secret = env?.webhookSecret
  if (secret) {
    const header =
      req.headers.get('x-amelia-webhook-secret') ??
      req.headers.get('x-webhook-secret') ??
      ''
    const url = new URL(req.url)
    const querySecret = url.searchParams.get('secret') ?? ''
    if (header !== secret && querySecret !== secret) {
      return json({ error: 'Unauthorized' }, { status: 401 }, cors)
    }
  }

  try {
    const url = new URL(req.url)
    const action =
      url.searchParams.get('action') ??
      req.headers.get('x-amelia-action') ??
      'booking'
    const payload = await req.json().catch(() => ({}))
    const repository = createTutoringRepository(createServiceRoleClient())
    const service = createAmeliaWebhookService({ repository })
    const result = await service.handle(action, payload)
    return json(result, {}, cors)
  } catch (error) {
    return json({ error: formatUnknownError(error) }, { status: 500 }, cors)
  }
}
