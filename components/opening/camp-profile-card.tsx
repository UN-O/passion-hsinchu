"use client"

import Image from "next/image"
import ProfileCard from "@/components/ProfileCard.jsx"
import type { CampProfileResult } from "@/lib/opening-camp-content"
import { HERO_AVATAR_PLACEHOLDER_URI, heroAvatarDataUri, heroGrainUri, heroIconPatternUri } from "@/lib/hero-card-visuals"
import "./camp-profile-card.css"

type CampProfileCardProps = {
  heroName: string
  result: CampProfileResult
  showUserInfo?: boolean
}

export function CampProfileCard({ heroName, result, showUserInfo = true }: CampProfileCardProps) {
  return (
    <div className="camp-profile-card-stage">
      <div className="camp-profile-card-draw">
        <div className="relative w-full">
          <Image
            src="/images/passion-logo.png"
            alt="PASSION®"
            width={979}
            height={178}
            className="absolute top-6 left-1/2 z-10 h-6 w-auto -translate-x-1/2 brightness-0 invert"
          />
          <ProfileCard
            className="camp-profile-card"
            name={result.name}
            title={`「${result.quote}」`}
            handle={heroName}
            status="已取得勇者屬性"
            avatarUrl={HERO_AVATAR_PLACEHOLDER_URI}
            miniAvatarUrl={heroAvatarDataUri(heroName)}
            iconUrl={heroIconPatternUri(result.aCount)}
            grainUrl={heroGrainUri()}
            showUserInfo={showUserInfo}
            innerGradient="linear-gradient(160deg, rgba(255, 233, 168, 0.44) 0%, rgba(39, 32, 22, 0.92) 100%)"
            behindGlowEnabled
            behindGlowColor="rgba(238, 233, 175, 1)"
            behindGlowSize="80%"
            enableTilt
            enableMobileTilt
            mobileTiltSensitivity={5}
          />
        </div>
      </div>
    </div>
  )
}
