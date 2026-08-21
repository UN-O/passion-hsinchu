import Image from "next/image"
import { mantouSans } from "@/app/fonts/mantou-sans"
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
          {/* 每區的一句話標語用 brand-yellow 強調，跟 style.md 的用色規則一致
              （黃色只做重點強調，這裡是這段介紹裡唯一該搶眼的一行）。 */}
          <p className="w-full font-bold text-primary">「{zone.quote}」</p>
        </div>
      ))}
    </div>
  )
}
