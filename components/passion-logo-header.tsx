"use client"

import Image from "next/image"
import Link from "next/link"

import { useScrollBlackout } from "@/components/camp-scroll-blackout"

// 一般深色頁面頂端的 PASSION logo，白色版本（跟 camp-profile-card.tsx 用法一致）。
// leftSlot／rightSlot 可以放側邊欄按鈕、個人資料按鈕之類的東西，會貼齊 logo 那一行的
// 左／右側、垂直置中對齊 logo。
export function PassionLogoHeader({
  leftSlot,
  rightSlot,
  logoTone = "light",
  sticky = false,
}: {
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  // 深色頁面 logo 要是白的（brightness-0 invert）；camp 系列的淺黃底頁面
  // 要是黑的（brightness-0，不 invert）。sticky 狀態下背景變黑時會自動
  // 覆寫成白（見下面 isBlack），不用呼叫端另外處理。
  logoTone?: "light" | "dark"
  // 永遠釘在畫面頂端＋透明漸層底，跟 conference-mission-home.tsx 的 sticky
  // LOGO 列同一個做法，只有首頁需要（其餘頁面維持原本隨頁面捲動）。
  // z-20：確保捲動時後面的卡片內容不會蓋過來；safe-area-inset-top：App 化後
  // 全螢幕沒有網址列，iPhone 瀏海／動態島不然會直接疊在這一列上面。
  sticky?: boolean
} = {}) {
  // 沒包在 ScrollBlackout 底下（sticky=false 的其他頁面）時固定回傳 false，
  // 不影響原本樣子。
  const isBlack = useScrollBlackout()
  const inverted = sticky && isBlack

  return (
    <div
      // data-scroll-blackout-header：camp-scroll-blackout.tsx 用這個屬性量
      // sticky 列實際佔的高度，判斷底下卡片有沒有被蓋到，只在 sticky 時標。
      data-scroll-blackout-header={sticky ? "" : undefined}
      className={
        sticky
          ? `sticky top-0 z-20 bg-gradient-to-b to-transparent pb-4 transition-colors duration-700 ${
              inverted ? "from-black" : "from-[#feed74]"
            }`
          : "pt-6"
      }
      style={sticky ? { paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" } : undefined}
    >
      <div className="relative flex justify-center">
        <Link href="https://www.passion-hsinchu.com/" target="_blank" rel="noopener noreferrer">
          <Image
            src="/images/passion-logo.webp"
            alt="PASSION®"
            width={979}
            height={178}
            className={`h-6 w-auto brightness-0 transition-[filter] duration-700 ${
              logoTone === "light" || inverted ? "invert" : ""
            }`}
          />
        </Link>
        {leftSlot && <div className="absolute top-1/2 left-0 -translate-y-1/2">{leftSlot}</div>}
        {rightSlot && <div className="absolute top-1/2 right-0 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  )
}
