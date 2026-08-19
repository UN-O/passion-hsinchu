"use client"

import Image from "next/image"
import type { CampProfileResult } from "@/lib/opening-camp-content"
import "./camp-profile-card.css"

// 五張勇者卡是設計好的完整成品（標題、勇者名稱文字都已經畫在圖裡），
// 不再用 ProfileCard.jsx 那套全息卡片元件疊程式產生的姓名／引言／紋理——
// 疊上去文字會跟圖片裡本來就有的「OO勇者」重複。卡面本身乾淨、不疊任何東西，
// 玩家自己的勇者 ID 改放卡片下方，不是疊在卡面上。
const HERO_CARD_IMAGE: Record<number, string> = {
  0: "/images/hero-card-0-guardian.webp",
  1: "/images/hero-card-1-strategy.webp",
  2: "/images/hero-card-2-wisdom.webp",
  3: "/images/hero-card-3-faith.webp",
  4: "/images/hero-card-4-charge.webp",
}

type CampProfileCardProps = {
  heroName: string
  result: CampProfileResult
  showUserInfo?: boolean
}

export function CampProfileCard({ heroName, result, showUserInfo = true }: CampProfileCardProps) {
  const src = HERO_CARD_IMAGE[result.aCount] ?? HERO_CARD_IMAGE[2]

  return (
    <div className="camp-profile-card-stage">
      <div className="camp-profile-card-draw">
        <div className="mx-auto flex w-full max-w-[320px] flex-col items-center gap-3">
          <Image src={src} alt={result.name} width={800} height={1200} priority className="h-auto w-full rounded-3xl" />
          {showUserInfo && (
            <p className="text-sm font-bold text-white">
              @{heroName}
              <span className="ml-2 font-normal text-white/60">已取得勇者屬性</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
