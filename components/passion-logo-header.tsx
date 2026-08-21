import Image from "next/image"
import Link from "next/link"

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
  // 要是黑的（brightness-0，不 invert）。
  logoTone?: "light" | "dark"
  // 永遠釘在畫面頂端＋透明漸層底，跟 conference-mission-home.tsx 的 sticky
  // LOGO 列同一個做法，只有首頁需要（其餘頁面維持原本隨頁面捲動）。
  // z-20：確保捲動時後面的卡片內容不會蓋過來；safe-area-inset-top：App 化後
  // 全螢幕沒有網址列，iPhone 瀏海／動態島不然會直接疊在這一列上面。
  sticky?: boolean
} = {}) {
  return (
    <div
      // data-scroll-blackout-header：camp-scroll-blackout.tsx 用這個屬性量
      // sticky 列實際佔的高度，判斷底下卡片有沒有被蓋到，只在 sticky 時標。
      data-scroll-blackout-header={sticky ? "" : undefined}
      className={sticky ? "sticky top-0 z-20 bg-gradient-to-b from-[#feed74] to-transparent pb-4" : "pt-6"}
      style={sticky ? { paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" } : undefined}
    >
      <div className="relative flex justify-center">
        <Link href="https://www.passion-hsinchu.com/" target="_blank" rel="noopener noreferrer">
          <Image
            src="/images/passion-logo.webp"
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
