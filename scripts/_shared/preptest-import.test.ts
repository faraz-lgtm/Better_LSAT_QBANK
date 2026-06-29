import { assertEquals } from "jsr:@std/assert@1"

import {
  dedupeExplanationRows,
  explanationHtmlForSave,
  mergeChoiceExplanations,
  moduleIdFromPrepTestNumber,
  parseExplanationCsvRecord,
  parseScaledScoreCsvRows,
  parseScaledScoreFilename,
  prepTestNumberFromModuleId,
  questionLookupKey,
  selectScaledScoreFiles,
} from "./preptest-import.ts"

Deno.test("prepTestNumberFromModuleId parses base and split modules", () => {
  assertEquals(prepTestNumberFromModuleId("LSAC101"), 101)
  assertEquals(prepTestNumberFromModuleId("lsac094"), 94)
  assertEquals(prepTestNumberFromModuleId("LSAC101:LA:3:7S:S"), 101)
  assertEquals(prepTestNumberFromModuleId("INVALID"), null)
})

Deno.test("moduleIdFromPrepTestNumber builds LSAC id", () => {
  assertEquals(moduleIdFromPrepTestNumber(101), "LSAC101")
})

Deno.test("parseScaledScoreFilename handles naming patterns", () => {
  assertEquals(parseScaledScoreFilename("lsatscore101.csv"), 101)
  assertEquals(parseScaledScoreFilename("Test_150_Jun2018.csv"), 150)
  assertEquals(parseScaledScoreFilename("LSAT_Score_Conversion139.csv"), 139)
  assertEquals(parseScaledScoreFilename("lsatscore130 (1).csv"), null)
  assertEquals(parseScaledScoreFilename("notes.txt"), null)
})

Deno.test("selectScaledScoreFiles prefers Test_ over lsatscore over conversion", () => {
  const selected = selectScaledScoreFiles([
    "lsatscore150.csv",
    "Test_150_Jun2018.csv",
    "LSAT_Score_Conversion150.csv",
    "lsatscore101.csv",
    "lsatscore130 (1).csv",
  ])
  const byPt = new Map(selected.map((f) => [f.prepTestNumber, f.path]))
  assertEquals(byPt.get(150), "Test_150_Jun2018.csv")
  assertEquals(byPt.get(101), "lsatscore101.csv")
  assertEquals(byPt.has(130), false)
})

Deno.test("explanationHtmlForSave treats blank and tag-only as null", () => {
  assertEquals(explanationHtmlForSave(""), null)
  assertEquals(explanationHtmlForSave("<p></p>"), null)
  assertEquals(explanationHtmlForSave("<p>Real text</p>"), "<p>Real text</p>")
})

Deno.test("mergeChoiceExplanations updates object choices and preserves content", () => {
  const choices = [
    { optionLetter: "A", optionContent: "Alpha" },
    { optionLetter: "B", optionContent: "Beta", optionExplanation: "<p>old</p>" },
  ]
  const merged = mergeChoiceExplanations(choices, {
    explanationA: "<p>Why not A</p>",
    explanationB: "<p>Why not B</p>",
    explanationC: null,
    explanationD: null,
    explanationE: null,
  }) as Record<string, unknown>[]

  assertEquals(merged[0]?.optionContent, "Alpha")
  assertEquals(merged[0]?.optionExplanation, "<p>Why not A</p>")
  assertEquals(merged[1]?.optionExplanation, "<p>Why not B</p>")
})

Deno.test("mergeChoiceExplanations upgrades string choices", () => {
  const merged = mergeChoiceExplanations(["First", "Second"], {
    explanationA: "<p>A</p>",
    explanationB: null,
    explanationC: null,
    explanationD: null,
    explanationE: null,
  }) as Record<string, unknown>[]

  assertEquals(merged[0]?.optionLetter, "A")
  assertEquals(merged[0]?.optionContent, "First")
  assertEquals(merged[0]?.optionExplanation, "<p>A</p>")
  assertEquals(merged[1]?.optionExplanation, undefined)
})

Deno.test("dedupeExplanationRows keeps last row per key", () => {
  const rows = [
    {
      prepTest: 101,
      section: 2,
      question: 1,
      explanation: "<p>first</p>",
      explanationA: null,
      explanationB: null,
      explanationC: null,
      explanationD: null,
      explanationE: null,
    },
    {
      prepTest: 101,
      section: 2,
      question: 1,
      explanation: "<p>last</p>",
      explanationA: null,
      explanationB: null,
      explanationC: null,
      explanationD: null,
      explanationE: null,
    },
  ]
  const { unique, duplicateKeysCollapsed } = dedupeExplanationRows(rows)
  assertEquals(duplicateKeysCollapsed, 1)
  assertEquals(unique.length, 1)
  assertEquals(unique[0]?.explanation, "<p>last</p>")
})

Deno.test("parseExplanationCsvRecord reads bulk_import_final columns", () => {
  const row = parseExplanationCsvRecord({
    "Prep test": "101",
    Section: "2",
    Question: "3",
    Explanation: "<p>Main</p>",
    explanation_A: "<p>A</p>",
    explanation_B: "",
    explanation_C: "",
    explanation_D: "",
    explanation_E: "",
  })
  assertEquals(row?.prepTest, 101)
  assertEquals(row?.section, 2)
  assertEquals(row?.question, 3)
  assertEquals(row?.explanation, "<p>Main</p>")
  assertEquals(row?.explanationA, "<p>A</p>")
})

Deno.test("parseScaledScoreCsvRows maps Raw Score and LSAT Score columns", () => {
  const rows = parseScaledScoreCsvRows([
    { "Raw Score": "77", "LSAT Score": "180" },
    { "Raw Score": "bad", "LSAT Score": "180" },
  ])
  assertEquals(rows, [{ rawScore: 77, scaledScore: 180 }])
})

Deno.test("questionLookupKey format", () => {
  assertEquals(questionLookupKey(101, 2, 5), "101-2-5")
})
