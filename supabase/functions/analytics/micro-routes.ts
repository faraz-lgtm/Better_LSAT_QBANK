import { createClient } from 'npm:@supabase/supabase-js@2'
import type { PracticeSessionKind } from '../practice/practice.repository.ts'
import { CORS_EDGE_WIDE, json } from '../_shared/edge-http.ts'
import { createAnalyticsRepository, createServiceRoleClient } from './analytics.repository.ts'
import { createAnalyticsService } from './analytics.service.ts'

const corsHeaders = CORS_EDGE_WIDE

function isSessionKind(value: string | null): value is PracticeSessionKind {
  return value === 'PREPTEST' || value === 'SECTION' || value === 'DRILL'
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
  let limit = 20
  let offset = 0
  let sessionKind: PracticeSessionKind | undefined

  if (req.method === 'GET') {
    const kindParam = url.searchParams.get('kind')
    const sk = url.searchParams.get('sessionKind')
    kind = kindParam && isSessionKind(kindParam) ? kindParam : undefined
    bookmarkedOnly = url.searchParams.get('bookmarked') === 'true'
    limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20))
    offset = Math.max(0, Number(url.searchParams.get('offset')) || 0)
    sessionKind = sk && isSessionKind(sk) ? sk : undefined
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
    limit = Math.min(100, Math.max(1, readNum(body.limit, 20)))
    offset = Math.max(0, readNum(body.offset, 0))
    sessionKind = skRaw && isSessionKind(skRaw) ? skRaw : undefined
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
      const data = await service.getPriorities(user.id)
      return json(data, {}, corsHeaders)
    }
    if (resource === 'sessions') {
      const data = await service.getSessions(user.id, {
        kind,
        bookmarked: bookmarkedOnly ? true : undefined,
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

    return json({ error: 'Unknown analytics slug' }, { status: 400 }, corsHeaders)
  } catch (e) {
    console.error('analytics error', e)
    return json({ error: 'Internal server error' }, { status: 500 }, corsHeaders)
  }
}
