"use client"

import ProfileCard from "@/components/ProfileCard.jsx"
import type { CampProfileResult } from "@/lib/opening-camp-content"
import { HERO_CARD_IMAGE, heroAvatarDataUri, heroGrainUri, heroIconPatternUri } from "@/lib/hero-card-visuals"
import "./camp-profile-card.css"

// 五張勇者卡是設計好的完整成品（標題、勇者名稱文字都已經畫在圖裡），
// 所以 name／title 這兩個文字欄位傳空字串（圖片裡已經有了，不用 ProfileCard.jsx
// 再疊一次姓名／引言文字）。全息特效（傾斜、光暈、顆粒、閃光紋理）保留。
// vendor 內建的 @勇者ID 提示列（showUserInfo）固定關掉，改在卡片下方另外
// 放一行文字——不疊在卡面上。
type CampProfileCardProps = {
  heroName: string
  result: CampProfileResult
  showUserInfo?: boolean
}

export function CampProfileCard({ heroName, result, showUserInfo = true }: CampProfileCardProps) {
  const src = HERO_CARD_IMAGE[result.aCount] ?? HERO_CARD_IMAGE[2]

  return (
    <div className="camp-profile-card-stage">
      <div className="camp-profile-card-draw flex flex-col items-center gap-3">
        <div className="relative w-full">
          <ProfileCard
            className="camp-profile-card"
            name=""
            title=""
            handle={heroName}
            status="已取得勇者屬性"
            avatarUrl={src}
            miniAvatarUrl={heroAvatarDataUri(heroName)}
            iconUrl={heroIconPatternUri(result.aCount)}
            grainUrl={heroGrainUri()}
            showUserInfo={false}
            innerGradient="linear-gradient(160deg, rgba(255, 233, 168, 0.44) 0%, rgba(39, 32, 22, 0.92) 100%)"
            behindGlowEnabled
            behindGlowColor="rgba(238, 233, 175, 1)"
            behindGlowSize="80%"
            enableTilt
            enableMobileTilt
            mobileTiltSensitivity={5}
          />
        </div>
        {showUserInfo && (
          <p className="text-sm font-bold text-white">
            @{heroName}
            <span className="ml-2 font-normal text-white/60">已取得勇者屬性</span>
          </p>
        )}
      </div>
    </div>
  )
}
