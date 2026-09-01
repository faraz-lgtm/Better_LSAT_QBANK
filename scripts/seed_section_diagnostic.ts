import { createServiceRoleClient } from "../supabase/functions/users/users.repository.ts"
import { buildSectionDiagnosticMarketingSet } from "../data/diagnostics/section-marketing-set.ts"
import { SECTION_DIAGNOSTIC_QUESTIONS } from "../data/diagnostics/section-marketing-questions.ts"
import type { MiniDiagnosticChoice } from "../data/diagnostics/mini-marketing-types.ts"

type CliOptions = {
  dryRun: boolean
}

function parseArgs(argv: string[]): CliOptions {
  return { dryRun: argv.includes("--dry-run") }
}

function choicesToJsonb(choices: MiniDiagnosticChoice[]) {
  return choices.map((choice) => ({
    optionLetter: choice.letter,
    optionContent: choice.text,
    optionExplanation: choice.explanation ?? null,
  }))
}

async function main() {
  const opts = parseArgs(Deno.args)
  const supabase = createServiceRoleClient()
  const set = buildSectionDiagnosticMarketingSet(SECTION_DIAGNOSTIC_QUESTIONS)

  const { data: section, error: sectionError } = await supabase
    .from("admin_sections")
    .select("id")
    .eq("module_id", set.moduleId)
    .eq("section_id", set.sectionId)
    .maybeSingle()

  if (sectionError) throw sectionError
  if (!section?.id) {
    throw new Error(
      `Section ${set.sectionId} not found for module ${set.moduleId}. Run migrations first.`,
    )
  }

  console.log(`Seeding ${set.questions.length} section diagnostic questions into section ${section.id}`)

  for (const question of set.questions) {
    const row = {
      section_id: section.id,
      source_item_id: question.sourceItemId,
      question_number: question.questionNumber,
      stimulus_text: question.stimulusText,
      stem_text: question.stemText,
      choices: choicesToJsonb(question.choices),
      correct_answer: question.correctAnswer,
      explanation: question.explanationHtml,
      difficulty: question.difficulty,
      source: "PLATFORM",
      source_label: question.questionType,
    }

    if (opts.dryRun) {
      console.log(`[dry-run] upsert ${question.sourceItemId} (#${question.questionNumber})`)
      continue
    }

    const { error } = await supabase.from("admin_questions").upsert(row, {
      onConflict: "section_id,source_item_id",
    })
    if (error) throw error
    console.log(`Upserted ${question.sourceItemId}`)
  }

  console.log(opts.dryRun ? "Dry run complete." : "Section diagnostic seed complete.")
}

if (import.meta.main) {
  await main()
}
