import { handleStripeWebhook } from '../billing/billing.controller.ts'

Deno.serve(handleStripeWebhook)
