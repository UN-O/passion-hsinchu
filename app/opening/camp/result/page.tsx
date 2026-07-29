"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useCampFlow } from "@/components/opening/camp-flow-context"
import { CampResultCard } from "@/components/opening/camp-result-card"
import { campQuizQuestions } from "@/lib/opening-camp-content"
import { getCampResultGradient } from "@/lib/opening-gradients"

export default function CampResultPage() {
  const router = useRouter()
  const { aCount, answers } = useCampFlow()
  const incomplete = Object.keys(answers).length < campQuizQuestions.length

  useEffect(() => {
    if (incomplete) router.replace("/opening/camp/quiz")
  }, [incomplete, router])

  if (incomplete) return null

  return (
    <ImmersiveScreen
      background={{ type: "shader", colors: getCampResultGradient(aCount) }}
      enableTapZones={false}
      enableSwipe={false}
      onBack={() => router.push("/opening/camp/quiz")}
    >
      <CampResultCard aCount={aCount} onNext={() => router.push("/opening/camp/onboarding")} />
    </ImmersiveScreen>
  )
}
