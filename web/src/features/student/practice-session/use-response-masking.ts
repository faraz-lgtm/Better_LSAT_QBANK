import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type MasksByQuestion = Record<string, Record<number, boolean>>

type ResponseMaskingContextValue = {
  responseMasking: boolean
  masksByQuestion: MasksByQuestion
  toggleResponseMasking: () => void
  toggleChoiceMask: (questionId: string, index: number) => void
  unmaskChoice: (questionId: string, index: number) => void
  resetMaskedChoices: (questionId: string) => void
}

const ResponseMaskingContext = createContext<ResponseMaskingContextValue | null>(null)

function createMaskingActions(
  setResponseMasking: (updater: (enabled: boolean) => boolean) => void,
  setMasksByQuestion: (updater: (current: MasksByQuestion) => MasksByQuestion) => void,
): Omit<ResponseMaskingContextValue, "responseMasking" | "masksByQuestion"> {
  return {
    toggleResponseMasking: () => {
      setResponseMasking((enabled) => !enabled)
    },
    toggleChoiceMask: (questionId: string, index: number) => {
      setMasksByQuestion((current) => {
        const forQuestion = current[questionId] ?? {}
        return {
          ...current,
          [questionId]: { ...forQuestion, [index]: !forQuestion[index] },
        }
      })
    },
    unmaskChoice: (questionId: string, index: number) => {
      setMasksByQuestion((current) => {
        const forQuestion = current[questionId] ?? {}
        if (!forQuestion[index]) return current
        return {
          ...current,
          [questionId]: { ...forQuestion, [index]: false },
        }
      })
    },
    resetMaskedChoices: (questionId: string) => {
      setMasksByQuestion((current) => {
        if (!current[questionId]) return current
        const next = { ...current }
        delete next[questionId]
        return next
      })
    },
  }
}

function ResponseMaskingProvider({ children }: { children: ReactNode }) {
  const [responseMasking, setResponseMasking] = useState(false)
  const [masksByQuestion, setMasksByQuestion] = useState<MasksByQuestion>({})

  const actions = useMemo(
    () => createMaskingActions(setResponseMasking, setMasksByQuestion),
    [],
  )

  const value = useMemo(
    () => ({
      responseMasking,
      masksByQuestion,
      ...actions,
    }),
    [responseMasking, masksByQuestion, actions],
  )

  return createElement(ResponseMaskingContext.Provider, { value }, children)
}

function useResponseMaskingStore(): ResponseMaskingContextValue {
  const ctx = useContext(ResponseMaskingContext)
  const [responseMasking, setResponseMasking] = useState(false)
  const [masksByQuestion, setMasksByQuestion] = useState<MasksByQuestion>({})
  const actions = useMemo(
    () => createMaskingActions(setResponseMasking, setMasksByQuestion),
    [],
  )
  const local = useMemo(
    () => ({
      responseMasking,
      masksByQuestion,
      ...actions,
    }),
    [responseMasking, masksByQuestion, actions],
  )
  return ctx ?? local
}

function useResponseMasking(questionId: string) {
  const store = useResponseMaskingStore()
  const maskedChoices = store.masksByQuestion[questionId] ?? {}
  const hasMaskedChoices = Object.values(maskedChoices).some(Boolean)

  const toggleChoiceMask = useCallback(
    (index: number) => store.toggleChoiceMask(questionId, index),
    [store, questionId],
  )
  const unmaskChoice = useCallback(
    (index: number) => store.unmaskChoice(questionId, index),
    [store, questionId],
  )
  const resetMaskedChoices = useCallback(
    () => store.resetMaskedChoices(questionId),
    [store, questionId],
  )

  return {
    responseMasking: store.responseMasking,
    maskedChoices,
    hasMaskedChoices,
    toggleResponseMasking: store.toggleResponseMasking,
    toggleChoiceMask,
    unmaskChoice,
    resetMaskedChoices,
  }
}

export { ResponseMaskingProvider, useResponseMasking }
