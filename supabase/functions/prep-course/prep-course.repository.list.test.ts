import { assertEquals } from 'jsr:@std/assert@1'

import { createPrepCourseRepository, PREP_LESSON_LIST_SELECT } from './prep-course.repository.ts'

Deno.test('listPublishedCurriculum loads lesson metadata without text_content', async () => {
  const selects: string[] = []
  const client = {
    from(table: string) {
      const builder = {
        select(cols: string) {
          if (table === 'prep_lessons') selects.push(cols)
          return builder
        },
        eq() {
          return builder
        },
        in() {
          return builder
        },
        order() {
          return builder
        },
        then(resolve: (value: { data: unknown[]; error: null }) => void) {
          if (table === 'prep_course_modules') {
            resolve({ data: [{ id: 'mod-1', course_id: 'c1', title: 'M', sort_order: 1, duration_minutes: 10 }], error: null })
            return
          }
          if (table === 'prep_course_sections') {
            resolve({ data: [{ id: 'sec-1', module_id: 'mod-1', title: 'S', sort_order: 1, duration_minutes: 10 }], error: null })
            return
          }
          resolve({
            data: [
              {
                id: 'les-1',
                course_id: 'c1',
                section_id: 'sec-1',
                slug: 'intro',
                title: 'Intro',
                lesson_type: 'article',
                sort_order: 1,
                summary: null,
                duration_minutes: 5,
                video_url: null,
                is_published: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
              },
            ],
            error: null,
          })
        },
      }
      return builder
    },
  }

  const repo = createPrepCourseRepository(client as never)
  const curriculum = await repo.listPublishedCurriculum('c1')
  assertEquals(curriculum.modules[0]?.sections[0]?.lessons[0]?.slug, 'intro')
  assertEquals(curriculum.modules[0]?.sections[0]?.lessons[0]?.text_content, null)
  assertEquals(selects[0], PREP_LESSON_LIST_SELECT)
  assertEquals(selects[0]?.includes('text_content'), false)
})
