import { assertEquals } from "jsr:@std/assert@1"
import { createAdminService } from "./admin.service.ts"

type CurriculumModule = {
  id: string
  sections: Array<{ id: string; lessons: Array<{ id: string; section_id: string }> }>
}

Deno.test("listCurriculum assembles nested modules, sections, and lessons", async () => {
  const courseId = "course-1"
  const moduleId = "mod-1"
  const sectionId = "sec-1"
  const lessonId = "les-1"

  const repository = {
    getProfileRole: async () => "admin" as const,
    listCurriculum: async (id: string) => {
      assertEquals(id, courseId)
      return {
        modules: [
          {
            id: moduleId,
            title: "Module 1",
            sort_order: 1,
            sections: [
              {
                id: sectionId,
                module_id: moduleId,
                title: "General",
                sort_order: 1,
                lessons: [
                  {
                    id: lessonId,
                    course_id: courseId,
                    section_id: sectionId,
                    title: "Intro",
                    sort_order: 1,
                  },
                ],
              },
            ],
          },
        ] as unknown as CurriculumModule[],
      }
    },
  }

  const service = createAdminService({
    repository: repository as never,
  })

  const out = await service.listCurriculum("admin-user", courseId)
  const modules = out.modules as CurriculumModule[]
  assertEquals(modules.length, 1)
  assertEquals(modules[0].sections[0].lessons[0].section_id, sectionId)
})

Deno.test("createLesson requires sectionId in repository call", async () => {
  let capturedSectionId = ""
  const repository = {
    getProfileRole: async () => "admin" as const,
    getSectionById: async () => ({
      id: "sec-1",
      prep_course_modules: { course_id: "course-1" },
    }),
    createLesson: async (input: { sectionId: string; courseId: string }) => {
      capturedSectionId = input.sectionId
      return { id: "les-1", ...input }
    },
  }

  const service = createAdminService({
    repository: repository as never,
  })

  await service.createLesson("admin-user", {
    courseId: "course-1",
    sectionId: "sec-1",
    title: "New lesson",
    slug: "new-lesson",
  })

  assertEquals(capturedSectionId, "sec-1")
})
