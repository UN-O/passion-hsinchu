"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ConferenceSession } from "@/lib/opening-conference-content"

// 3 場聚會全部隨時看得到、隨時可以點進去（不再有「還沒輪到不能看」的時間
// 限制），但首頁不想一次塞 3 張大圖——預設只放大張的「即將開始」卡片，
// 其餘場次收在「查看所有活動」展開清單裡，跟 CAMP 首頁同一套模式（見
// camp-meeting-sessions.tsx）。
export function ConferenceMeetingSessions({
  nextSession,
  allSessions,
  meetingHref,
}: {
  nextSession: ConferenceSession
  allSessions: ConferenceSession[]
  meetingHref: string
}) {
  const [expanded, setExpanded] = useState(false)
  const otherSessions = allSessions.filter((s) => s.id !== nextSession.id)

  return (
    <div className="mt-6">
      <Link
        href={`${meetingHref}/${nextSession.id}`}
        className="relative flex aspect-video w-full flex-col justify-end overflow-hidden rounded-3xl p-6"
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
        <p className="relative z-10 text-sm text-white/80">即將開始：{nextSession.dateLabel}・{nextSession.sessionLabel}</p>
        <p className="relative z-10 mt-2 text-2xl font-bold text-white">{nextSession.typeLabel}</p>
      </Link>

      {otherSessions.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/30 py-2.5 text-sm text-white/70 hover:text-white"
            aria-expanded={expanded}
          >
            查看所有活動
            <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} strokeWidth={1.75} />
          </button>

          {expanded && (
            <div className="mt-3 flex flex-col gap-2">
              {otherSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`${meetingHref}/${s.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/5 p-4"
                >
                  <span className="text-sm font-medium text-white">
                    {s.dateLabel}・{s.sessionLabel}・{s.typeLabel}
                  </span>
                  <span className="text-xs text-white/60">{s.startTime}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
