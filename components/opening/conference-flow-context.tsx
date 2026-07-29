"use client"

import { createContext, useContext, useMemo, useState } from "react"

type ConferenceFlowContextValue = {
  selectedItemId: string | null
  setSelectedItemId: (id: string | null) => void
}

const ConferenceFlowContext = createContext<ConferenceFlowContextValue | null>(null)

export function useConferenceFlow() {
  const ctx = useContext(ConferenceFlowContext)
  if (!ctx) {
    throw new Error("useConferenceFlow must be used within ConferenceFlowProvider")
  }
  return ctx
}

export function ConferenceFlowProvider({ children }: { children: React.ReactNode }) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const value = useMemo(() => ({ selectedItemId, setSelectedItemId }), [selectedItemId])

  return (
    <ConferenceFlowContext.Provider value={value}>{children}</ConferenceFlowContext.Provider>
  )
}
