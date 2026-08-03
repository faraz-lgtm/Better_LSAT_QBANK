import { CORS_EDGE_NARROW, json, optionsOk, requireAuthUser } from '../_shared/edge-http.ts'
import { formatUnknownError } from '../_shared/format-error.ts'
import { createUsersRepository, createServiceRoleClient } from '../users/users.repository.ts'
import { createDiagnosticRepository } from './diagnostic.repository.ts'
import { createDiagnosticService } from './diagnostic.service.ts'

const cors = CORS_EDGE_NARROW

function buildDiagnosticService() {
  const client = createServiceRoleClient()
  const usersRepository = createUsersRepository(client)
  return createDiagnosticService({
    repository: createDiagnosticRepository(client),
    hasActiveSubscription: (userId) => usersRepository.hasActiveSubscription(userId),
  })
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
