export type RepWorkPair = { question: string; answer: string }

export type RepWorkPayload = {
  v: 1
  instructions: string
  pairs: RepWorkPair[]
}

const DEFAULT_PAIR: RepWorkPair = { question: "<p></p>", answer: "<p></p>" }

export function isRepWorkJson(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== "string") return false
  const t = raw.trim()
  if (!t.startsWith("{")) return false
  try {
    const o = JSON.parse(t) as { v?: unknown; pairs?: unknown }
    return o?.v === 1 && Array.isArray(o.pairs)
  } catch {
    return false
  }
}

export function parseRepWorkFromTextContent(raw: string | null | undefined): {
  instructions: string
  pairs: RepWorkPair[]
} {
  if (!raw?.trim()) {
    return { instructions: "<p></p>", pairs: [{ ...DEFAULT_PAIR }] }
  }
  try {
    const o = JSON.parse(raw) as Partial<RepWorkPayload>
    if (o?.v !== 1 || !Array.isArray(o.pairs)) throw new Error("not v1")
    const pairs = o.pairs
      .filter((p): p is RepWorkPair => p && typeof p.question === "string" && typeof p.answer === "string")
      .map((p) => ({
        question: p.question.trim() ? p.question : "<p></p>",
        answer: p.answer.trim() ? p.answer : "<p></p>",
      }))
    return {
      instructions: typeof o.instructions === "string" && o.instructions.trim() ? o.instructions : "<p></p>",
      pairs: pairs.length > 0 ? pairs : [{ ...DEFAULT_PAIR }],
    }
  } catch {
    return { instructions: raw.trim() ? raw : "<p></p>", pairs: [{ ...DEFAULT_PAIR }] }
  }
}

export function serializeRepWorkContent(instructions: string, pairs: RepWorkPair[]): string {
  const cleanPairs = pairs.map((p) => ({
    question: (p.question || "<p></p>").trim() || "<p></p>",
    answer: (p.answer || "<p></p>").trim() || "<p></p>",
  }))
  const payload: RepWorkPayload = {
    v: 1,
    instructions: (instructions || "<p></p>").trim() || "<p></p>",
    pairs: cleanPairs.length > 0 ? cleanPairs : [{ ...DEFAULT_PAIR }],
  }
  return JSON.stringify(payload)
}
