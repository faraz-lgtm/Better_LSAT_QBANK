import { assertEquals } from 'jsr:@std/assert@1'
import {
  MAILERLITE_DIAGNOSTIC_DONE_GROUP_ID,
  MAILERLITE_FIELD_DIAGNOSTIC_DONE,
  MAILERLITE_FIELD_DIAGNOSTIC_SCORE,
  MAILERLITE_FIELD_DIAGNOSTIC_TYPE,
  MAILERLITE_FIELD_EMAIL,
  MAILERLITE_FIELD_SUBSCRIPTION_PACKAGE,
  MAILERLITE_FIELD_SUBSCRIPTION_STATUS,
  MAILERLITE_PACKAGE_FREE,
  MAILERLITE_SIGNUP_GROUP_ID,
  buildMailerLiteSubscriberFields,
  mailerLiteDiagnosticTypeFromIntent,
  mailerLitePackageFromCheckoutPlan,
  normalizeMailerLiteDiagnosticScore,
  notifyMailerLiteDiagnostic,
  notifyMailerLiteSignup,
  notifyMailerLiteSubscription,
  resolveMailerLiteSignupGroupIds,
} from './mailerlite-signup.ts'

Deno.test('resolveMailerLiteSignupGroupIds always includes signup group', () => {
  assertEquals(resolveMailerLiteSignupGroupIds(() => undefined), [MAILERLITE_SIGNUP_GROUP_ID])
})

Deno.test('resolveMailerLiteSignupGroupIds includes configured Users group as well', () => {
  assertEquals(
    resolveMailerLiteSignupGroupIds((key) =>
      key === 'MAILERLITE_USERS_GROUP_ID' ? '200747565208044623' : undefined
    ),
    ['200747565208044623', MAILERLITE_SIGNUP_GROUP_ID],
  )
})

Deno.test('resolveMailerLiteSignupGroupIds dedupes when env matches signup group', () => {
  assertEquals(
    resolveMailerLiteSignupGroupIds((key) =>
      key === 'MAILERLITE_USERS_GROUP_ID' ? MAILERLITE_SIGNUP_GROUP_ID : undefined
    ),
    [MAILERLITE_SIGNUP_GROUP_ID],
  )
})

Deno.test('resolveMailerLiteSignupGroupIds includes diagnostic-done group when done', () => {
  assertEquals(resolveMailerLiteSignupGroupIds(() => undefined, { diagnosticDone: true }), [
    MAILERLITE_SIGNUP_GROUP_ID,
    MAILERLITE_DIAGNOSTIC_DONE_GROUP_ID,
  ])
})

Deno.test('resolveMailerLiteSignupGroupIds omits diagnostic-done group when not done', () => {
  assertEquals(
    resolveMailerLiteSignupGroupIds(() => undefined, { diagnosticDone: false }),
    [MAILERLITE_SIGNUP_GROUP_ID],
  )
})

Deno.test('mailerLiteDiagnosticTypeFromIntent maps mini/quick/full', () => {
  assertEquals(mailerLiteDiagnosticTypeFromIntent('mini'), 'mini')
  assertEquals(mailerLiteDiagnosticTypeFromIntent('quick'), 'full')
  assertEquals(mailerLiteDiagnosticTypeFromIntent('full'), 'full')
  assertEquals(mailerLiteDiagnosticTypeFromIntent('other'), null)
})

Deno.test('mailerLitePackageFromCheckoutPlan matches pricing page labels', () => {
  assertEquals(mailerLitePackageFromCheckoutPlan(null, false), 'Free Access')
  assertEquals(mailerLitePackageFromCheckoutPlan('monthly', true), 'Monthly')
  assertEquals(mailerLitePackageFromCheckoutPlan('three_month', true), '3 Months')
  assertEquals(mailerLitePackageFromCheckoutPlan('six_month', true), '6 Months')
  assertEquals(mailerLitePackageFromCheckoutPlan('yearly', true), '12 Months')
  assertEquals(mailerLitePackageFromCheckoutPlan(null, true), 'Full Access')
})

Deno.test('buildMailerLiteSubscriberFields defaults to email only when no sections', () => {
  assertEquals(buildMailerLiteSubscriberFields({ email: 'a@b.com' }), {
    [MAILERLITE_FIELD_EMAIL]: 'a@b.com',
  })
})

Deno.test('normalizeMailerLiteDiagnosticScore rounds finite values', () => {
  assertEquals(normalizeMailerLiteDiagnosticScore(152.4), 152)
  assertEquals(normalizeMailerLiteDiagnosticScore('160'), 160)
  assertEquals(normalizeMailerLiteDiagnosticScore(''), null)
  assertEquals(normalizeMailerLiteDiagnosticScore(null), null)
  assertEquals(normalizeMailerLiteDiagnosticScore(Number.NaN), null)
})

