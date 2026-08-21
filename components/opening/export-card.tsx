"use client"

import { forwardRef } from "react"
import Image from "next/image"
import { versePrayerCategoryBackgroundCss } from "@/lib/opening-gradients"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

type ExportCardProps = {
  label: string
  verse: string
  verseRef?: string
  categoryKey?: "A" | "B" | "C" | "D"
}

// 畫面上不顯示這個框限的樣子，只有匯出圖片時才用這個固定 4:5 直式節點擷取。
// 寬度固定 540px：downloadNodeAsImage 用 pixelRatio 2 擷取，540×2=1080、
// 540×1.25×2=1350，剛好是規定的 1080×1350 輸出尺寸。
export const ExportCard = forwardRef<HTMLDivElement, ExportCardProps>(function ExportCard(
  { label, verse, verseRef, categoryKey },
  ref
) {
  // 背景改用 CSS radial-gradient（見 versePrayerCategoryBackgroundCss），
  // 不再用 <canvas> 畫。原本用 canvas 是因為這張卡片平常 opacity-0 長期
  // 藏在背景，手機瀏覽器（尤其真機 iOS Safari）會不定期把畫面外/不可見
  // canvas 的內容釋放掉，toDataURL() 讀到空的，html-to-image 擷取到的
  // 背景就整片消失——使用者反覆回報「存出來的圖沒有背景」正是這個成因，
  // 就算在擷取前強制重繪過一次也還是會發生。CSS background 是宣告式的，
  // 沒有「畫的時機」這回事，不存在讀到空畫布的問題，直接從根本避開整類問題。
  const backgroundCss = versePrayerCategoryBackgroundCss(categoryKey)

  return (
    <div ref={ref} className="relative aspect-[4/5] w-[540px] overflow-hidden" style={{ background: backgroundCss }}>
      {/* 上面 PASSION LOGO、下面主視覺橫式，中間經文／禱告文置中——三塊直接
          排在同一個 flex-col 裡，用 gap 留空隙，不用另外疊 margin。中間這塊
          包一層 flex-1 + justify-center，讓經文區塊在 LOGO 跟主視覺之間的
          剩餘空間裡置中，LOGO／主視覺維持自己原本的高度不被擠壓。
          兩張圖都要 priority：這個節點平常是 opacity-0 藏在畫面外，
          Next.js Image 預設的 lazy loading 會判斷它「不在可視範圍」而
          永遠不載入，點「儲存圖片」時擷取到的就會是空白——跟先前修過的
          canvas 空白畫布問題同一種「藏起來的節點沒有真的準備好內容」。 */}
      <div className="relative flex h-full flex-col items-center gap-6 p-12 text-center text-white">
        <Image
          src="/images/conference-hero-logo.webp"
          alt="PASSION"
          width={3356}
          height={630}
          priority
          className="h-auto w-[55%]"
        />

        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-sm tracking-[0.2em] text-white/70">{label}</p>
          {/* w-[min(74%,28rem)]＋源流明體：跟畫面上 conference-verse-prayer-step.tsx
              的經文／禱告文同一套處理，存出來的圖片字體才會跟畫面上看到的一致。
              overflow-wrap + text-wrap:pretty（不是 break-all）：break-all
              會在完全不相關的兩個字中間硬斷，text-wrap:pretty 會優先斷在逗號、
              句號後面，同一個修法、同一個理由見 conference-verse-prayer-step.tsx
              那邊的完整說明。 */}
          <p
            className={`${genRyuMin.className} w-[min(74%,28rem)] text-2xl leading-relaxed`}
            style={{ overflowWrap: "break-word", textWrap: "pretty" }}
          >
            {verse}
          </p>
          {verseRef && <p className="text-base text-white/70">（{verseRef}）</p>}
        </div>

        <Image
          src="/images/conference-export-visual.png"
          alt="THE COURAGE GENERATIONS 勇者世代"
          width={10837}
          height={1638}
          priority
          className="h-auto w-full opacity-20"
        />
      </div>
    </div>
  )
})
