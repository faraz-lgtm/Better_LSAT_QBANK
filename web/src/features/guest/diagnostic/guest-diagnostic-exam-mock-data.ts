import type { DrillQuestion } from "@/features/student/drills/drill-types"

const GUEST_DIAGNOSTIC_PREVIEW_PASSAGE = `Professor x submitted a book draft consisting of six chapters to a publisher. For the purposes of the contract, the chapters are numbered 1, 2, 3, 4, 5, and 6, though their actual order in the book may be changed by the publisher. Professor X has made several notes to the publisher about how to order the chapters, as follows:

Taking these constraints into account, we can note a number of statements that must be true or must be false. Also, we can note what orderings are possible, as well as what is not possible given the constraints; therefore, answers can reference orderings that may or may not be possible. For instance, one ordering that is possible is 3, 5, 4, 6, 1, 2. If desired, spend a minute verifying that this ordering is possible. Others are as well, though it's not necessary to enumerate them at this stage.`

const GUEST_DIAGNOSTIC_PREVIEW_QUESTION: DrillQuestion = {
  id: "guest-diagnostic-preview-q1",
  questionNumber: 1,
  stimulusText: GUEST_DIAGNOSTIC_PREVIEW_PASSAGE,
  stemText: "The reasoning in the argument is most vulnerable to criticism on the grounds that the argument",
  passage: null,
  choices: [
    {
      id: "A",
      index: 0,
      text: "fails to consider whether corporations that do not currently use motivational posters would increase their employees' motivation to work productively if they began using the posters",
    },
    {
      id: "B",
      index: 1,
      text: "takes for granted that, with respect to their employees' motivation to work productively, corporations that decorate their halls with motivational posters are representative of corporations in general",
    },
    {
      id: "C",
      index: 2,
      text: "fails to consider that even if motivational posters do not have one particular beneficial effect for corporations, they may have similar effects that are equally beneficial",
    },
    {
      id: "D",
      index: 3,
      text: "does not adequately address the possibility that employee productivity is strongly affected by factors other than employees' motivation to work productively",
    },
    {
      id: "E",
      index: 4,
      text: "fails to consider that even if employees are already motivated to work productively, motivational posters may increase that motivation",
    },
  ],
}

function createGuestDiagnosticPreviewQuestions(questionCount: number): DrillQuestion[] {
  return Array.from({ length: questionCount }, (_, index) => ({
    ...GUEST_DIAGNOSTIC_PREVIEW_QUESTION,
    id: `guest-diagnostic-preview-q${index + 1}`,
    questionNumber: index + 1,
  }))
}

export { GUEST_DIAGNOSTIC_PREVIEW_QUESTION, createGuestDiagnosticPreviewQuestions }
