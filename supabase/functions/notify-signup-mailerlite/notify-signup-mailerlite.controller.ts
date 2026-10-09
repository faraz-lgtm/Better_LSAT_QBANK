import { authorizeSignupWebhook, parseAuthUsersConfirmedSignup } from '../_shared/slack-signup.ts'
import { notifyMailerLiteSignup } from '../_shared/mailerlite-signup.ts'
import { json } from '../_shared/edge-http.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-signup-webhook-secret',
}

export type NotifySignupMailerliteDeps = {
  authorize?: (req: Request) => boolean
  notify?: typeof notifyMailerLiteSignup
  getEnv?: (key: string) => string | undefined
}

/** Database Webhook target for auth.users INSERT/UPDATE → MailerLite after email confirm. */
export async function handleNotifySignupMailerlite(
  req: Request,
  deps: NotifySignupMailerliteDeps = {},
): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, corsHeaders)
  }

  const getEnv = deps.getEnv ?? ((key: string) => Deno.env.get(key) ?? undefined)
  const authorize =
    deps.authorize ?? ((request: Request) => authorizeSignupWebhook(request, getEnv))
  if (!authorize(req)) {
    return json({ error: 'Unauthorized' }, { status: 401 }, corsHeaders)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 }, corsHeaders)
  }

  const parsed = parseAuthUsersConfirmedSignup(body)
  if (!parsed) {
    return json({ received: true, synced: false, reason: 'ignored' }, { status: 200 }, corsHeaders)
  }

  const notify = deps.notify ?? notifyMailerLiteSignup
  const synced = await notify({
    email: parsed.email,
    getEnv,
  })

  return json({ received: true, synced }, { status: 200 }, corsHeaders)
}
