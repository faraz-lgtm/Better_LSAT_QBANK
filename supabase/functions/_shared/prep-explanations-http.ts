import { CORS_EDGE_WIDE, json, optionsNoContent, requireAuthUser } from './edge-http.ts'
import { createAnalyticsRepository, createServiceRoleClient as createAnalyticsServiceRoleClient } from '../analytics/analytics.repository.ts'
import { createAnalyticsService } from '../analytics/analytics.service.ts'
import { createExplanationsRepository, createServiceRoleClient } from '../explanations/explanations.repository.ts'
import { createExplanationsService } from '../explanations/explanations.service.ts'

const cors = CORS_EDGE_WIDE

function explanationsService() {
  return createExplanationsService({
    repository: createExplanationsRepository(createServiceRoleClient()),
  })
}

export async function handlePrepExplanationsListRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsNoContent(cors)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  const service = createAnalyticsService({
    repository: createAnalyticsRepository(createAnalyticsServiceRoleClient()),
  })

  try {
    const data = await service.listExplanations(auth.user.id)
    return json(data, {}, cors)
  } catch (e) {
    console.error('prep-explanations-list', e)
    return json({ error: 'Internal server error' }, { status: 500 }, cors)
  }
}

export async function handlePrepExplanationsPrepTestsRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsNoContent(cors)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  try {
    let page: number | undefined
    let pageSize: number | undefined
    let sort: 'newest' | 'oldest' | undefined
    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      if (typeof body.page === 'number' && Number.isFinite(body.page)) page = body.page
      if (typeof body.pageSize === 'number' && Number.isFinite(body.pageSize)) pageSize = body.pageSize
      if (body.sort === 'newest' || body.sort === 'oldest') sort = body.sort
    } else {
      const url = new URL(req.url)
      const pageParam = url.searchParams.get('page')
      const pageSizeParam = url.searchParams.get('pageSize')
      const sortParam = url.searchParams.get('sort')
      if (pageParam) page = Number.parseInt(pageParam, 10)
      if (pageSizeParam) pageSize = Number.parseInt(pageSizeParam, 10)
      if (sortParam === 'newest' || sortParam === 'oldest') sort = sortParam
    }
    const data = await explanationsService().listPrepTests({ page, pageSize, sort })
    return json(data, {}, cors)
  } catch (e) {
    console.error('prep-explanations-prep-tests', e)
    return json({ error: 'Internal server error' }, { status: 500 }, cors)
  }
}

export async function handlePrepExplanationsPrepTestTreeRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsNoContent(cors)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  let prepTestId: string | undefined
  if (req.method === 'GET') {
    prepTestId = url.searchParams.get('prepTestId')?.trim() || undefined
  } else {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const id = typeof body.prepTestId === 'string' ? body.prepTestId.trim() : ''
    prepTestId = id.length > 0 ? id : undefined
  }
  if (!prepTestId) {
    return json({ error: 'prepTestId is required' }, { status: 400 }, cors)
  }

  try {
    const data = await explanationsService().getPrepTestTree(auth.user.id, prepTestId)
    return json(data, {}, cors)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal server error'
    if (msg === 'PrepTest not found') {
      return json({ error: msg }, { status: 404 }, cors)
    }
    console.error('prep-explanations-prep-test-tree', e)
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

  try {
    const data = await explanationsService().getExplanationDetail(auth.user.id, questionId)
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
