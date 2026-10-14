/** Left padding for each explanations tree depth. Borders stay full-width. */
export const EXPLANATION_TREE_PL_CLASS = {
  prepTest: "pl-4 sm:pl-6",
  section: "pl-5 sm:pl-14",
  passage: "pl-7 sm:pl-[88px]",
  question: "pl-7 sm:pl-[120px]",
} as const

export type ExplanationTreeLevel = keyof typeof EXPLANATION_TREE_PL_CLASS

export const EXPLANATION_TREE_LEVELS = ["prepTest", "section", "passage", "question"] as const
