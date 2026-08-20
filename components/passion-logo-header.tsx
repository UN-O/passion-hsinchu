import Image from "next/image"
import Link from "next/link"

// 一般深色頁面頂端的 PASSION logo，白色版本（跟 camp-profile-card.tsx 用法一致）。
// leftSlot／rightSlot 可以放側邊欄按鈕、個人資料按鈕之類的東西，會貼齊 logo 那一行的
// 左／右側、垂直置中對齊 logo。
export function PassionLogoHeader({
  leftSlot,
  rightSlot,
  logoTone = "light",
}: {
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  // 深色頁面 logo 要是白的（brightness-0 invert）；camp 系列的淺黃底頁面
  // 要是黑的（brightness-0，不 invert）。
  logoTone?: "light" | "dark"
} = {}) {
  return (
    <div className="pt-6">
      <div className="relative flex justify-center">
        <Link href="https://www.passion-hsinchu.com/" target="_blank" rel="noopener noreferrer">
          <Image
            src="/images/passion-logo.png"
            alt="PASSION®"
            width={979}
            height={178}
            className={`h-6 w-auto brightness-0 ${logoTone === "light" ? "invert" : ""}`}
          />
        </Link>
        {leftSlot && <div className="absolute top-1/2 left-0 -translate-y-1/2">{leftSlot}</div>}
        {rightSlot && <div className="absolute top-1/2 right-0 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  )
}