Deno.test('buildMailerLiteSubscriberFields sets diagnostic without subscription', () => {
  assertEquals(
    buildMailerLiteSubscriberFields({
      email: 'a@b.com',
      diagnostic: { done: true, type: 'mini' },
    }),
    {
      [MAILERLITE_FIELD_EMAIL]: 'a@b.com',
      [MAILERLITE_FIELD_DIAGNOSTIC_DONE]: 'yes',
      [MAILERLITE_FIELD_DIAGNOSTIC_TYPE]: 'mini',
    },
  )
})

Deno.test('buildMailerLiteSubscriberFields sets diagnostic score when provided', () => {
  assertEquals(
    buildMailerLiteSubscriberFields({
      email: 'a@b.com',
      diagnostic: { done: true, type: 'full', score: 154.6 },
    }),
    {
      [MAILERLITE_FIELD_EMAIL]: 'a@b.com',
      [MAILERLITE_FIELD_DIAGNOSTIC_DONE]: 'yes',
      [MAILERLITE_FIELD_DIAGNOSTIC_TYPE]: 'full',
      [MAILERLITE_FIELD_DIAGNOSTIC_SCORE]: 155,
    },
  )
})

Deno.test('buildMailerLiteSubscriberFields omits diagnostic score when undefined', () => {
  const fields = buildMailerLiteSubscriberFields({
    email: 'a@b.com',
    diagnostic: { done: true, type: 'mini' },
  })
  assertEquals(Object.hasOwn(fields, MAILERLITE_FIELD_DIAGNOSTIC_SCORE), false)
})

Deno.test('buildMailerLiteSubscriberFields sets subscription without diagnostic', () => {
  assertEquals(
    buildMailerLiteSubscriberFields({
      email: 'a@b.com',
      subscription: { status: 'paid', package: '6 Months' },
    }),
    {
      [MAILERLITE_FIELD_EMAIL]: 'a@b.com',
      [MAILERLITE_FIELD_SUBSCRIPTION_STATUS]: 'paid',
      [MAILERLITE_FIELD_SUBSCRIPTION_PACKAGE]: '6 Months',
    },
  )
})

Deno.test('notifyMailerLiteSignup no-ops when API token missing', async () => {
  let called = false
  const ok = await notifyMailerLiteSignup({
    email: 'a@example.com',
    getEnv: (key) => (key === 'MAILERLITE_USERS_GROUP_ID' ? '200747565208044623' : undefined),
    fetchImpl: async () => {
      called = true
      return new Response('ok')
    },
  })
  assertEquals(ok, false)
  assertEquals(called, false)
})

