"use client"

import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { useOpeningNavigate } from "@/components/opening/opening-transition"

export function useOpeningStepAdvance(nextRoute: string | null) {
  const navigate = useOpeningNavigate()
  const { index, total, next } = useImmersiveNav()

  return () => {
    if (index < total - 1) {
      next()
      return
    }
    if (nextRoute) {
      navigate(nextRoute)
    }
  }
}
