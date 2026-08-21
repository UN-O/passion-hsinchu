import Image from "next/image"
import { mantouSans } from "@/app/fonts/mantou-sans"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"
import type { CampZoneScreen } from "@/lib/opening-camp-content"

export function CampZonesGrid({ zones }: { zones: CampZoneScreen[] }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      {zones.map((zone) => (
        <div key={zone.title} className="flex w-full flex-col items-center gap-2 text-center">
          <Image src={zone.icon} alt={zone.title} width={120} height={120} className="size-20 rounded-full" />
          <h2 className={`${mantouSans.className} w-full text-xl sm:text-2xl`}>{zone.title}</h2>
          <p className="w-full text-sm text-white/60">區長：{zone.leaderName}</p>
          <p className="w-full text-white/80">{zone.body}</p>
          {/* 每區的一句話標語用源流明體 Bold＋5 度斜體，跟其他地方（早晨
              靈修卡片、CONF 開場經文）同一種「重點文字」的視覺處理。這裡
              是完整一句話（不是短標題），寬度卡在 74% 在手機窄螢幕會斷得
              很難看，改用滿版寬度，讓換行點跟著螢幕寬度自動跑。quote
              字串裡如果有 \n（分句語意獨立時，見
              lib/opening-camp-content.ts），whiteSpace: pre-line 讓它變成
              真正的換行，不靠瀏覽器自動斷行猜位置。 */}
          <p
            className={`${genRyuMin.className} w-full text-primary`}
            style={{ transform: "skewX(-5deg)", whiteSpace: "pre-line" }}
          >
            「{zone.quote}」
          </p>
        </div>
      ))}
    </div>
  )
}
