import { assertEquals } from 'jsr:@std/assert@1'

import { createPrepCourseRepository } from './prep-course.repository.ts'

Deno.test('getCourseOutline calls RPC with hydrate/module args and maps payload', async () => {
  let rpcArgs: Record<string, unknown> | null = null
  const client = {
    async rpc(name: string, args: Record<string, unknown>) {
      assertEquals(name, 'get_prep_course_outline')
      rpcArgs = args
      return {
        data: {
          course: {
            id: 'c1',
            slug: 'prep-course',
            title: 'Prep Course',
            description: null,
            is_published: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          curriculum: {
            modules: [
              {
                id: 'mod-1',
                course_id: 'c1',
                title: 'Module 1',
                sort_order: 1,
                duration_minutes: 10,
                sections: [
                  {
                    id: 'sec-1',
                    module_id: 'mod-1',
                    title: 'Section 1',
                    sort_order: 1,
                    duration_minutes: 5,
                    lessons: [
                      {
                        id: 'les-1',
                        course_id: 'c1',
                        section_id: 'sec-1',
                        slug: 'intro',
                        title: 'Intro',
                        lesson_type: 'article',
                        sort_order: 1,
                        duration_minutes: 5,
                        is_published: true,
                        created_at: '2026-01-01T00:00:00Z',
                        updated_at: '2026-01-01T00:00:00Z',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          lessons: [
            {
              id: 'les-1',
              course_id: 'c1',
              section_id: 'sec-1',
              slug: 'intro',
              title: 'Intro',
              lesson_type: 'article',
              sort_order: 1,
              duration_minutes: 5,
              is_published: true,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          completedLessonSlugs: ['intro'],
          bookmarks: { moduleIds: ['mod-1'], lessonSlugs: ['intro'] },
          hydratedModuleIds: ['mod-1'],
          moduleStats: [{ moduleId: 'mod-1', lessonCount: 1, totalMinutes: 5 }],
        },
        error: null,
      }
    },
  }

  const repo = createPrepCourseRepository(client as never)
  const out = await repo.getCourseOutline('prep-course', 'user-1', {
    hydrate: 'first',
    moduleId: 'mod-1',
  })

  assertEquals(rpcArgs, {
    p_course_slug: 'prep-course',
    p_user_id: 'user-1',
    p_hydrate: 'first',
    p_module_id: 'mod-1',
  })
  assertEquals(out?.course.slug, 'prep-course')
  assertEquals(out?.lessons[0]?.slug, 'intro')
  assertEquals(out?.lessons[0]?.text_content, null)
  assertEquals(out?.curriculum.modules[0]?.sections[0]?.lessons[0]?.summary, null)
  assertEquals(out?.completedLessonSlugs, ['intro'])
  assertEquals(out?.bookmarks, { moduleIds: ['mod-1'], lessonSlugs: ['intro'] })
  assertEquals(out?.hydratedModuleIds, ['mod-1'])
  assertEquals(out?.moduleStats, [{ moduleId: 'mod-1', lessonCount: 1, totalMinutes: 5 }])
})

Deno.test('getCourseOutline returns null when RPC returns null', async () => {
  const client = {
    async rpc() {
      return { data: null, error: null }
    },
  }
  const repo = createPrepCourseRepository(client as never)
  const out = await repo.getCourseOutline('missing', 'user-1')
  assertEquals(out, null)
})

Deno.test('getCourseOutline defaults hydrate to all and null moduleId', async () => {
  let rpcArgs: Record<string, unknown> | null = null
  const client = {
    async rpc(_name: string, args: Record<string, unknown>) {
      rpcArgs = args
      return { data: null, error: null }
    },
  }
  const repo = createPrepCourseRepository(client as never)
  await repo.getCourseOutline('prep-course', 'user-1')
  assertEquals(rpcArgs, {
    p_course_slug: 'prep-course',
    p_user_id: 'user-1',
    p_hydrate: 'all',
    p_module_id: null,
  })
})
