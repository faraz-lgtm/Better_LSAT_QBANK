import type { User } from 'npm:@supabase/supabase-js@2'
import { CORS_EDGE_NARROW, json, optionsOk, requireAuthUser } from '../_shared/edge-http.ts'
import { formatUnknownError } from '../_shared/format-error.ts'
import {
  mailerLiteDiagnosticTypeFromIntent,
  normalizeMailerLiteDiagnosticScore,
  notifyMailerLiteDiagnostic,
  type MailerLiteDiagnosticType,
} from '../_shared/mailerlite-signup.ts'
import { createUsersRepository, createServiceRoleClient } from '../users/users.repository.ts'
import { createDiagnosticRepository } from './diagnostic.repository.ts'
import { createDiagnosticService } from './diagnostic.service.ts'

const cors = CORS_EDGE_NARROW

export type DiagnosticSyncMailerliteDeps = {
  requireAuth?: (
    req: Request,
  ) => Promise<{ ok: true; user: User } | { ok: false; response: Response }>
  notify?: typeof notifyMailerLiteDiagnostic
  getEnv?: (key: string) => string | undefined
}

function buildDiagnosticService() {
  const client = createServiceRoleClient()
  const usersRepository = createUsersRepository(client)
  return createDiagnosticService({
    repository: createDiagnosticRepository(client),
    hasActiveSubscription: (userId) => usersRepository.hasActiveSubscription(userId),
  })
}

function parseDiagnosticType(value: unknown): MailerLiteDiagnosticType | null {
  if (value === 'mini' || value === 'full') return value
  if (typeof value === 'string') return mailerLiteDiagnosticTypeFromIntent(value)
  return null
}

export async function handleDiagnosticGetMiniExplanations(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  try {
    const service = buildDiagnosticService()
    const result = await service.getMiniDiagnosticExplanations(auth.user.id)
    return json(result, {}, cors)
  } catch (error) {
    const message = formatUnknownError(error)
    return json({ error: message }, { status: 500 }, cors)
  }
}

/** Authenticated sync of diagnostic completion fields → MailerLite subscriber. */
export async function handleDiagnosticSyncMailerlite(
  req: Request,
  deps: DiagnosticSyncMailerliteDeps = {},
): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  const requireAuth =
    deps.requireAuth ?? ((request: Request) => requireAuthUser(request, cors))
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const email = auth.user.email?.trim() ?? ''
  if (!email) {
    return json({ error: 'User email required' }, { status: 400 }, cors)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 }, cors)
  }

  const payload = body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {}
  const diagnosticDone = payload.diagnosticDone === true || payload.diagnostic_done === true
  const diagnosticType = parseDiagnosticType(
    payload.diagnosticType ?? payload.diagnostic_type ?? payload.intentId ?? payload.intent_id,
  )
  if (diagnosticDone && !diagnosticType) {
    return json(
      { error: 'diagnosticType must be mini or full when diagnosticDone is true' },
      { status: 400 },
      cors,
    )
  }

  const hasScoreKey =
    'diagnosticScore' in payload ||
    'diagnostic_score' in payload ||
    'scaledScore' in payload ||
    'scaled_score' in payload
  const diagnosticScore = hasScoreKey
    ? normalizeMailerLiteDiagnosticScore(
      payload.diagnosticScore ??
        payload.diagnostic_score ??
        payload.scaledScore ??
        payload.scaled_score,
    )
    : undefined

  const notify = deps.notify ?? notifyMailerLiteDiagnostic
  const synced = await notify({
    email,
    diagnosticDone,
    diagnosticType,
    diagnosticScore,
    getEnv: deps.getEnv,
  })

  return json({ synced }, {}, cors)
}
