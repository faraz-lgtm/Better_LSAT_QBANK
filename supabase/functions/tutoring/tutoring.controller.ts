import { createAmeliaClient } from '../_shared/amelia-client.ts'
import { parseAmeliaEnv } from '../_shared/amelia-env.ts'
import { CORS_EDGE_NARROW, json, optionsOk, requireAuthUser } from '../_shared/edge-http.ts'
import { formatUnknownError } from '../_shared/format-error.ts'
import { createServiceRoleClient, createTutoringRepository } from './tutoring.repository.ts'
import { createTutoringService } from './tutoring.service.ts'

const cors = CORS_EDGE_NARROW

function ameliaDisabled(): Response {
  return json(
    { error: 'Amelia is not configured on the server (missing AMELIA_* environment variables)' },
    { status: 503 },
    cors,
  )
}

function buildService() {
  const ameliaEnv = parseAmeliaEnv()
  const repository = createTutoringRepository(createServiceRoleClient())
  const amelia = ameliaEnv ? createAmeliaClient({ env: ameliaEnv }) : null
  return {
    ameliaEnv,
    service: createTutoringService({ repository, ameliaEnv, amelia }),
  }
}

async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  const body = (await req.json().catch(() => ({}))) as unknown
  return body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {}
}

export async function handleTutoringListSlots(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  const { ameliaEnv, service } = buildService()
  if (!ameliaEnv) return ameliaDisabled()

  try {
    const body = await readJsonBody(req)
    const result = await service.listSlots({
      startDateTime: typeof body.startDateTime === 'string' ? body.startDateTime : undefined,
      endDateTime: typeof body.endDateTime === 'string' ? body.endDateTime : undefined,
      providerId: typeof body.providerId === 'number' ? body.providerId : undefined,
    })
    return json(result, {}, cors)
  } catch (error) {
    return json({ error: formatUnknownError(error) }, { status: 500 }, cors)
  }
}

export async function handleTutoringCreateBooking(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  const { ameliaEnv, service } = buildService()
  if (!ameliaEnv) return ameliaDisabled()

  try {
    const body = await readJsonBody(req)
    const bookingStart = typeof body.bookingStart === 'string' ? body.bookingStart.trim() : ''
    if (!bookingStart) {
      return json({ error: 'bookingStart is required' }, { status: 400 }, cors)
    }
    const result = await service.createBooking(auth.user.id, {
      bookingStart,
      providerId: typeof body.providerId === 'number' ? body.providerId : undefined,
      timeZone: typeof body.timeZone === 'string' ? body.timeZone : undefined,
    })
    return json(result, {}, cors)
  } catch (error) {
    return json({ error: formatUnknownError(error) }, { status: 500 }, cors)
  }
}

export async function handleTutoringRescheduleBooking(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  const { ameliaEnv, service } = buildService()
  if (!ameliaEnv) return ameliaDisabled()

  try {
    const body = await readJsonBody(req)
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
    const bookingStart = typeof body.bookingStart === 'string' ? body.bookingStart.trim() : ''
    if (!sessionId || !bookingStart) {
      return json({ error: 'sessionId and bookingStart are required' }, { status: 400 }, cors)
    }
    const result = await service.rescheduleBooking(auth.user.id, {
      sessionId,
      bookingStart,
      timeZone: typeof body.timeZone === 'string' ? body.timeZone : undefined,
    })
    return json(result, {}, cors)
  } catch (error) {
    return json({ error: formatUnknownError(error) }, { status: 500 }, cors)
  }
}

export async function handleTutoringCancelBooking(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  const { ameliaEnv, service } = buildService()
  if (!ameliaEnv) return ameliaDisabled()

  try {
    const body = await readJsonBody(req)
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
    if (!sessionId) return json({ error: 'sessionId is required' }, { status: 400 }, cors)
    const result = await service.cancelBooking(auth.user.id, sessionId)
    return json(result, {}, cors)
  } catch (error) {
    return json({ error: formatUnknownError(error) }, { status: 500 }, cors)
  }
}

export async function handleTutoringListSessions(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  try {
    const { service } = buildService()
    const result = await service.listSessions(auth.user.id)
    return json(result, {}, cors)
  } catch (error) {
    return json({ error: formatUnknownError(error) }, { status: 500 }, cors)
  }
}

export async function handleTutoringGetTranscript(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  try {
    const body = await readJsonBody(req)
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
    if (!sessionId) return json({ error: 'sessionId is required' }, { status: 400 }, cors)
    const { service } = buildService()
    const result = await service.getTranscript(auth.user.id, sessionId)
    return json(result, {}, cors)
  } catch (error) {
    const message = formatUnknownError(error)
    const status = message === 'Session not found' ? 404 : 500
    return json({ error: message }, { status }, cors)
  }
}

export async function handleTutoringListTodos(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  try {
    const body = await readJsonBody(req)
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
    if (!sessionId) return json({ error: 'sessionId is required' }, { status: 400 }, cors)
    const { service } = buildService()
    const result = await service.listTodos(auth.user.id, sessionId)
    return json(result, {}, cors)
  } catch (error) {
    const message = formatUnknownError(error)
    const status = message === 'Session not found' ? 404 : 500
    return json({ error: message }, { status }, cors)
  }
}

export async function handleTutoringCreateTodo(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  try {
    const body = await readJsonBody(req)
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
    const title = typeof body.title === 'string' ? body.title : ''
    if (!sessionId) return json({ error: 'sessionId is required' }, { status: 400 }, cors)
    if (!title.trim()) return json({ error: 'title is required' }, { status: 400 }, cors)
    const { service } = buildService()
    const result = await service.createTodo(auth.user.id, {
      sessionId,
      title,
      tag: typeof body.tag === 'string' ? body.tag : undefined,
      dueAt: typeof body.dueAt === 'string' ? body.dueAt : null,
    })
    return json(result, {}, cors)
  } catch (error) {
    const message = formatUnknownError(error)
    const status =
      message === 'Session not found'
        ? 404
        : message === 'title is required' || message === 'dueAt is invalid'
          ? 400
          : 500
    return json({ error: message }, { status }, cors)
  }
}

export async function handleTutoringUpdateTodo(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, cors)

  const auth = await requireAuthUser(req, cors)
  if (!auth.ok) return auth.response

  try {
    const body = await readJsonBody(req)
    const todoId = typeof body.todoId === 'string' ? body.todoId : ''
    if (!todoId) return json({ error: 'todoId is required' }, { status: 400 }, cors)
    if (typeof body.done !== 'boolean') {
      return json({ error: 'done must be a boolean' }, { status: 400 }, cors)
    }
    const { service } = buildService()
    const result = await service.updateTodo(auth.user.id, { todoId, done: body.done })
    return json(result, {}, cors)
  } catch (error) {
    const message = formatUnknownError(error)
    const status = message === 'Todo not found' ? 404 : 500
    return json({ error: message }, { status }, cors)
  }
}
