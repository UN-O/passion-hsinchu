import Image from "next/image"

import { IG_STORY_IMAGE } from "@/lib/instagram-stories"
import { socialLinks } from "@/lib/site-config"

// 手動維護的限動截圖（9:16 直式），點下去跳到官方 IG 個人頁看目前真正的限動。
// 沒有圖片時回傳 null，呼叫端（camp-mission-home.tsx）會連同外層卡片一起隱藏。
export function IgStoriesSection() {
  if (!IG_STORY_IMAGE) return null

  return (
    <a
      href={socialLinks.instagram}
      target="_blank"
      rel="noreferrer"
      className="relative block aspect-[9/16] w-2/5 max-w-[200px] overflow-hidden rounded-2xl border border-border bg-muted/40"
    >
      <Image src={IG_STORY_IMAGE} alt="官方 IG 限時動態" fill sizes="200px" className="object-cover" />
    </a>
  )
}
