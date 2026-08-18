"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { mantouSans } from "@/app/fonts/mantou-sans"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"
import { campRulesTitle, type CampRuleScreen } from "@/lib/opening-camp-content"

// 所有標題／標籤字：白色字，細黑線外框
const HEADING_STROKE_STYLE = {
  color: "#ffffff",
  WebkitTextStroke: "1.5px #000000",
} as const

const BODY_TEXT_COLOR = "#3a352c"

// 跟勇者測驗結果頁（camp-profile-card.tsx）同樣的 logo 用法，
// 只是背景改成亮黃色，所以用 brightness-0（純黑）取代原本的 invert（純白）。
function PassionLogo() {
  return (
    <Image
      src="/images/passion-logo.png"
      alt="PASSION®"
      width={979}
      height={178}
      className="absolute top-6 left-1/2 z-10 h-6 w-auto -translate-x-1/2 brightness-0"
    />
  )
}

export function CampRulesTitleScreen({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="relative flex h-full flex-col items-center gap-8 px-6 pt-[30vh] text-center">
      <PassionLogo />
      <h1 className={`${mantouSans.className} text-xl sm:text-9xl`} style={HEADING_STROKE_STYLE}>
        {campRulesTitle}
      </h1>
      <Button size="lg" variant="outline" onClick={onAdvance}>
        下一步
      </Button>
    </div>
  )
}

export function CampRuleContentScreen({
  screen,
  children,
}: {
  screen: CampRuleScreen
  children: React.ReactNode
}) {
  return (
    <div className="relative flex h-full flex-col items-center gap-6 px-6 pt-[24vh] text-center">
      <PassionLogo />
      <h2 className={`${mantouSans.className} text-3xl sm:text-5xl`} style={HEADING_STROKE_STYLE}>
        {screen.label}
      </h2>
      <div
        className={`${genRyuMin.className} w-[74%] self-center text-left ml-[500px]`}
        style={{ color: BODY_TEXT_COLOR, transform: "skewX(-5deg)" }}
      >
        {screen.lines.map((line) => (
          <p key={line} className="text-lg sm:text-3xl">
            {line}
          </p>
        ))}
      </div>
      {children}
    </div>
  )
}
