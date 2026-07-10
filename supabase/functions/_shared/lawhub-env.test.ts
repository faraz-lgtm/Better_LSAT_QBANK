import { assertEquals } from 'jsr:@std/assert@1'
import {
  LAWHUB_PRODUCTION_BASE_URL,
  LAWHUB_PRODUCTION_SCOPE,
  LAWHUB_SANDBOX_BASE_URL,
  LAWHUB_SANDBOX_SCOPE,
  LAWHUB_DEFAULT_TENANT_ID,
  parseLawHubEnv,
} from './lawhub-env.ts'

const credentials = {
  LSAC_VENDOR_ID: 'vendor-uuid',
  LSAC_CLIENT_ID: 'client-id',
  LSAC_CLIENT_SECRET: 'client-secret',
}

Deno.test('parseLawHubEnv uses sandbox defaults when LAWHUB_SANDBOX=true', () => {
  const env = parseLawHubEnv({ ...credentials, LAWHUB_SANDBOX: 'true' })
  assertEquals(env?.LSAC_BASE_URL, LAWHUB_SANDBOX_BASE_URL)
  assertEquals(env?.LSAC_SCOPE, LAWHUB_SANDBOX_SCOPE)
  assertEquals(env?.LSAC_TENANT_ID, LAWHUB_DEFAULT_TENANT_ID)
  assertEquals(env?.isSandbox, true)
})

Deno.test('parseLawHubEnv accepts LawHubSandbox alias', () => {
  const env = parseLawHubEnv({ ...credentials, LawHubSandbox: '1' })
  assertEquals(env?.isSandbox, true)
  assertEquals(env?.LSAC_BASE_URL, LAWHUB_SANDBOX_BASE_URL)
})

Deno.test('parseLawHubEnv uses production defaults when sandbox flag unset', () => {
  const env = parseLawHubEnv({ ...credentials })
  assertEquals(env?.LSAC_BASE_URL, LAWHUB_PRODUCTION_BASE_URL)
  assertEquals(env?.LSAC_SCOPE, LAWHUB_PRODUCTION_SCOPE)
  assertEquals(env?.isSandbox, false)
})

Deno.test('parseLawHubEnv explicit LSAC_BASE_URL and LSAC_SCOPE override defaults', () => {
  const env = parseLawHubEnv({
    ...credentials,
    LAWHUB_SANDBOX: 'true',
    LSAC_BASE_URL: 'https://custom.example',
    LSAC_SCOPE: 'https://custom.scope/.default',
  })
  assertEquals(env?.LSAC_BASE_URL, 'https://custom.example')
  assertEquals(env?.LSAC_SCOPE, 'https://custom.scope/.default')
})

Deno.test('parseLawHubEnv returns null when credentials missing', () => {
  assertEquals(parseLawHubEnv({ LAWHUB_SANDBOX: 'true' }), null)
})
