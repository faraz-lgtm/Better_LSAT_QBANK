import { useCallback, useEffect, useRef } from "react"

type UseQuestionDwellTimeOptions = {
  questionId: string | null
  active: boolean
  paused: boolean
}

export function useQuestionDwellTime({ questionId, active, paused }: UseQuestionDwellTimeOptions) {
  const totalsRef = useRef<Record<string, number>>({})
  const startedAtRef = useRef(Date.now())
  const lastQuestionIdRef = useRef<string | null>(questionId)
  const activeRef = useRef(active)
  const pausedRef = useRef(paused)

  const accrue = useCallback((id: string | null) => {
    if (!id || !activeRef.current || pausedRef.current) return
    const elapsedSec = Math.max(0, (Date.now() - startedAtRef.current) / 1000)
    totalsRef.current[id] = (totalsRef.current[id] ?? 0) + elapsedSec
    startedAtRef.current = Date.now()
  }, [])

  const getCumulativeSeconds = useCallback(
    (id: string) => {
      if (lastQuestionIdRef.current === id) accrue(id)
      return Math.round(totalsRef.current[id] ?? 0)
    },
    [accrue],
  )

  useEffect(() => {
    const nextId = questionId
    if (lastQuestionIdRef.current && lastQuestionIdRef.current !== nextId) {
      accrue(lastQuestionIdRef.current)
    }
    lastQuestionIdRef.current = nextId
    startedAtRef.current = Date.now()
  }, [accrue, questionId])

  useEffect(() => {
    if (paused && !pausedRef.current) {
      accrue(lastQuestionIdRef.current)
    }
    pausedRef.current = paused
    if (!paused) startedAtRef.current = Date.now()
  }, [accrue, paused])

  useEffect(() => {
    if (!active && activeRef.current) {
      accrue(lastQuestionIdRef.current)
    }
    activeRef.current = active
    if (active) startedAtRef.current = Date.now()
  }, [accrue, active])

  return { getCumulativeSeconds }
}
