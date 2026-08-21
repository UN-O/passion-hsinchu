import Image from "next/image"
import Link from "next/link"

import { ScrollBlackoutTrigger } from "@/components/camp-scroll-blackout"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

type SessionSummary = {
  id: string
  label: string
  image: string
}

// 4 場正式聚會全部隨時看得到、隨時可以點進去（不再有「還沒輪到不能看」的
// 時間限制），首頁只放「即將開始」這張大卡片；其餘場次要看全部要去
// meetingHref 那頁，首頁不重複列。
export function CampMeetingSessions({
  nextSession,
  meetingHref,
}: {
  nextSession: SessionSummary
  meetingHref: string
}) {
  return (
    <div className="mt-6">
      {/* 首頁背景要在「這張卡片整個露出來」時變黑（見 camp-scroll-blackout.tsx）。 */}
      <ScrollBlackoutTrigger>
        <Link
          href={`${meetingHref}/${nextSession.id}`}
          className="relative flex aspect-[5/4] w-full flex-col justify-end overflow-hidden rounded-3xl p-6"
        >
          <Image
            src={nextSession.image}
            alt=""
            fill
            sizes="(min-width: 640px) 640px, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <p className="relative z-10 text-sm text-white/80">即將開始：</p>
          <p className={`${genRyuMin.className} relative z-10 mt-2 w-[min(74%,28rem)] text-2xl text-white`}>
            {nextSession.label}
          </p>
        </Link>
      </ScrollBlackoutTrigger>
    </div>
  )
}
