"use client"

import { useEffect, useState } from "react"

import { genRyuMin } from "@/app/fonts/gen-ryu-min"
import type { DevotionEntry } from "@/lib/devotion-content"
import type { BiblePassage } from "@/lib/bible"
import type { LinkPreviewDTO, PostImageDTO } from "@/lib/discussion/dto"
import { RootContent } from "@/components/discussion/root-content"

// 靈修內容現在就是一篇正常的 root post（跟 camp/conference 聚會頁同一套
// RootContent：content／經文／附圖都是真的存在資料庫的東西，admin 可以
// 編輯、閱讀模式的段落也能改），不是另外寫死一份文字。這個元件只多負責
// 一件 RootContent 沒有的事：DAY2／DAY3 的公布時間閘門——公布前只顯示
// 「尚未公布」，不會提早爆雷；day 標題保留原本的手寫體斜角樣式，所以
// 沒有直接把它塞進 content markdown 裡，是頁面層級的裝飾，不是「文章
// 本身」的一部分。
export function CampDevotionContent({
  entry,
  isStaff,
  rootPostId,
  content,
  images,
  linkPreview,
  bibleReading,
  isDiscussionAdmin,
}: {
  entry: DevotionEntry
  isStaff: boolean
  rootPostId: string
  content: string
  images: PostImageDTO[]
  linkPreview: LinkPreviewDTO | null
  bibleReading: BiblePassage | null
  isDiscussionAdmin: boolean
}) {
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

  return (
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

      <RootContent
        rootPostId={rootPostId}
        content={content}
        images={images}
        linkPreview={linkPreview}
        bibleReading={bibleReading}
        isDiscussionAdmin={isDiscussionAdmin}
      />
    </div>
  )
}
