"use client"

import { useRouter } from "next/navigation"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"

export function useOpeningStepAdvance(nextRoute: string | null) {
  const router = useRouter()
  const { index, total, next } = useImmersiveNav()

  return () => {
    if (index < total - 1) {
      next()
      return
    }
    if (nextRoute) {
      router.push(nextRoute)
    }
  }
}
