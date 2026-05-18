import { handleAnalyticsMicro } from "../analytics/micro-routes.ts"

Deno.serve((req) => handleAnalyticsMicro(req, "analytics-kind-breakdown"))
