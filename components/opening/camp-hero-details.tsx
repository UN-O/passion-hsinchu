import Image from "next/image"

import type { CampProfileResult } from "@/lib/opening-camp-content"
import { HERO_CARD_IMAGE } from "@/lib/hero-card-visuals"

// 勇者卡片背後的詳細資訊（勇者測驗結果頁「了解更多」跟個人資料頁的卡片翻面共用）。
export function CampHeroDetails({ result }: { result: CampProfileResult }) {
  const src = HERO_CARD_IMAGE[result.aCount] ?? HERO_CARD_IMAGE[2]

  return (
    <div className="flex flex-col items-center gap-4 text-center text-white/90">
      <Image
        src={src}
        alt={result.name}
        width={800}
        height={1200}
        draggable={false}
        className="w-full max-w-40 self-center rounded-2xl"
      />
      <p>{result.description}</p>
      <div>
        <p className="text-sm font-medium text-white/60">勇者特質</p>
        <p className="mt-1">{result.traits.join("、")}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-white/60">小提醒</p>
        <p className="mt-1">{result.reminder}</p>
      </div>
    </div>
  )
}
