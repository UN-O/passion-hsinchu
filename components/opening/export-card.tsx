"use client"

import { forwardRef, useEffect, useState } from "react"
import { versePrayerCategoryBackgroundCss } from "@/lib/opening-gradients"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

const LOGO_SRC = "/images/conference-hero-logo.webp"
const VISUAL_SRC = "/images/conference-export-visual.png"

// html-to-image 擷取 DOM 時，圖片要嵌進輸出結果得先讀成 base64——如果
// <img src> 當下還是一般檔案路徑，html-to-image 得自己另外發一次請求去抓、
// 轉成 base64，這個內部請求在真機瀏覽器上不保證會成功或來得及完成。
// 使用者反覆回報「儲存圖片」的 LOGO 跟底部主視覺整個不見（背景、文字都在，
// 只有這兩張圖消失）正是這個成因——跟前面修過的背景 canvas 是同一類
// 「擷取當下才臨時去讀某個資源，讀不到就整個消失」的問題。改成元件一掛載
// 就自己先把圖抓下來轉成 data: URI 存進 state，img 的 src 從一開始就是
// 自己完成好的 data URI，html-to-image 複製 DOM 時直接照抄這個屬性，
// 不需要再另外發任何請求，也就不存在抓不到的問題。
function useImageDataUri(src: string) {
  const [dataUri, setDataUri] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(src)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
          })
      )
      .then((uri) => {
        if (!cancelled) setDataUri(uri)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [src])

  return dataUri
}

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
  const logoUri = useImageDataUri(LOGO_SRC)
  const visualUri = useImageDataUri(VISUAL_SRC)

  return (
    <div ref={ref} className="relative aspect-[4/5] w-[540px] overflow-hidden" style={{ background: backgroundCss }}>
      {/* 上面 PASSION LOGO、下面主視覺橫式，中間經文／禱告文置中——三塊直接
          排在同一個 flex-col 裡，用 gap 留空隙，不用另外疊 margin。中間這塊
          包一層 flex-1 + justify-center，讓經文區塊在 LOGO 跟主視覺之間的
          剩餘空間裡置中，LOGO／主視覺維持自己原本的高度不被擠壓。
          兩張圖改用上面的 useImageDataUri 讀成 data URI 再用原生 img 畫，
          不透過 next/image：理由見 useImageDataUri 的說明。 */}
      <div className="relative flex h-full flex-col items-center gap-6 p-12 text-center text-white">
        {logoUri && <img src={logoUri} alt="PASSION" className="h-auto w-[55%]" />}

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

        {visualUri && (
          <img src={visualUri} alt="THE COURAGE GENERATIONS 勇者世代" className="h-auto w-full opacity-20" />
        )}
      </div>
    </div>
  )
})
