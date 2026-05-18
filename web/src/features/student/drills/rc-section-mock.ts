export type RcSectionQuestion = {
  id: string
  stem: string
  choices: readonly [string, string, string, string, string]
}

const passageBody =
  "Ethicist: This hospital's ethics code states that physicians must always act in the patient's best interest. In practice, this rule sometimes conflicts with a family's wishes when the family insists on aggressive treatment that physicians believe is futile. The ethicist argues that honoring the code requires physicians to override such family demands whenever doing so better promotes patient welfare, even when the patient is incapacitated and cannot speak for themselves."

const q1Stem =
  "Which one of the following, if true, most seriously weakens the ethicist's argument?"

const q1Choices = [
  "Most patients in the hospital recover more quickly when families participate actively in care decisions.",
  "The ethics code explicitly requires physicians to seek consensus with legally authorized surrogates before overriding treatment requests.",
  "Patient welfare, on the ethicist's definition, includes respect for the patient's prior expressed values, which may align with the family's request.",
  "Physicians routinely consult ethics committees that include family representatives before making contested decisions.",
  "Hospitals that strictly follow the ethicist's policy report higher rates of malpractice litigation than peer institutions.",
] as const

const fillerStem = "The information in the passage most strongly supports which one of the following statements?"

const fillerChoices = [
  "Family preferences should never influence clinical decisions.",
  "Ethics codes are primarily designed to limit physician liability.",
  "Incapacitated patients retain moral claims that surrogates may voice on their behalf.",
  "Futile treatment is always contrary to patient welfare.",
  "Ethics committees replace the need for individual physician judgment.",
] as const

export const rcSectionSessionMock = {
  passageTitle: "Section 2 - Diagnostic",
  defaultTestLabel: "PT141",
  passage: passageBody,
  questions: Array.from({ length: 15 }, (_, i): RcSectionQuestion => {
    const n = i + 1
    return {
      id: `rc-mock-${n}`,
      stem: n === 1 ? q1Stem : `${fillerStem} (Question ${n}.)`,
      choices: n === 1 ? q1Choices : fillerChoices,
    }
  }),
}
