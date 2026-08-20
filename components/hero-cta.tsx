"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { heroSwitchDate } from "@/lib/site-config"

function subscribeNever() {
  return () => {}
}

// 直接在 render 算會被靜態產生的頁面凍結在建置當下的時間，所以要等
// client 端 mount 後才用真正的當下時間判斷；SSR 一律回傳 false 避免 hydration 對不上。
function getShowSplitCta() {
  return new Date() >= new Date(heroSwitchDate)
}

function getShowSplitCtaServer() {
  return false
}

export function HeroCta() {
  const showSplitCta = useSyncExternalStore(subscribeNever, getShowSplitCta, getShowSplitCtaServer)

  if (showSplitCta) {
    // 未登入時兩顆都顯示（不知道對方報了哪一場）。/camp 與 /conference 會擋下
    // 未登入的人並導去 /signin；登入後首頁改由 HeroSessionCta 依報名狀況顯示。
    return (
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button asChild size="xl" className="w-full sm:w-auto">
          <Link href="/camp">進入 CAMP</Link>
        </Button>
        <Button asChild size="xl" variant="secondary" className="w-full sm:w-auto">
          <Link href="/conference">進入 CONFERENCE</Link>
        </Button>
      </div>
    )
  }

  // 報名已經結束，未登入的人要做的是登入而不是報名
  return (
    <Button asChild size="xl" className="w-full sm:w-auto">
      <Link href="/signin">登入系統</Link>
    </Button>
  )
}
