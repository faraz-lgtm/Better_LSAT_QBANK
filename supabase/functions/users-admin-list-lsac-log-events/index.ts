import { handleUsersPostMicro } from "../users/post-micro.ts"

Deno.serve((req) => handleUsersPostMicro(req, "users-admin-list-lsac-log-events"))
