import Image from "next/image"
import Link from "next/link"

import { ConferenceCountdown } from "@/components/conference-countdown"
import { conferenceWorkshops } from "@/lib/opening-conference-content"
import { conference } from "@/lib/site-config"

// 聚會場次的詳細內容目前沒有 CMS 可以管理，先用整場特會第一天的時間佔位，
// 等聚會排程資料表定案後改成真的「下一場聚會」資訊。
const PLACEHOLDER_MEETING_DAY_LABEL = "DAY1 聚會"
const PLACEHOLDER_MEETING_TITLE = "聚會標題"

export function ConferenceMissionHome({
  workshopsHref = "/conference/workshops",
  meetingHref = "/conference/meeting",
}: {
  workshopsHref?: string
  meetingHref?: string
} = {}) {
  return (
    <main className="min-h-svh bg-[#feed74] pb-16">
      {/* TODO: 頂部主視覺圖片尚未提供，之後補上後改成 sticky top-0 吸頂固定 */}

      <div className="px-4 pt-6 sm:px-6">
        <p className="text-lg font-bold text-black sm:text-xl">歡迎來到 PASSION</p>

        {/* 工作坊主視覺尚未提供圖片，先用純色塊佔位，往右滑可看到其他工作坊 */}
        <div
          className="mt-6 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {conferenceWorkshops.map((workshop, index) => (
            <Link
              key={workshop.id}
              href={`${workshopsHref}/${workshop.id}`}
              aria-label={workshop.title}
              className="flex aspect-[4/5] w-28 shrink-0 items-end rounded-3xl bg-[#3B82F6] p-3 sm:w-36 sm:p-4"
              style={{ scrollSnapAlign: "start" }}
            >
              <span className="text-xs font-semibold text-white/70">
                {(index + 1).toString().padStart(2, "0")}
              </span>
            </Link>
          ))}
        </div>

        {/* 聚會內容目前沒有 CMS，先放佔位文字，之後接上真正的聚會資料。
            左右邊跟工作坊那排卡片切齊（同一層 px 內距），不是貼齊螢幕邊緣。 */}
        <Link
          href={meetingHref}
          className="mt-6 flex aspect-[5/4] w-full flex-col justify-end rounded-3xl bg-[#DC2626] p-6"
        >
          <p className="text-sm text-white/80">{PLACEHOLDER_MEETING_DAY_LABEL}</p>
          <p className="mt-2 text-2xl font-bold text-white">{PLACEHOLDER_MEETING_TITLE}</p>
        </Link>

        <div className="mt-6 rounded-3xl bg-slate-300 p-6">
          <p className="text-sm font-medium text-black/70">下場聚會倒數</p>
          <ConferenceCountdown targetISO={conference.startDateISO} />
        </div>

        <div className="mt-10 flex justify-center">
          <Image
            src="/images/passion-logo.png"
            alt="PASSION®"
            width={979}
            height={178}
            className="h-6 w-auto brightness-0"
          />
        </div>
      </div>
    </main>
  )
}
