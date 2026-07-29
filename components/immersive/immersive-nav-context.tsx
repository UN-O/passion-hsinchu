"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

type ImmersiveNavContextValue = {
  index: number
  total: number
  paused: boolean
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  pause: () => void
  resume: () => void
}

const ImmersiveNavContext = createContext<ImmersiveNavContextValue | null>(null)

export function useImmersiveNav() {
  const ctx = useContext(ImmersiveNavContext)
  if (!ctx) {
    throw new Error("useImmersiveNav must be used within an ImmersiveScreen")
  }
  return ctx
}

type ImmersiveNavProviderProps = {
  total: number
  index: number
  onIndexChange: (index: number) => void
  onNext?: () => void
  onPrev?: () => void
  children: React.ReactNode
}

export function ImmersiveNavProvider({
  total,
  index,
  onIndexChange,
  onNext,
  onPrev,
  children,
}: ImmersiveNavProviderProps) {
  const [paused, setPaused] = useState(false)

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(target, 0), Math.max(total - 1, 0))
      onIndexChange(clamped)
    },
    [onIndexChange, total]
  )

  const next = useCallback(() => {
    if (index >= total - 1) return
    goTo(index + 1)
    onNext?.()
  }, [goTo, index, total, onNext])

  const prev = useCallback(() => {
    if (index <= 0) return
    goTo(index - 1)
    onPrev?.()
  }, [goTo, index, onPrev])

  const value = useMemo<ImmersiveNavContextValue>(
    () => ({
      index,
      total,
      paused,
      next,
      prev,
      goTo,
      pause: () => setPaused(true),
      resume: () => setPaused(false),
    }),
    [index, total, paused, next, prev, goTo]
  )

  return <ImmersiveNavContext.Provider value={value}>{children}</ImmersiveNavContext.Provider>
}
