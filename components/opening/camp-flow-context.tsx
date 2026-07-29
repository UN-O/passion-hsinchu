"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

type Answers = Record<string, "A" | "B">

type CampFlowContextValue = {
  heroName: string
  setHeroName: (name: string) => void
  answers: Answers
  setAnswer: (questionId: string, value: "A" | "B") => void
  aCount: number
}

const CampFlowContext = createContext<CampFlowContextValue | null>(null)

export function useCampFlow() {
  const ctx = useContext(CampFlowContext)
  if (!ctx) {
    throw new Error("useCampFlow must be used within CampFlowProvider")
  }
  return ctx
}

export function CampFlowProvider({ children }: { children: React.ReactNode }) {
  const [heroName, setHeroName] = useState("")
  const [answers, setAnswers] = useState<Answers>({})

  const setAnswer = useCallback((questionId: string, value: "A" | "B") => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const aCount = useMemo(
    () => Object.values(answers).filter((value) => value === "A").length,
    [answers]
  )

  const value = useMemo(
    () => ({ heroName, setHeroName, answers, setAnswer, aCount }),
    [heroName, answers, setAnswer, aCount]
  )

  return <CampFlowContext.Provider value={value}>{children}</CampFlowContext.Provider>
}
