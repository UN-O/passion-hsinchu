"use client"

import { useState } from "react"
import Image from "next/image"

import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import type { IgStory } from "@/lib/instagram-stories"

// 官方 IG 限時動態：首頁顯示最新一張的縮圖（stories[0]，呼叫端已經照
// 上傳時間排序＋濾掉過期的，見 lib/instagram-stories.ts），點下去用跟
// 營會守則同一套 ImmersiveScreen 開全螢幕瀏覽，點一下畫面切下一篇，
// 操作方式跟真正的 IG 限動一樣。scrim 關掉：這裡單純看照片，不像
// 營會守則疊文字需要暗化底圖維持可讀度。onBack 只是關掉這個 client
// state，不是導頁（ImmersiveScreen 預設的 router.back() 在這裡不對，
// 這個瀏覽器是疊在首頁上的 client 狀態，不是真的換路由）。
export function IgStoriesSection({ stories }: { stories: IgStory[] }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  if (stories.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIndex(0)
          setOpen(true)
        }}
        aria-label="官方 IG 限時動態"
        className="relative block aspect-[9/16] w-full overflow-hidden rounded-2xl border border-border bg-muted/40"
      >
        <Image
          src={stories[0].image}
          alt="官方 IG 限時動態"
          fill
          sizes="(min-width: 640px) 640px, 100vw"
          className="object-cover"
        />
      </button>

      {open && (
        // fixed inset-0：ImmersiveScreen 本來假設自己是整個頁面唯一內容（像
        // 營會守則那樣獨立一個 route），這裡是疊在首頁其他區塊中間，若不脫離
        // 文件流會被排到卡片原本的位置，要往下捲才看得到，不是真正的全螢幕
        // 疊層。用 fixed 蓋住整個 viewport，打開當下立刻鋪滿螢幕。
        <div className="fixed inset-0 z-50">
          <ImmersiveScreen
            background={{ type: "image", src: stories[index].image }}
            scrim={false}
            totalSteps={stories.length}
            index={index}
            onIndexChange={setIndex}
            progress={{ mode: "manual", value: 1, fillClassName: "bg-white" }}
            onBack={() => setOpen(false)}
          >
            {null}
          </ImmersiveScreen>
        </div>
      )}
    </>
  )
}
