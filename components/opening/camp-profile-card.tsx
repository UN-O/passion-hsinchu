"use client"

import Image from "next/image"
import ProfileCard from "@/components/profile-card/profile-card.jsx"
import type { CampProfileResult } from "@/lib/opening-camp-content"
import "./camp-profile-card.css"

type CampProfileCardProps = {
  heroName: string
  result: CampProfileResult
}

function heroAvatarDataUri(heroName: string) {
  const char = heroName.trim().charAt(0) || "勇"
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#f6ed8e"/><text x="48" y="49" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="44" font-weight="700" fill="#141008">${char}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function CampProfileCard({ heroName, result }: CampProfileCardProps) {
  return (
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
        status="已取得勇者職業"
        miniAvatarUrl={heroAvatarDataUri(heroName)}
        innerGradient="linear-gradient(160deg, rgba(20,17,9,0.92) 0%, rgba(10,9,6,0.96) 100%)"
        behindGlowColor="rgba(246, 237, 142, 0.25)"
        behindGlowSize="35%"
      />
    </div>
  )
}
