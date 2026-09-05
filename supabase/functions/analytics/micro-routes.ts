import { createClient } from 'npm:@supabase/supabase-js@2'
import type { PracticeSessionKind } from '../practice/practice.repository.ts'
import { CORS_EDGE_WIDE, json } from '../_shared/edge-http.ts'
import { createAnalyticsRepository, createServiceRoleClient } from './analytics.repository.ts'
import { createAnalyticsService } from './analytics.service.ts'

const corsHeaders = CORS_EDGE_WIDE

/** Analytics history / charts need more than the old 100-row cap. */
const MAX_SESSIONS_LIMIT = 500

function isSessionKind(value: string | null): value is PracticeSessionKind {
  return value === 'PREPTEST' || value === 'SECTION' || value === 'DRILL'
}

function clampSessionsLimit(value: number, fallback = 20): number {
  const n = Number.isFinite(value) ? value : fallback
  return Math.min(MAX_SESSIONS_LIMIT, Math.max(1, n))
}

export async function handleAnalyticsMicro(req: Request, slug: string): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, corsHeaders)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Server misconfigured' }, { status: 500 }, corsHeaders)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 }, corsHeaders)
  }

  const resource = slug.replace(/^analytics-/, '')
  const url = new URL(req.url)

  let kind: PracticeSessionKind | undefined
  let bookmarkedOnly = false
  let completedOnly = false
  let limit = 20
  let offset = 0
  let sessionKind: PracticeSessionKind | undefined
  let sessionId: string | undefined
  let questionTypeId: string | undefined
  let includeKinds: PracticeSessionKind[] | undefined

  if (req.method === 'GET') {
    const kindParam = url.searchParams.get('kind')
    const sk = url.searchParams.get('sessionKind')
    kind = kindParam && isSessionKind(kindParam) ? kindParam : undefined
    bookmarkedOnly = url.searchParams.get('bookmarked') === 'true'
    completedOnly = url.searchParams.get('completedOnly') === 'true'
    limit = clampSessionsLimit(Number(url.searchParams.get('limit')) || 20)
    offset = Math.max(0, Number(url.searchParams.get('offset')) || 0)
    sessionKind = sk && isSessionKind(sk) ? sk : undefined
    const sid = url.searchParams.get('sessionId')
    sessionId = typeof sid === 'string' && sid.length > 0 ? sid : undefined
    const qtid = url.searchParams.get('questionTypeId')
    questionTypeId = typeof qtid === 'string' && qtid.length > 0 ? qtid : undefined
    const kindsParam = url.searchParams.getAll('includeKinds').filter(isSessionKind)
    includeKinds = kindsParam.length > 0 ? kindsParam : undefined
  } else {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const readNum = (v: unknown, fallback: number) => {
      const n = typeof v === 'number' ? v : Number(v)
      return Number.isFinite(n) ? n : fallback
    }
    const kindRaw = typeof body.kind === 'string' ? body.kind : undefined
    const skRaw = typeof body.sessionKind === 'string' ? body.sessionKind : undefined
    kind = kindRaw && isSessionKind(kindRaw) ? kindRaw : undefined
    bookmarkedOnly = body.bookmarked === true
    completedOnly = body.completedOnly === true
    limit = clampSessionsLimit(readNum(body.limit, 20))
    offset = Math.max(0, readNum(body.offset, 0))
    sessionKind = skRaw && isSessionKind(skRaw) ? skRaw : undefined
    sessionId = typeof body.sessionId === 'string' && body.sessionId.length > 0 ? body.sessionId : undefined
    questionTypeId =
      typeof body.questionTypeId === 'string' && body.questionTypeId.length > 0
        ? body.questionTypeId
        : undefined
    if (Array.isArray(body.includeKinds)) {
      const parsed = body.includeKinds.filter(
        (k): k is PracticeSessionKind => typeof k === 'string' && isSessionKind(k),
      )
      includeKinds = parsed.length > 0 ? parsed : undefined
    }
  }

  const service = createAnalyticsService({
    repository: createAnalyticsRepository(createServiceRoleClient()),
  })

  try {
    if (resource === 'overview') {
      const data = await service.getOverview(user.id)
      return json(data, {}, corsHeaders)
    }
    if (resource === 'trajectory') {
      const data = await service.getTrajectory(user.id)
      return json({ points: data }, {}, corsHeaders)
    }
    if (resource === 'priorities') {
      const data = await service.getPriorities(user.id, { includeKinds })
      return json(data, {}, corsHeaders)
    }
    if (resource === 'sessions') {
      const data = await service.getSessions(user.id, {
        kind,
        bookmarked: bookmarkedOnly ? true : undefined,
        completedOnly: completedOnly ? true : undefined,
        limit,
        offset,
      })
      return json(data, {}, corsHeaders)
    }
    if (resource === 'kind-breakdown') {
      if (!sessionKind) {
        return json({ error: 'sessionKind must be PREPTEST, SECTION, or DRILL' }, { status: 400 }, corsHeaders)
      }
      const data = await service.getKindBreakdown(user.id, sessionKind)
      return json(data, {}, corsHeaders)
    }
    if (resource === 'prep-test-detail') {
      if (!sessionId) {
        return json({ error: 'sessionId is required' }, { status: 400 }, corsHeaders)
      }
      try {
        const data = await service.getPrepTestSessionDetail(user.id, sessionId)
        return json(data, {}, corsHeaders)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Not found'
        return json({ error: msg }, { status: 404 }, corsHeaders)
      }
    }
    if (resource === 'question-type-review') {
      if (!questionTypeId) {
        return json({ error: 'questionTypeId is required' }, { status: 400 }, corsHeaders)
      }
      const data = await service.getQuestionTypeReview(user.id, questionTypeId, { limit })
      return json(data, {}, corsHeaders)
    }

    return json({ error: 'Unknown analytics slug' }, { status: 400 }, corsHeaders)
  } catch (e) {
    console.error('analytics error', e)
    return json({ error: 'Internal server error' }, { status: 500 }, corsHeaders)
  }
}
