import { handleAmeliaWebhook } from '../tutoring/amelia-webhook.controller.ts'

Deno.serve(handleAmeliaWebhook)
