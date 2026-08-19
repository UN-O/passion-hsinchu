import Image from "next/image"
import Link from "next/link"

import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampSidebar } from "@/components/camp-sidebar"
import { SquadCourageCard } from "@/components/squad-courage-card"
import { IgStoriesSection } from "@/components/ig-stories-section"
import { ZoneScoreChart } from "@/components/zone-score-chart"
import { getRegionTotals } from "@/lib/exp"
import { heroAvatarDataUri } from "@/lib/hero-card-visuals"

// 小隊資料目前後端還沒有這個模型（只有各區總分，沒有分小隊），
// 先放佔位內容做畫面，之後接上真正的小隊資料庫再換掉（之後會把全部名單分隊做進後台）。
// 六眼肥魚是小丑魚區的小隊。
const PLACEHOLDER_SQUAD_NAME = "六眼肥魚"
const PLACEHOLDER_SQUAD_COURAGE_POINTS = 1280
const PLACEHOLDER_USER_ZONE_KEY = "clownfish"

// 聚會內容目前沒有 CMS，先放佔位文字，等聚會排程資料表定案後改成真的「下一場聚會」資訊。
// 跟 conference-mission-home.tsx 的聚會內容卡同一個格式（大方框、置底文字）。
const PLACEHOLDER_MEETING_DAY_LABEL = "聚會內容"
const PLACEHOLDER_MEETING_TITLE = "查看這場聚會的大綱與筆記"

// 對應 lib/exp-regions.ts 的 region key，但圖示／名稱沿用 onboarding 那邊
// 已經定案的三區吉祥物（土撥鼠區／小丑魚區／熊蜂區），維持前後一致。
// color 用 dataviz skill 的分類色票，在深色底下跑過六項檢查（validate_palette.js
// --mode dark --surface "#0a0a0a" --pairs all）確認可分辨，對應各區 icon 的主色調。
const ZONE_META = [
  { key: "groundhog", title: "土撥鼠區", icon: "/images/zone-icon-1.png", color: "#008300" },
  { key: "clownfish", title: "小丑魚區", icon: "/images/zone-icon-2.png", color: "#9333ea" },
  { key: "bee", title: "熊蜂區", icon: "/images/zone-icon-3.png", color: "#3987e5" },
] as const

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-border bg-muted/20 p-6 ${className}`}>{children}</div>
  )
}

// 使用者自己那區排在正中間，另外兩區維持原本的相對順序分列兩側。
function withUserZoneInMiddle<T extends { key: string }>(zones: T[], userZoneKey: string): T[] {
  const mine = zones.find((zone) => zone.key === userZoneKey)
  const others = zones.filter((zone) => zone.key !== userZoneKey)
  if (!mine || others.length !== zones.length - 1) return zones
  const middle = Math.floor(others.length / 2)
  return [...others.slice(0, middle), mine, ...others.slice(middle)]
}

export async function CampMissionHome({
  profileHref = "/camp/profile",
  meetingHref = "/camp/meeting",
  heroName = "",
}: {
  profileHref?: string
  meetingHref?: string
  heroName?: string
} = {}) {
  const totals = await getRegionTotals()
  const zoneScores = withUserZoneInMiddle(
    ZONE_META.map((zone) => ({ ...zone, total: totals[zone.key] })),
    PLACEHOLDER_USER_ZONE_KEY
  )

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader
        logoTone="dark"
        leftSlot={<CampSidebar />}
        rightSlot={
          <Link
            href={profileHref}
            aria-label="個人資料"
            className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI 頭像，next/image 優化不到 */}
            <img src={heroAvatarDataUri(heroName)} alt="個人資料" className="size-full object-cover" />
          </Link>
        }
      />

      <SectionCard className="mt-10 flex items-center justify-center gap-6">
        {ZONE_META.map((zone) => (
          <Image
            key={zone.key}
            src={zone.icon}
            alt={zone.title}
            width={120}
            height={120}
            className="size-14 rounded-full sm:size-16"
          />
        ))}
      </SectionCard>

      <SectionCard className="mt-6">
        <SquadCourageCard squadName={PLACEHOLDER_SQUAD_NAME} total={PLACEHOLDER_SQUAD_COURAGE_POINTS} />
      </SectionCard>

      <SectionCard className="mt-6 flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">各區目前積分</p>
        <ZoneScoreChart zones={zoneScores} />
      </SectionCard>

      <Link
        href={meetingHref}
        className="mt-6 flex aspect-[5/4] w-full flex-col justify-end rounded-3xl bg-[#DC2626] p-6"
      >
        <p className="text-sm text-white/80">{PLACEHOLDER_MEETING_DAY_LABEL}</p>
        <p className="mt-2 text-2xl font-bold text-white">{PLACEHOLDER_MEETING_TITLE}</p>
      </Link>

      <SectionCard className="mt-6 flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">下場聚會倒數</p>
        <p className="text-xl font-bold">時間尚未公布</p>
      </SectionCard>

      <SectionCard className="mt-6 flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">官方 IG 限時動態</p>
        <IgStoriesSection />
      </SectionCard>
    </main>
  )
}
