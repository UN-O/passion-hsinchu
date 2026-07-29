"use client"

import { useState } from "react"
import ProfileCard from "@/components/profile-card/profile-card.jsx"
import { Button } from "@/components/ui/button"
import { getCampProfileResult } from "@/lib/opening-camp-content"

type CampResultCardProps = {
  aCount: number
  onNext: () => void
}

export function CampResultCard({ aCount, onNext }: CampResultCardProps) {
  const [revealed, setRevealed] = useState(false)
  const result = getCampProfileResult(aCount)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-8 text-center">
      <ProfileCard
        name={result.name}
        title={`「${result.quote}」`}
        handle="hero"
        status="已解鎖"
        contactText="了解更多"
        onContactClick={() => setRevealed(true)}
      />

      {revealed && (
        <div className="flex w-full max-w-sm flex-col gap-4 text-left text-white/90">
          <p>{result.description}</p>
          <div>
            <p className="text-sm font-medium text-white/60">勇者特質</p>
            <p className="mt-1">{result.traits.join("、")}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">小提醒</p>
            <p className="mt-1">{result.reminder}</p>
          </div>
          <Button size="lg" onClick={onNext} className="mt-2">
            下一步
          </Button>
        </div>
      )}
    </div>
  )
}
