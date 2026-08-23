"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp, Instagram } from "lucide-react"

import { cn } from "@/lib/utils"
import type { IgStory } from "@/lib/instagram-stories"

// 官方 IG 限時動態：卡片本身就是完整的瀏覽器，不再是「點進去才看得到」的
// 按鈕——圖片直接填滿整張卡片（無 padding），自動輪播，也可以用右側的
// 上/下箭頭手動切換。故意不做成 <button>／<Link>：這裡就是內容本身，不是
// 通往別處的入口，不需要、也不應該讓人「點進去」。
const AUTO_ADVANCE_MS = 4000

export function IgStoriesSection({ stories, className }: { stories: IgStory[]; className?: string }) {
  const [index, setIndex] = useState(0)

  // 換一批限動（例如過期／有新的上傳）時，索引可能超出新陣列範圍，要退回
  // 第一張——用 render 期間調整 state 的寫法（React 建議的作法，見
  // immersive-progress.tsx 同樣的處理），不要用 effect 裡 setState 觸發
  // 多一次 render。
  const storiesKey = stories.map((story) => story.id).join(",")
  const [prevStoriesKey, setPrevStoriesKey] = useState(storiesKey)
  if (storiesKey !== prevStoriesKey) {
    setPrevStoriesKey(storiesKey)
    setIndex(0)
  }

  // 依賴 index：手動切換後從頭重新倒數，跟真正的 IG 限動一樣，不會切完
  // 馬上又被自動輪播跳走。
  useEffect(() => {
    if (stories.length <= 1) return
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % stories.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [stories.length, index])

  if (stories.length === 0) return null

  const goTo = (next: number) => setIndex((next + stories.length) % stories.length)

  return (
    <div
      className={cn(
        "relative aspect-[9/16] w-full overflow-hidden rounded-3xl border-2 border-white/50",
        className
      )}
    >
      <Image
        src={stories[index].image}
        alt="官方 IG 限時動態"
        fill
        sizes="(min-width: 640px) 640px, 100vw"
        className="object-cover"
      />

      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4">
        {stories.length > 1 && (
          <div className="flex gap-1">
            {stories.map((story, i) => (
              <div
                key={story.id}
                className={cn("h-1 flex-1 rounded-full", i === index ? "bg-primary" : "bg-white/30")}
              />
            ))}
          </div>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-sm text-white">
          <Instagram className="size-4" />
          官方 IG 限時動態
        </p>
      </div>

      {stories.length > 1 && (
        <div className="absolute inset-y-0 right-3 flex flex-col justify-center gap-2">
          <button
            type="button"
            aria-label="上一則"
            onClick={() => goTo(index - 1)}
            className="flex size-8 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white transition-colors hover:border-white/60"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="下一則"
            onClick={() => goTo(index + 1)}
            className="flex size-8 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white transition-colors hover:border-white/60"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
