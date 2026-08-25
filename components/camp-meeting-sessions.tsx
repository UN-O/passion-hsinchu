import Image from "next/image"
import Link from "next/link"

import { ScrollBlackoutTrigger } from "@/components/camp-scroll-blackout"
import { CampMeetingDayAccordion, type CampMeetingDaySection } from "@/components/camp-meeting-day-accordion"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"
import {
  formatCampMeetingDateLabel,
  formatCampMeetingTimeLabel,
  getCampMeetingSessions,
  type CampSession,
} from "@/lib/opening-camp-content"

// 場次 id 一律「dayN-場次名」，DAY1／DAY2／DAY3 手風琴分組直接切 id 前綴，
// 不用另外維護一份場次→天的對照表。
const CAMP_DAY_IDS = ["day1", "day2", "day3"] as const

function getSessionDayId(sessionId: string): string {
  return sessionId.split("-")[0]
}

type StatusLabel = {
  text: string
  // 灰階（text-white/50）表示「還沒輪到」——尚未開始的場次、已經結束的
  // 場次都算，只有正在進行／即將開始（下一場）用全白強調，呼應 style.md
  // 互動狀態用「顏色深淺」表達、不另外發明強調色的規則。
  toneClass: string
}

// featuredId：目前最該被注意的那一場（正在進行、或還沒開始的場次裡最近
// 的一場）。其餘場次一律「尚未開始（時間）」；已經結束的場次改顯示日期，
// 不再誤標成「即將開始」。
function getStatusLabel(session: CampSession, now: Date, featuredId: string): StatusLabel {
  const start = new Date(session.startISO)
  const end = new Date(session.endISO)

  if (now > end) {
    return { text: formatCampMeetingDateLabel(session.startISO), toneClass: "text-white/50" }
  }
  if (now >= start) {
    return { text: "正在進行", toneClass: "text-white" }
  }
  if (session.id === featuredId) {
    return { text: "即將開始", toneClass: "text-white" }
  }
  return { text: `尚未開始（${formatCampMeetingTimeLabel(session.startISO)}）`, toneClass: "text-white/50" }
}

// 「活動筆記」：6 場正式聚會全部隨時看得到、隨時可以點進去（不再有「還沒
// 輪到不能看」的時間限制），首頁用 DAY1／DAY2／DAY3 手風琴分組列出全部
// 場次的卡片，不用再點去別的頁面看清單。預設只展開「featured」那一天
// （正在進行的場次所在那天；全部場次都還沒開始時是最近的下一場那天；
// 全部都結束時退回最後一場那天），其餘天預設收合，使用者可以自己再展開。
// 首頁背景黑化只跟著 featured 那張卡片走，不用整個清單都露出來才變黑
// （見 camp-scroll-blackout.tsx），維持跟改版前單卡一樣的觸發時機——
// 這張卡片所在的那一天預設就是展開的，所以掛載時一定看得到。
export function CampMeetingSessions({ meetingHref }: { meetingHref: string }) {
  const sessions = getCampMeetingSessions()
  const now = new Date()
  const featured = sessions.find((session) => new Date(session.endISO) >= now) ?? sessions[sessions.length - 1]
  const featuredDayId = getSessionDayId(featured.id)

  const days: CampMeetingDaySection[] = CAMP_DAY_IDS.map((dayId) => {
    const daySessions = sessions.filter((session) => getSessionDayId(session.id) === dayId)
    return {
      id: dayId,
      label: dayId.toUpperCase(),
      defaultOpen: dayId === featuredDayId,
      children: daySessions.map((session) => {
        const status = getStatusLabel(session, now, featured.id)
        const card = (
          <Link
            href={`${meetingHref}/${session.id}`}
            className="relative flex aspect-[16/9] w-full flex-col justify-end overflow-hidden rounded-3xl p-5"
          >
            <Image
              src={session.image}
              alt=""
              fill
              sizes="(min-width: 640px) 640px, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 30%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <p className={`relative z-10 text-sm ${status.toneClass}`}>{status.text}</p>
            <p className={`${genRyuMin.className} relative z-10 mt-1 text-xl text-white`}>{session.label}</p>
          </Link>
        )
        return session.id === featured.id ? (
          <ScrollBlackoutTrigger key={session.id}>{card}</ScrollBlackoutTrigger>
        ) : (
          <div key={session.id}>{card}</div>
        )
      }),
    }
  })

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">活動筆記</p>
      <CampMeetingDayAccordion days={days} />
    </div>
  )
}
