import Image from "next/image"
import { mantouSans } from "@/app/fonts/mantou-sans"
import type { CampZoneScreen } from "@/lib/opening-camp-content"

export function CampZonesGrid({ zones }: { zones: CampZoneScreen[] }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      {zones.map((zone) => (
        <div key={zone.title} className="flex w-full flex-col items-center gap-3 text-center">
          <Image src={zone.icon} alt={zone.title} width={120} height={120} className="size-20 rounded-full" />
          <h2 className={`${mantouSans.className} w-full text-xl sm:text-2xl`}>{zone.title}</h2>
          <p className="w-full text-white/80">{zone.body}</p>
        </div>
      ))}
    </div>
  )
}
