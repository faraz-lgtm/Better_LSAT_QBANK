import { CORS_EDGE_WIDE, json, optionsNoContent } from '../_shared/edge-http.ts'
import {
  handlePrepExplanationDetailRequest,
  handlePrepExplanationsListRequest,
  handlePrepExplanationsPrepTestsRequest,
  handlePrepExplanationsPrepTestTreeRequest,
} from '../_shared/prep-explanations-http.ts'

const cors = CORS_EDGE_WIDE

const handlers: Record<string, (req: Request) => Promise<Response>> = {
  'prep-explanations-prep-tests': handlePrepExplanationsPrepTestsRequest,
  'prep-explanations-prep-test-tree': handlePrepExplanationsPrepTestTreeRequest,
  'prep-explanation-detail': handlePrepExplanationDetailRequest,
  'prep-explanations-list': handlePrepExplanationsListRequest,
}

async function handlePrepExplanationsGateway(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsNoContent(cors)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  let action = ''
  let forwardReq = req

  if (req.method === 'POST') {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    action = typeof body.action === 'string' ? body.action : ''
    forwardReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(body),
    })
  } else {
    const url = new URL(req.url)
    action = url.searchParams.get('action')?.trim() ?? ''
  }

  const handler = handlers[action]
  if (!handler) {
    return json(
      { error: action ? `Unknown action: ${action}` : 'Missing action in request' },
      { status: 400 },
      cors,
    )
  }

  return handler(forwardReq)
}

Deno.serve(handlePrepExplanationsGateway)
