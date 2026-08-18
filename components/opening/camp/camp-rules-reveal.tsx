"use client"

import { Button } from "@/components/ui/button"
import { mantouSans } from "@/app/fonts/mantou-sans"
import { campRulesTitle } from "@/lib/opening-camp-content"

export function CampRulesTitleScreen({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <h1 className={`${mantouSans.className} text-4xl sm:text-5xl`}>{campRulesTitle}</h1>
      <Button size="lg" onClick={onAdvance}>
        下一步
      </Button>
    </div>
  )
}

export function CampRulesRevealScreen({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-end px-6 pb-10">
      <Button size="lg" variant="outline" onClick={onAdvance}>
        下一步
      </Button>
    </div>
  )
}
