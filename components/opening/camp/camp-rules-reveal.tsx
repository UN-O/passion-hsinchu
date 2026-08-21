"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { mantouSans } from "@/app/fonts/mantou-sans"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"
import { campRulesTitle, type CampRuleScreen } from "@/lib/opening-camp-content"

// 所有標題／標籤字：白色字，細黑線外框。外框粗細用 em（跟著自己的字級走），
// 不用固定 px——不然字級用 clamp() 響應式縮放時，小字級外框會顯得過粗、
// 大字級又顯得過細，兩邊都對不齊視覺比例。
const HEADING_STROKE_STYLE = {
  color: "#ffffff",
  WebkitTextStroke: "0.035em #000000",
} as const

const BODY_TEXT_COLOR = "#3a352c"

// 跟勇者測驗結果頁（camp-profile-card.tsx）同樣的 logo 用法，
// 只是背景改成亮黃色，所以用 brightness-0（純黑）取代原本的 invert（純白）。
function PassionLogo() {
  return (
    <Image
      src="/images/passion-logo.webp"
      alt="PASSION®"
      width={979}
      height={178}
      className="absolute top-6 left-1/2 z-10 h-6 w-auto -translate-x-1/2 brightness-0"
    />
  )
}

// 「THE COURAGE GENERATIONS! 勇者世代」標語圖，設計稿裡本來就是深灰色，
// 黃色背景上不用另外調色。
function CourageGenerationsTagline({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/images/courage-generations-tagline.webp"
      alt="THE COURAGE GENERATIONS! 勇者世代"
      width={1200}
      height={187}
      className={`h-auto ${className}`}
    />
  )
}

// 「WORSHIP —— RELATION —— EXPERIENCE」底線，從原始設計稿（PASSION資產 1）
// 裁出來的那一小條，只用在標題頁、標題下方。
function WorshipRelationExperienceDivider({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/images/worship-relation-experience.webp"
      alt="WORSHIP RELATION EXPERIENCE"
      width={1000}
      height={19}
      className={`h-auto ${className}`}
    />
  )
}

export function CampRulesTitleScreen({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="relative flex h-full flex-col items-center gap-8 px-6 pt-[30vh] text-center">
      <PassionLogo />
      <CourageGenerationsTagline className="w-56 sm:w-64" />
      <h1
        className={`${mantouSans.className} w-full text-[clamp(2rem,9vw,4.5rem)]`}
        style={HEADING_STROKE_STYLE}
      >
        {campRulesTitle}
      </h1>
      <WorshipRelationExperienceDivider className="w-64 sm:w-72" />
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
      <h2
        className={`${mantouSans.className} w-full text-[clamp(2rem,8vw,3.5rem)]`}
        style={HEADING_STROKE_STYLE}
      >
        {screen.label}
      </h2>
      <div
        className={`${genRyuMin.className} w-[min(74%,28rem)] self-center text-center`}
        style={{ color: BODY_TEXT_COLOR }}
      >
        {screen.lines.map((line) => (
          <p key={line} className="text-[clamp(1rem,4.5vw,1.5rem)]">
            {line}
          </p>
        ))}
      </div>
      {children}
      <CourageGenerationsTagline className="mt-auto w-40 pt-6 sm:w-48" />
    </div>
  )
}
