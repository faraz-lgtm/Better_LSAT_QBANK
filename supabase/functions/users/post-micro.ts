import { createClient } from 'npm:@supabase/supabase-js@2'
import { CORS_EDGE_NARROW, json } from '../_shared/edge-http.ts'
import { createUsersRepository, createServiceRoleClient } from './users.repository.ts'
import { AuthorizationError, createUsersService } from './users.service.ts'
import type { LsacStudentPayload } from './users.mapper.ts'

const corsHeaders = CORS_EDGE_NARROW

function lawhubDisabled(): Response {
  return json(
    {
      error:
        'LawHub is not configured on the server (missing LSAC_* environment variables)',
    },
    { status: 503 },
    corsHeaders,
  )
}

export async function handleUsersPostMicro(req: Request, slug: string): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
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

  const repo = createUsersRepository(createServiceRoleClient())
  const service = createUsersService({ repository: repo })

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = slug

    if (action === 'users-sync-lsac') {
      const lsacStudent = body.lsacStudent
      if (!lsacStudent) {
        return json({ error: 'lsacStudent is required' }, { status: 400 }, corsHeaders)
      }
      const profile = await service.syncProfileFromLsacPayload(
        user.id,
        lsacStudent as LsacStudentPayload,
      )
      return json({ profile }, {}, corsHeaders)
    }

    if (action === 'users-lawhub-token-check') {
      if (!service.isLawHubConfigured()) return lawhubDisabled()
      await service.checkLawHubConnection()
      return json({ ok: true, lawhub: 'connected' }, {}, corsHeaders)
    }

    if (action === 'users-get-entitlement-state') {
      const entitlement = await service.getEntitlementState(user.id)
      return json({ entitlement }, {}, corsHeaders)
    }

    if (action === 'users-lawhub-lookup-email') {
      if (!service.isLawHubConfigured()) return lawhubDisabled()
      const email = user.email
      if (!email) {
        return json({ error: 'Authenticated user has no email' }, { status: 400 }, corsHeaders)
      }
      const profile = await service.syncProfileFromLawHubEmail(user.id, email)
      return json({ profile }, {}, corsHeaders)
    }

    if (action === 'users-lawhub-refresh') {
      if (!service.isLawHubConfigured()) return lawhubDisabled()
      const profile = await service.refreshProfileFromLawHubCoachingId(user.id)
      return json({ profile }, {}, corsHeaders)
    }

    if (action === 'users-lawhub-invite') {
      if (!service.isLawHubConfigured()) return lawhubDisabled()
      const sessionEmail = user.email
      if (!sessionEmail) {
        return json({ error: 'Authenticated user has no email' }, { status: 400 }, corsHeaders)
      }
      const firstName = body.firstName
      const lastName = body.lastName
      if (typeof firstName !== 'string' || typeof lastName !== 'string') {
        return json(
          { error: 'firstName and lastName are required strings' },
          { status: 400 },
          corsHeaders,
        )
      }
      if (
        typeof body.isPrepPlusRequired !== 'boolean' ||
        typeof body.isPrepPlusIncludedFromVendor !== 'boolean'
      ) {
        return json(
          {
            error:
              'isPrepPlusRequired and isPrepPlusIncludedFromVendor must be booleans',
          },
          { status: 400 },
          corsHeaders,
        )
      }
      const profile = await service.inviteSelfViaLawHub(user.id, sessionEmail, {
        firstName,
        lastName,
        isPrepPlusRequired: body.isPrepPlusRequired,
        isPrepPlusIncludedFromVendor: body.isPrepPlusIncludedFromVendor,
      })
      return json({ profile }, {}, corsHeaders)
    }

    if (action === 'users-lawhub-upgrade-self') {
      if (!service.isLawHubConfigured()) return lawhubDisabled()
      const upgrade = await service.upgradeSelfInLawHub(user.id)
      return json({ upgrade }, {}, corsHeaders)
    }

    if (action === 'users-lawhub-test-instances') {
      if (!service.isLawHubConfigured()) return lawhubDisabled()
      const instances = await service.getLawHubTestInstancesForUser(user.id)
      return json({ instances }, {}, corsHeaders)
    }

    if (action === 'users-lawhub-log-login') {
      if (!service.isLawHubConfigured()) return lawhubDisabled()
      await service.logLawHubLogin(user.id)
      return json({ ok: true }, {}, corsHeaders)
    }

    if (action === 'users-complete-first-login') {
      const profile = await service.markFirstTimeLoginComplete(user.id)
      return json({ profile }, {}, corsHeaders)
    }

    if (action === 'users-ping') {
      return json({ ok: true, module: 'users' }, {}, corsHeaders)
    }

    const limit =
      typeof body.limit === 'number' &&
      Number.isInteger(body.limit) &&
      body.limit > 0
        ? Math.min(body.limit, 1000)
        : 200

    if (action === 'users-admin-list-profiles') {
      const rows = await service.adminListProfiles(user.id, limit)
      return json({ rows }, {}, corsHeaders)
    }

    if (action === 'users-admin-list-lsac-snapshots') {
      const rows = await service.adminListLsacStudentSnapshots(user.id, limit)
      return json({ rows }, {}, corsHeaders)
    }

    if (action === 'users-admin-list-lsac-test-instances') {
      const rows = await service.adminListLsacTestInstances(user.id, limit)
      return json({ rows }, {}, corsHeaders)
    }

    if (action === 'users-admin-list-lsac-log-events') {
      const rows = await service.adminListLsacLogEvents(user.id, limit)
      return json({ rows }, {}, corsHeaders)
    }

    return json({ error: 'Unknown users slug' }, { status: 400 }, corsHeaders)
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return json({ error: e.message }, { status: 403 }, corsHeaders)
    }
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error(e)
    return json({ error: message }, { status: 500 }, corsHeaders)
  }
}
