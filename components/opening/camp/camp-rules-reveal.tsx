"use client"

import { Button } from "@/components/ui/button"
import type { CampRuleScreen } from "@/lib/opening-camp-content"

export function CampRulesRevealScreen({
  screen,
  screenIndex,
  onAdvance,
}: {
  screen: CampRuleScreen
  screenIndex: number
  onAdvance: () => void
}) {
  return (
    <div className="relative flex h-full flex-col items-center justify-end px-6 pb-10">
      <div key={screenIndex} className="flex flex-1 flex-col items-center justify-center gap-4 text-center animate-in fade-in-0 slide-in-from-bottom-8 duration-500">
        {screen.kind === "title" ? (
          <>
            <h1 className="text-3xl font-black sm:text-4xl">{screen.title}</h1>
            <p className="text-sm font-semibold tracking-[0.3em] text-primary">{screen.subtitle}</p>
          </>
        ) : (
          <>
            <div className="max-w-sm text-white/85">
              {screen.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="text-2xl font-black tracking-wide text-primary">{screen.label}</p>
          </>
        )}
      </div>

      <Button size="lg" onClick={onAdvance}>
        下一步
      </Button>
    </div>
  )
}
