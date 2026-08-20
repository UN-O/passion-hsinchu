import Image from "next/image"

import type { CampProfileResult } from "@/lib/opening-camp-content"
import { HERO_CARD_IMAGE } from "@/lib/hero-card-visuals"

// 勇者卡片背後的詳細資訊（勇者測驗結果頁「了解更多」跟個人資料頁的卡片翻面共用）。
// 兩邊背景不一樣：結果頁還是深色底，個人資料頁在 camp 淺黃主題底下，
// 所以文字顏色要跟著背景切換，不能寫死白色。
export function CampHeroDetails({
  result,
  tone = "dark",
}: {
  result: CampProfileResult
  tone?: "light" | "dark"
}) {
  const src = HERO_CARD_IMAGE[result.aCount] ?? HERO_CARD_IMAGE[2]
  const bodyClass = tone === "dark" ? "text-white/90" : "text-foreground"
  const labelClass = tone === "dark" ? "text-white/60" : "text-muted-foreground"

  return (
    <div className={`flex w-full flex-col items-center gap-4 text-center ${bodyClass}`}>
      <Image
        src={src}
        alt={result.name}
        width={800}
        height={1200}
        draggable={false}
        className="w-full max-w-40 self-center rounded-2xl"
      />
      <p className="w-full">{result.description}</p>
      <div className="w-full">
        <p className={`text-sm font-bold ${labelClass}`}>勇者特質</p>
        <p className="mt-1">{result.traits.join("、")}</p>
      </div>
      <div className="w-full">
        <p className={`text-sm font-bold ${labelClass}`}>小提醒</p>
        <p className="mt-1">{result.reminder}</p>
      </div>
    </div>
  )
}
