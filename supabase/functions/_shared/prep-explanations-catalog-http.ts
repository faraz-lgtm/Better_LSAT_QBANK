import { CORS_EDGE_WIDE, json, optionsNoContent, requireAuthUser } from './edge-http.ts'
import { createAnalyticsRepository, createServiceRoleClient } from '../analytics/analytics.repository.ts'
import { createAnalyticsService } from '../analytics/analytics.service.ts'

const cors = CORS_EDGE_WIDE

export async function handlePrepExplanationsListRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsNoContent(cors)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  const service = createAnalyticsService({
    repository: createAnalyticsRepository(createServiceRoleClient()),
  })

  try {
    const data = await service.listExplanations(auth.user.id)
    return json(data, {}, cors)
  } catch (e) {
    console.error('prep-explanations-list', e)
    return json({ error: 'Internal server error' }, { status: 500 }, cors)
  }
}

export async function handlePrepExplanationDetailRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsNoContent(cors)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  let questionId: string | undefined
  if (req.method === 'GET') {
    questionId = url.searchParams.get('questionId')?.trim() || undefined
  } else {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const q = typeof body.questionId === 'string' ? body.questionId.trim() : ''
    questionId = q.length > 0 ? q : undefined
  }
  if (!questionId) {
    return json({ error: 'questionId is required' }, { status: 400 }, cors)
  }

  const service = createAnalyticsService({
    repository: createAnalyticsRepository(createServiceRoleClient()),
  })

  try {
    const data = await service.getExplanationDetail(auth.user.id, questionId)
    return json(data, {}, cors)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal server error'
    if (msg === 'Question not found') {
      return json({ error: msg }, { status: 404 }, cors)
    }
    console.error('prep-explanation-detail', e)
    return json({ error: 'Internal server error' }, { status: 500 }, cors)
  }
}
