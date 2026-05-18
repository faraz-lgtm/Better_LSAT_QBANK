import { handleAdminMicro } from "../admin/micro-routes.ts"

Deno.serve((req) => handleAdminMicro(req, "admin-upsert-platform-config"))
