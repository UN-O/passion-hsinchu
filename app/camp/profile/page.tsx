import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampHeroCardPanel } from "@/components/camp-hero-card-panel"
import { heroAvatarDataUri } from "@/lib/hero-card-visuals"
import { getCampProfileResult } from "@/lib/opening-camp-content"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "個人資料",
  robots: { index: false, follow: false },
}

// 開場測驗完成後結果會存進 flow_progress.payload，這裡直接讀 session.campQuizResult。
// 舊帳號（測驗結果還沒開始持久化前就完成開場的人）或工作人員預覽帳號會拿不到，用這個文字頂著。
const HERO_TRAIT_FALLBACK = "尚未設定"

export default async function CampProfilePage() {
  const session = await requireFlowAccess("camp")
  // 「勇者姓名」跟頭像都沿用開場測驗打的勇者 ID，不是報名時的本名。
  const heroName = session.campQuizResult?.heroName || session.user.name

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader />

      <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
        <Link href="/camp">
          <ArrowLeft />
        </Link>
      </Button>

      <div className="mt-10 flex flex-col items-center gap-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URI 頭像，next/image 優化不到 */}
        <img
          src={heroAvatarDataUri(heroName)}
          alt="勇者頭像"
          className="size-40 rounded-full border border-border object-cover"
        />

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">勇者姓名</p>
          <p className="text-2xl font-bold">{heroName}</p>
        </div>

        {session.campQuizResult ? (
          <CampHeroCardPanel
            heroName={session.campQuizResult.heroName}
            result={getCampProfileResult(session.campQuizResult.aCount)}
          />
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">勇者屬性</p>
            <p className="text-2xl font-bold">{HERO_TRAIT_FALLBACK}</p>
          </div>
        )}
      </div>
    </main>
  )
}
