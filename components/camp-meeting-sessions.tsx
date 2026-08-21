"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollBlackoutTrigger } from "@/components/camp-scroll-blackout"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

type SessionSummary = {
  id: string
  label: string
  dateTimeLabel: string
  image: string
  startISO: string
}

// 4 場正式聚會全部隨時看得到、隨時可以點進去（不再有「還沒輪到不能看」的
// 時間限制），但首頁不想一次塞 4 張大圖——預設只放大張的「即將開始」卡片，
// 其餘 3 場收在「查看所有活動」展開清單裡，跟 CONFERENCE 首頁同一套模式
// （見 conference-mission-home.tsx）。
export function CampMeetingSessions({
  nextSession,
  allSessions,
  meetingHref,
}: {
  nextSession: SessionSummary
  allSessions: SessionSummary[]
  meetingHref: string
}) {
  const [expanded, setExpanded] = useState(false)
  const otherSessions = allSessions.filter((s) => s.id !== nextSession.id)

  return (
    <div className="mt-6">
      {/* ScrollBlackoutTrigger 只包卡片本身（不含底下的展開按鈕／清單）：
          首頁背景要在「這張卡片整個露出來」時變黑，包更大範圍的話，展開
          清單會讓量出來的容器高度跟著變、門檻會跟著跑掉（見
          camp-scroll-blackout.tsx）。 */}
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

      {otherSessions.length > 0 && (
        <>
          {/* 淺色純文字，不用邊框方框——方框那圈 border-border 在黑底（見
              camp-scroll-blackout.tsx 的 data-blackout）下太不明顯，容易被
              當成裝飾文字滑過去，改成跟頁面其他連結一樣的文字連結樣式。 */}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 py-2.5 text-sm text-foreground/80 hover:text-foreground"
            aria-expanded={expanded}
          >
            查看所有活動
            <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} strokeWidth={1.75} />
          </button>

          {expanded && (
            <div className="mt-3 flex flex-col gap-2">
              {otherSessions.map((s) => {
                const notStarted = new Date(s.startISO) > new Date()
                return (
                  <Link
                    key={s.id}
                    href={`${meetingHref}/${s.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 p-4"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {s.label}
                      {/* 拿掉時間鎖之後任何場次都能點進去看，未開始的場次要標出來，
                          不然使用者會以為聚會已經開始了。 */}
                      {notStarted && <span className="text-xs font-normal text-muted-foreground">未開始</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.dateTimeLabel}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
