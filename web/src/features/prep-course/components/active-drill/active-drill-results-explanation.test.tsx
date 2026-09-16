import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ActiveDrillResultsExplanation } from "@/features/prep-course/components/active-drill/active-drill-results-explanation"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"

const detail: ExplanationDetailPayload = {
  questionId: "q1",
  prepTestId: "pt-129",
  prepTestTitle: "PT 129",
  prepTestNumber: "129",
  sectionId: "s1",
  sectionType: "LR",
  sectionNumber: 1,
  questionNumber: 19,
  topicName: "Main Point",
  tags: ["Art"],
  explanationHtml:
    "<p>While this question presents quite a challenge, its form is cookie cutter.</p>",
  videoUrl: null,
  stimulusText: "Critics of consumerism claim advertising blurs wants and needs.",
  stemText: "Which one of the following most accurately states the conclusion of the argument as a whole?",
  choices: [
    {
      id: "A",
      index: 1,
      text: "The claim that advertising persuades people that they need things that they merely want rests on a fuzzy distinction.",
      explanationHtml: "<p>Hopefully you were able to pick Correct Answer Choice (A).</p>",
    },
    {
      id: "B",
      index: 2,
      text: "Many critics of consumerism insist that advertising attempts to blur people's ability to distinguish between wants and needs.",
      explanationHtml: "<p>Answer Choice (B) paraphrases the context claim.</p>",
    },
  ],
  correctChoiceId: "A",
  passage: { id: "", displayNumber: 1, title: "", body: "" },
  answerPopularity: [],
  difficulty: 4,
}

describe("ActiveDrillResultsExplanation", () => {
  it("renders the Figma question write-up with stem, stimulus analysis, and answer choices", () => {
    render(<ActiveDrillResultsExplanation detail={detail} />)

    expect(screen.getByRole("heading", { level: 2, name: "Question" })).toHaveClass("text-[24px]")
    expect(
      screen.getByText("Which one of the following most accurately states the conclusion of the argument as a whole?"),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Stimulus" })).toHaveClass("text-[24px]")
    expect(screen.getByText(/its form is cookie cutter/)).toBeInTheDocument()
    expect(screen.getByText("Answer Choice A")).toHaveClass("font-extrabold")
    expect(
      screen.getByText(
        "The claim that advertising persuades people that they need things that they merely want rests on a fuzzy distinction.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/Hopefully you were able to pick Correct Answer Choice \(A\)/)).toBeInTheDocument()
    expect(screen.getByText("Answer Choice B")).toBeInTheDocument()
    expect(screen.queryByText("Critics of consumerism claim advertising blurs wants and needs.")).not.toBeInTheDocument()
  })

  it("falls back to lesson HTML when the question has no published explanation", () => {
    render(
      <ActiveDrillResultsExplanation
        detail={null}
        fallbackHtml="<p>The Question:</p><p>Hidden until complete.</p>"
      />,
    )

    expect(screen.queryByRole("heading", { name: "Question" })).not.toBeInTheDocument()
    expect(screen.getByText("Hidden until complete.")).toBeInTheDocument()
  })

  it("embeds the explanation video in the Figma 640×310 frame", () => {
    render(
      <ActiveDrillResultsExplanation
        detail={{ ...detail, stemText: null }}
        videoUrl="https://www.youtube.com/watch?v=abc123xyz"
        videoTitle="Motivational Posters"
      />,
    )

    const iframe = screen.getByTitle("Motivational Posters")
    expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/abc123xyz")
    expect(iframe.parentElement).toHaveClass("h-[310px]")
    expect(iframe.parentElement).toHaveClass("rounded-t-[18px]")
  })
})
