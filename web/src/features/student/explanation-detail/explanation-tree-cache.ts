import type { ExplanationPrepTestNode } from "@/features/student/explanation-detail/explanation-tree-types"

const treesByPrepTestId = new Map<string, ExplanationPrepTestNode>()

export function cacheExplanationPrepTestTree(prepTest: ExplanationPrepTestNode): void {
  treesByPrepTestId.set(prepTest.id, prepTest)
}

export function getCachedExplanationPrepTestTree(prepTestId: string): ExplanationPrepTestNode | null {
  return treesByPrepTestId.get(prepTestId) ?? null
}

export function listCachedExplanationPrepTestTrees(): ExplanationPrepTestNode[] {
  return [...treesByPrepTestId.values()]
}

export function clearExplanationTreeCache(): void {
  treesByPrepTestId.clear()
}
