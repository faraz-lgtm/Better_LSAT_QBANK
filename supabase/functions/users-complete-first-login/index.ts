import { handleUsersPostMicro } from "../users/post-micro.ts"

Deno.serve((req) => handleUsersPostMicro(req, "users-complete-first-login"))
