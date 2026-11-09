import { handleZoomWebhook } from '../tutoring/zoom-webhook.controller.ts'

Deno.serve(handleZoomWebhook)
