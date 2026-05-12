import { createClient } from 'npm:@supabase/supabase-js@2'
import { createUsersRepository, createServiceRoleClient } from './users.repository.ts'
import { AuthorizationError, createUsersService } from './users.service.ts'
import type { LsacStudentPayload } from './users.mapper.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...init.headers,
    },
  })
}

function lawhubDisabled(): Response {
  return json(
    {
      error:
        'LawHub is not configured on the server (missing LSAC_* environment variables)',
    },
    { status: 503 },
  )
}

export async function handleUsersRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Server misconfigured' }, { status: 500 })
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
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  const repo = createUsersRepository(createServiceRoleClient())
  const service = createUsersService({ repository: repo })

  try {
    if (req.method === 'GET') {
      const profile = await service.getProfile(user.id)
      const entitlement = await service.getEntitlementState(user.id)
      return json({ profile, entitlement })
    }

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const action = typeof body.action === 'string' ? body.action : undefined

      if (body.action === 'sync-lsac' && body.lsacStudent) {
        const profile = await service.syncProfileFromLsacPayload(
          user.id,
          body.lsacStudent as LsacStudentPayload,
        )
        return json({ profile })
      }

      if (action === 'lawhub-token-check') {
        if (!service.isLawHubConfigured()) return lawhubDisabled()
        await service.checkLawHubConnection()
        return json({ ok: true, lawhub: 'connected' })
      }

      if (action === 'get-entitlement-state') {
        const entitlement = await service.getEntitlementState(user.id)
        return json({ entitlement })
      }

      if (action === 'lawhub-lookup-email') {
        if (!service.isLawHubConfigured()) return lawhubDisabled()
        const email = user.email
        if (!email) {
          return json({ error: 'Authenticated user has no email' }, { status: 400 })
        }
        const profile = await service.syncProfileFromLawHubEmail(user.id, email)
        return json({ profile })
      }

      if (action === 'lawhub-refresh') {
        if (!service.isLawHubConfigured()) return lawhubDisabled()
        const profile = await service.refreshProfileFromLawHubCoachingId(user.id)
        return json({ profile })
      }

      if (action === 'lawhub-invite') {
        if (!service.isLawHubConfigured()) return lawhubDisabled()
        const sessionEmail = user.email
        if (!sessionEmail) {
          return json({ error: 'Authenticated user has no email' }, { status: 400 })
        }
        const firstName = body.firstName
        const lastName = body.lastName
        if (typeof firstName !== 'string' || typeof lastName !== 'string') {
          return json(
            { error: 'firstName and lastName are required strings' },
            { status: 400 },
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
          )
        }
        const profile = await service.inviteSelfViaLawHub(user.id, sessionEmail, {
          firstName,
          lastName,
          isPrepPlusRequired: body.isPrepPlusRequired,
          isPrepPlusIncludedFromVendor: body.isPrepPlusIncludedFromVendor,
        })
        return json({ profile })
      }

      if (action === 'lawhub-upgrade-self') {
        if (!service.isLawHubConfigured()) return lawhubDisabled()
        const upgrade = await service.upgradeSelfInLawHub(user.id)
        return json({ upgrade })
      }

      if (action === 'lawhub-test-instances') {
        if (!service.isLawHubConfigured()) return lawhubDisabled()
        const instances = await service.getLawHubTestInstancesForUser(user.id)
        return json({ instances })
      }

      if (action === 'lawhub-log-login') {
        if (!service.isLawHubConfigured()) return lawhubDisabled()
        await service.logLawHubLogin(user.id)
        return json({ ok: true })
      }

      if (action === 'complete-first-login' || action === 'complete-onboarding') {
        const profile = await service.markFirstTimeLoginComplete(user.id)
        return json({ profile })
      }

      const limit =
        typeof body.limit === 'number' &&
        Number.isInteger(body.limit) &&
        body.limit > 0
          ? Math.min(body.limit, 1000)
          : 200

      if (action === 'admin-list-profiles') {
        const rows = await service.adminListProfiles(user.id, limit)
        return json({ rows })
      }

      if (action === 'admin-list-lsac-snapshots') {
        const rows = await service.adminListLsacStudentSnapshots(user.id, limit)
        return json({ rows })
      }

      if (action === 'admin-list-lsac-test-instances') {
        const rows = await service.adminListLsacTestInstances(user.id, limit)
        return json({ rows })
      }

      if (action === 'admin-list-lsac-log-events') {
        const rows = await service.adminListLsacLogEvents(user.id, limit)
        return json({ rows })
      }

      return json({ ok: true, module: 'users' })
    }

    return json({ error: 'Method not allowed' }, { status: 405 })
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return json({ error: e.message }, { status: 403 })
    }
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error(e)
    return json({ error: message }, { status: 500 })
  }
}
