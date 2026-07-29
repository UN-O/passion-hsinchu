"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FadeTransitionOverlay } from "./fade-transition-overlay"

const TRANSITION_MS = 500
const REVEAL_DELAY_MS = 60

type OpeningTransitionContextValue = {
  navigate: (path: string) => void
}

const OpeningTransitionContext = createContext<OpeningTransitionContextValue | null>(null)

export function useOpeningNavigate() {
  const ctx = useContext(OpeningTransitionContext)
  if (!ctx) {
    throw new Error("useOpeningNavigate must be used within an OpeningTransitionProvider")
  }
  return ctx.navigate
}

export function OpeningTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [revealed, setRevealed] = useState(false)
  const [exiting, setExiting] = useState(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [])

  const navigate = useCallback(
    (path: string) => {
      setExiting(true)
      exitTimerRef.current = setTimeout(() => router.push(path), TRANSITION_MS)
    },
    [router]
  )

  return (
    <OpeningTransitionContext.Provider value={{ navigate }}>
      {children}
      <FadeTransitionOverlay active={exiting || !revealed} />
    </OpeningTransitionContext.Provider>
  )
}
