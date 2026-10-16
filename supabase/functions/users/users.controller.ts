import { CORS_EDGE_NARROW, json, requireAuthUser } from '../_shared/edge-http.ts'
import { createUsersRepository, createServiceRoleClient } from './users.repository.ts'
import { AuthorizationError, createUsersService } from './users.service.ts'

const corsHeaders = CORS_EDGE_NARROW

export async function handleUsersRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const auth = await requireAuthUser(req, corsHeaders)
  if (!auth.ok) return auth.response

  const repo = createUsersRepository(createServiceRoleClient())
  const service = createUsersService({ repository: repo })

  try {
    if (req.method === 'GET') {
      const profile = await service.getProfile(auth.user.id)
      const entitlement = await service.getEntitlementState(auth.user.id)
      return json({ profile, entitlement }, {}, corsHeaders)
    }

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const action = typeof body.action === 'string' ? body.action : ''

      if (action === 'users-complete-first-login') {
        const profile = await service.markFirstTimeLoginComplete(auth.user.id)
        return json({ profile }, {}, corsHeaders)
      }

      if (action === 'users-track-signup-conversion') {
        const attribution =
          body.attribution && typeof body.attribution === 'object' && !Array.isArray(body.attribution)
            ? (body.attribution as Record<string, unknown>)
            : null
        const meta = auth.user.user_metadata as Record<string, unknown> | undefined
        const userMetadataAttribution =
          meta?.attribution && typeof meta.attribution === 'object' && !Array.isArray(meta.attribution)
            ? (meta.attribution as Record<string, unknown>)
            : null
        const appMeta = auth.user.app_metadata as Record<string, unknown> | undefined
        const providerFromApp =
          typeof appMeta?.provider === 'string' && appMeta.provider.trim()
            ? appMeta.provider.trim()
            : Array.isArray(appMeta?.providers) &&
                typeof appMeta.providers[0] === 'string' &&
                appMeta.providers[0].trim()
              ? appMeta.providers[0].trim()
              : null
        const result = await service.trackSignupConversion({
          userId: auth.user.id,
          email: auth.user.email ?? null,
          attribution,
          userMetadataAttribution,
          checkoutPlan: typeof body.checkoutPlan === 'string' ? body.checkoutPlan : null,
          userMetadataCheckoutPlan:
            typeof meta?.checkout_plan === 'string' ? meta.checkout_plan : null,
          authCreatedAt: auth.user.created_at || null,
          eventSourceUrl:
            typeof body.eventSourceUrl === 'string' ? body.eventSourceUrl : null,
          clientUserAgent: req.headers.get('user-agent'),
          clientIpAddress:
            req.headers.get('cf-connecting-ip') ??
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            null,
          clientCountry: req.headers.get('cf-ipcountry'),
          provider: providerFromApp,
        })
        return json(result, {}, corsHeaders)
      }

      if (action === 'users-update-account-profile') {
        const profile = await service.updateAccountProfile(auth.user.id, {
          ...(typeof body.firstName === 'string' ? { firstName: body.firstName } : {}),
          ...(typeof body.lastName === 'string' ? { lastName: body.lastName } : {}),
          ...(typeof body.email === 'string' ? { email: body.email } : {}),
          ...(typeof body.phone === 'string' ? { phone: body.phone } : {}),
          ...(typeof body.avatarUrl === 'string' ? { avatarUrl: body.avatarUrl } : {}),
        })
        return json({ profile }, {}, corsHeaders)
      }

      return json(
        { error: action ? `Unknown action: ${action}` : 'Missing action in request body' },
        { status: 400 },
        corsHeaders,
      )
    }

    return json({ error: 'Method not allowed' }, { status: 405 }, corsHeaders)
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return json({ error: e.message }, { status: 403 }, corsHeaders)
    }
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error(e)
    return json({ error: message }, { status: 500 }, corsHeaders)
  }
}
