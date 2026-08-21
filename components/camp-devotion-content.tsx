"use client"

import { useEffect, useState } from "react"
import { YouVersionProvider, BibleCard } from "@youversion/platform-react-ui"

import { genRyuMin } from "@/app/fonts/gen-ryu-min"
import { YOUVERSION_DEFAULT_VERSION_ID, type DevotionEntry } from "@/lib/devotion-content"

// 經文串接 YouVersion Platform API（bible.com 官方 API），要在 platform.youversion.com
// 免費註冊一個 App 拿 App Key，填進 .env 的 NEXT_PUBLIC_YOUVERSION_APP_KEY 才會生效。
// 這把 Key 設計上就是給前端公開用的（不是要保密的密鑰），所以用 NEXT_PUBLIC_ 前綴。
// 沒設定的時候先顯示「經文尚未連接」，不要讓頁面直接壞掉。
const APP_KEY = process.env.NEXT_PUBLIC_YOUVERSION_APP_KEY

// 靈修內容區：經文（YouVersion）＋導言＋結語，整合在討論串 root 的顯示區塊
// 裡（跟 RootContent 視覺上同一塊）。引導問題不在這裡——那些是 root 底下
// 置頂的官方回覆，顯示在下面接著的 DiscussionRoot 裡，不是這個元件的內容。
// 一天一個路由（/camp/devotion/[day]），不再是同一頁裡切換 DAY2/DAY3 的
// tab，所以這裡只吃「單一天」的 entry，沒有 tab 切換狀態。
export function CampDevotionContent({ entry, isStaff }: { entry: DevotionEntry; isStaff: boolean }) {
  const [revealed, setRevealed] = useState(isStaff)

  useEffect(() => {
    if (isStaff) return
    // 公布時間是固定的未來時刻，伺服器跟瀏覽器 hydrate 那一刻幾乎不會剛好跨過
    // 這個邊界，先一律 SSR 成「尚未公布」，掛載後才用瀏覽器當下時間判斷。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealed(Date.now() >= new Date(entry.revealISO).getTime())
  }, [entry.revealISO, isStaff])

  if (!revealed) {
    return (
      <div className="flex min-h-[50vh] flex-col">
        <p className="text-sm text-muted-foreground">{entry.day}</p>
        <div className="flex flex-1 items-center justify-center">
          <p className={`${genRyuMin.className} text-2xl`} style={{ transform: "skewX(-5deg)" }}>
            尚未公布
          </p>
        </div>
      </div>
    )
  }

  const passage = APP_KEY ? (
    <BibleCard reference={entry.reference} versionId={YOUVERSION_DEFAULT_VERSION_ID} background="light" showVersionPicker />
  ) : (
    <p className="text-sm text-muted-foreground">經文尚未連接。</p>
  )

  const content = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{entry.day}</p>
        {/* 74% 寬度限制是給直式卡片（區介紹彈窗那種）斷行用的慣例，這裡
            套用會把標題硬擠成兩行、只剩一個字掉到第二行（見使用者截圖：
            「勇敢是：選擇神看為正確的」／「事」）。這裡容器本身已經是
            滿版寬度，拿掉限制讓標題用完整寬度斷行，靠 globals.css 的
            text-wrap: pretty 在標點符號後面斷得更自然。 */}
        <p className={`${genRyuMin.className} text-xl`} style={{ transform: "skewX(-5deg)" }}>
          {entry.title}
        </p>
      </div>

      {passage}

      {entry.intro && (
        <div className="flex flex-col gap-2 text-base">
          {entry.intro.split("\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      {entry.closing && <p className="text-base font-bold">{entry.closing}</p>}
    </div>
  )

  if (!APP_KEY) return content

  return (
    <YouVersionProvider appKey={APP_KEY} theme="light">
      {content}
    </YouVersionProvider>
  )
}