Deno.test('notifyMailerLiteSignup posts free package + diagnostic defaults', async () => {
  let body: Record<string, unknown> = {}
  const ok = await notifyMailerLiteSignup({
    email: 'student@example.com',
    getEnv: (key) => (key === 'MAILERLITE_API_TOKEN' ? 'ml-token' : undefined),
    fetchImpl: async (_input, init) => {
      body = JSON.parse((init as { body?: string } | undefined)?.body ?? '{}') as Record<
        string,
        unknown
      >
      return new Response('{}', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(body.email, 'student@example.com')
  assertEquals(body.groups, [MAILERLITE_SIGNUP_GROUP_ID])
  assertEquals(body.fields, {
    email: 'student@example.com',
    diagnostic_done: 'no',
    diagnostic_type: '',
    subscription_status: 'free',
    subscription_package: MAILERLITE_PACKAGE_FREE,
  })
})

Deno.test('notifyMailerLiteSignup posts subscriber upsert with both groups', async () => {
  let url = ''
  let method = ''
  let auth = ''
  let body: Record<string, unknown> = {}
  const ok = await notifyMailerLiteSignup({
    email: 'student@example.com',
    getEnv: (key) => {
      if (key === 'MAILERLITE_API_TOKEN') return 'ml-token'
      if (key === 'MAILERLITE_USERS_GROUP_ID') return '200747565208044623'
      return undefined
    },
    fetchImpl: async (input, init) => {
      url = String(input)
      method = (init as { method?: string } | undefined)?.method ?? ''
      const headers = (init as { headers?: Record<string, string> } | undefined)?.headers ?? {}
      auth = headers.Authorization ?? ''
      body = JSON.parse((init as { body?: string } | undefined)?.body ?? '{}') as Record<
        string,
        unknown
      >
      return new Response('{}', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(url, 'https://connect.mailerlite.com/api/subscribers')
  assertEquals(method, 'POST')
  assertEquals(auth, 'Bearer ml-token')
  assertEquals(body.email, 'student@example.com')
  assertEquals(body.groups, ['200747565208044623', MAILERLITE_SIGNUP_GROUP_ID])
})

Deno.test('notifyMailerLiteSignup includes diagnostic-done group when diagnosticDone', async () => {
  let body: Record<string, unknown> = {}
  const ok = await notifyMailerLiteSignup({
    email: 'student@example.com',
    diagnosticDone: true,
    diagnosticType: 'mini',
    getEnv: (key) => (key === 'MAILERLITE_API_TOKEN' ? 'ml-token' : undefined),
    fetchImpl: async (_input, init) => {
      body = JSON.parse((init as { body?: string } | undefined)?.body ?? '{}') as Record<
        string,
        unknown
      >
      return new Response('{}', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(body.groups, [MAILERLITE_SIGNUP_GROUP_ID, MAILERLITE_DIAGNOSTIC_DONE_GROUP_ID])
  assertEquals(body.fields, {
    email: 'student@example.com',
    diagnostic_done: 'yes',
    diagnostic_type: 'mini',
    subscription_status: 'free',
    subscription_package: MAILERLITE_PACKAGE_FREE,
  })
})

Deno.test('notifyMailerLiteDiagnostic assigns diagnostic-done group when done', async () => {
  let body: Record<string, unknown> = {}
  const ok = await notifyMailerLiteDiagnostic({
    email: 'student@example.com',
    diagnosticDone: true,
    diagnosticType: 'full',
    diagnosticScore: 158,
    getEnv: (key) => (key === 'MAILERLITE_API_TOKEN' ? 'ml-token' : undefined),
    fetchImpl: async (_input, init) => {
      body = JSON.parse((init as { body?: string } | undefined)?.body ?? '{}') as Record<
        string,
        unknown
      >
      return new Response('{}', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(body.groups, [MAILERLITE_SIGNUP_GROUP_ID, MAILERLITE_DIAGNOSTIC_DONE_GROUP_ID])
  assertEquals(body.fields, {
    email: 'student@example.com',
    diagnostic_done: 'yes',
    diagnostic_type: 'full',
    diagnostic_score: 158,
  })
})

Deno.test('notifyMailerLiteDiagnostic skips groups when diagnostic not done', async () => {
  let body: Record<string, unknown> = {}
  const ok = await notifyMailerLiteDiagnostic({
    email: 'student@example.com',
    diagnosticDone: false,
    diagnosticType: null,
    getEnv: (key) => (key === 'MAILERLITE_API_TOKEN' ? 'ml-token' : undefined),
    fetchImpl: async (_input, init) => {
      body = JSON.parse((init as { body?: string } | undefined)?.body ?? '{}') as Record<
        string,
        unknown
      >
      return new Response('{}', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(body.groups, undefined)
  assertEquals(body.fields, {
    email: 'student@example.com',
    diagnostic_done: 'no',
    diagnostic_type: '',
  })
})

Deno.test('notifyMailerLiteSubscription updates paid package fields only', async () => {
  let body: Record<string, unknown> = {}
  const ok = await notifyMailerLiteSubscription({
    email: 'student@example.com',
    subscriptionStatus: 'paid',
    subscriptionPackage: '3 Months',
    getEnv: (key) => (key === 'MAILERLITE_API_TOKEN' ? 'ml-token' : undefined),
    fetchImpl: async (_input, init) => {
      body = JSON.parse((init as { body?: string } | undefined)?.body ?? '{}') as Record<
        string,
        unknown
      >
      return new Response('{}', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(body.groups, undefined)
  assertEquals(body.fields, {
    email: 'student@example.com',
    subscription_status: 'paid',
    subscription_package: '3 Months',
  })
})

Deno.test('notifyMailerLiteSignup returns false on non-OK response', async () => {
  const ok = await notifyMailerLiteSignup({
    email: 'a@example.com',
    getEnv: (key) => {
      if (key === 'MAILERLITE_API_TOKEN') return 'ml-token'
      if (key === 'MAILERLITE_USERS_GROUP_ID') return '200747565208044623'
      return undefined
    },
    fetchImpl: async () => new Response('error', { status: 422 }),
  })
  assertEquals(ok, false)
})

Deno.test('notifyMailerLiteSignup returns false on fetch failure', async () => {
  const ok = await notifyMailerLiteSignup({
    email: 'a@example.com',
    getEnv: (key) => {
      if (key === 'MAILERLITE_API_TOKEN') return 'ml-token'
      if (key === 'MAILERLITE_USERS_GROUP_ID') return '200747565208044623'
      return undefined
    },
    fetchImpl: async () => {
      throw new Error('network')
    },
  })
  assertEquals(ok, false)
})
