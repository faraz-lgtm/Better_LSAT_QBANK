import { useCallback, useMemo, useState } from "react"

function useResponseMasking() {
  const [responseMasking, setResponseMasking] = useState(false)
  const [maskedChoices, setMaskedChoices] = useState<Record<number, boolean>>({})

  const toggleResponseMasking = useCallback(() => {
    setResponseMasking((enabled) => !enabled)
  }, [])

  const toggleChoiceMask = useCallback((index: number) => {
    setMaskedChoices((current) => ({
      ...current,
      [index]: !current[index],
    }))
  }, [])

  const resetMaskedChoices = useCallback(() => {
    setMaskedChoices({})
  }, [])

  const hasMaskedChoices = useMemo(
    () => Object.values(maskedChoices).some(Boolean),
    [maskedChoices],
  )

  return {
    responseMasking,
    maskedChoices,
    hasMaskedChoices,
    toggleResponseMasking,
    toggleChoiceMask,
    resetMaskedChoices,
  }
}

export { useResponseMasking }
