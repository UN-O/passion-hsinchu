"use client"

import { Button } from "@/components/ui/button"

export function CampRulesRevealScreen({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-end px-6 pb-10">
      <Button size="lg" variant="outline" onClick={onAdvance}>
        下一步
      </Button>
    </div>
  )
}
