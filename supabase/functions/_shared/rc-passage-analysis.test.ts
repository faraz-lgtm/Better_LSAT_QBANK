import { assertEquals } from "jsr:@std/assert@1"

import {
  buildPassageParagraphAnalyses,
  extractHtmlParagraphs,
  stripHtmlToText,
} from "./rc-passage-analysis.ts"

Deno.test("extractHtmlParagraphs keeps order and attributes", () => {
  const html =
    "<p style='text-indent: 1em;'>First</p><p>Second <strong>bit</strong></p>"
  assertEquals(extractHtmlParagraphs(html), [
    "<p style='text-indent: 1em;'>First</p>",
    "<p>Second <strong>bit</strong></p>",
  ])
})

Deno.test("stripHtmlToText removes tags and collapses space", () => {
  assertEquals(stripHtmlToText("<p>Hello &amp; <strong>world</strong></p>"), "Hello & world")
})

Deno.test("buildPassageParagraphAnalyses labels P1, P2 and pairs paragraphs", () => {
  const passage =
    "<p>Passage one.</p><p>Passage two.</p><p>Passage three.</p>"
  const explanation =
    "<p>Expl one.</p><p>Expl two.</p><p>Expl three.</p>"
  const rows = buildPassageParagraphAnalyses(passage, explanation)
  assertEquals(rows.length, 3)
  assertEquals(rows.map((r) => r.label), ["P1", "P2", "P3"])
  assertEquals(rows[0]?.explanationHtml, "<p>Expl one.</p>")
  assertEquals(rows[1]?.textExcerpt, "Passage two.")
})

Deno.test("buildPassageParagraphAnalyses truncates to shorter list", () => {
  const rows = buildPassageParagraphAnalyses(
    "<p>A</p><p>B</p><p>C</p>",
    "<p>Only one</p>",
  )
  assertEquals(rows.length, 1)
  assertEquals(rows[0]?.label, "P1")
})
