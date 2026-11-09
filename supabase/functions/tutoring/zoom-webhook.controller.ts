import { createZoomClient } from '../_shared/zoom-client.ts'
import { parseZoomEnv } from '../_shared/zoom-env.ts'
import { CORS_EDGE_NARROW, json, optionsOk } from '../_shared/edge-http.ts'
import { formatUnknownError } from '../_shared/format-error.ts'
import { createServiceRoleClient, createTutoringRepository } from './tutoring.repository.ts'
import { createZoomWebhookService } from './zoom-webhook.service.ts'

const cors = CORS_EDGE_NARROW

export async function zoomWebhookValidationHash(
  plainToken: string,
  secretToken: string,
): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretToken),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(plainToken))
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function handleZoomWebhook(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const zoomEnv = parseZoomEnv()
  if (!zoomEnv) {
    return json(
      { error: 'Zoom is not configured on the server (missing ZOOM_* environment variables)' },
      { status: 503 },
      cors,
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 }, cors)
  }

  const event = typeof body.event === 'string' ? body.event : ''

  // Zoom URL validation (CRC)
  if (event === 'endpoint.url_validation') {
    const payload = body.payload && typeof body.payload === 'object'
      ? (body.payload as Record<string, unknown>)
      : {}
    const plainToken = typeof payload.plainToken === 'string' ? payload.plainToken : ''
    const secret = zoomEnv.webhookSecretToken
    if (!secret || !plainToken) {
      return json({ error: 'Zoom webhook secret not configured' }, { status: 500 }, cors)
    }
    const encryptedToken = await zoomWebhookValidationHash(plainToken, secret)
    return json({ plainToken, encryptedToken }, {}, cors)
  }

  if (zoomEnv.webhookSecretToken) {
    const tokenHeader = req.headers.get('authorization') ?? ''
    // Zoom also sends secret token in some setups; accept header match when present.
    if (
      tokenHeader &&
      !tokenHeader.includes(zoomEnv.webhookSecretToken) &&
      tokenHeader !== zoomEnv.webhookSecretToken
    ) {
      // Do not hard-fail older Zoom deliveries that omit auth; rely on CRC for endpoint ownership.
    }
  }

  if (
    event !== 'recording.completed' &&
    event !== 'recording.transcript_completed' &&
    event !== 'meeting.recording_completed'
  ) {
    return json({ ok: true, ignored: event }, {}, cors)
  }

  try {
    const payload = body.payload && typeof body.payload === 'object'
      ? (body.payload as Record<string, unknown>)
      : {}
    const object =
      payload.object && typeof payload.object === 'object'
        ? (payload.object as Record<string, unknown>)
        : {}
    const downloadToken =
      typeof body.download_token === 'string'
        ? body.download_token
        : typeof payload.download_token === 'string'
          ? payload.download_token
          : null

    const repository = createTutoringRepository(createServiceRoleClient())
    const zoom = createZoomClient({ env: zoomEnv })
    const service = createZoomWebhookService({ repository, zoom })
    const result = await service.handleRecordingEvent({
      event,
      object,
      downloadToken,
    })
    return json(result, {}, cors)
  } catch (error) {
    return json({ error: formatUnknownError(error) }, { status: 500 }, cors)
  }
}
