import { handleAdminMicro } from "../admin/micro-routes.ts"

Deno.serve((req) => handleAdminMicro(req, "admin-get-next-question-for-preptest"))
