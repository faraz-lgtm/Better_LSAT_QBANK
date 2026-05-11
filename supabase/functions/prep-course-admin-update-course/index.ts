import { handlePrepCourseAdminMicro } from "../prep-course/admin-micro.ts"

Deno.serve((req) => handlePrepCourseAdminMicro(req, "prep-course-admin-update-course"))
