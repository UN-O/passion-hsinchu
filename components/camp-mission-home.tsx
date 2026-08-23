import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { CampLiquidGlassFilter } from "@/components/camp-liquid-glass-filter"
import { ScrollBlackout } from "@/components/camp-scroll-blackout"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampSidebar } from "@/components/camp-sidebar"
import { CampZoneIcons } from "@/components/camp-zone-icons"
import { CAMP_ZONE_META } from "@/lib/camp-zones"
import { SquadCourageCard } from "@/components/squad-courage-card"
import { IgStoriesSection } from "@/components/ig-stories-section"
import { getActiveIgStories } from "@/lib/instagram-stories"
import { ZoneScoreChart } from "@/components/zone-score-chart"
import { CampCountdownCard } from "@/components/camp-countdown-card"
import { CampMeetingSessions } from "@/components/camp-meeting-sessions"
import { getRegionTotals, getTeamTotals } from "@/lib/exp"
import { getCampTeamInfo } from "@/lib/camp-team"
import { heroAvatarDataUri } from "@/lib/hero-card-visuals"
import { campZoneScreens, getNextCampMeetingSession } from "@/lib/opening-camp-content"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

// 還沒分到隊（camp_team_member 查不到）時顯示的預設文字。
const UNASSIGNED_SQUAD_NAME = "尚未分隊"

// 對應 lib/exp-regions.ts 的 region key，但圖示／名稱沿用 onboarding 那邊
// 已經定案的三區吉祥物（土撥鼠區／尼莫魚區／熊蜂區），維持前後一致。
// color 用 dataviz skill 的分類色票，在深色底下跑過六項檢查（validate_palette.js
// --mode dark --surface "#0a0a0a" --pairs all）確認可分辨，對應各區 icon 的主色調。
const ZONE_META = [
  { key: "groundhog", ...CAMP_ZONE_META.groundhog },
  { key: "clownfish", ...CAMP_ZONE_META.clownfish },
  { key: "bee", ...CAMP_ZONE_META.bee },
] as const

function SectionCard({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode
  className?: string
  variant?: "default" | "glass"
}) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6",
        variant === "glass"
          ? // 液態玻璃：模擬 iOS 最新系統的玻璃材質。camp-glass-card（見 globals.css）
            // 負責 backdrop-filter 的漸進增強（有支援的瀏覽器才會扭曲，Safari 退回
            // 純模糊，不會壞）；這裡的漸層／陰影是靜態的視覺基底，卡片內部疊一層
            // 左上亮、右下藍灰的放射狀漸層模擬玻璃材質本身的光影與色澤，邊緣用內
            // 陰影做出鏡片感的高光／暗邊，外面加落地陰影撐出浮起來的立體感。
            "camp-glass-card border-2 border-white/50 bg-[radial-gradient(120%_100%_at_25%_15%,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_35%,rgba(191,219,254,0.05)_70%,rgba(255,255,255,0.08)_100%)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_4px_rgba(30,64,124,0.14),0_16px_40px_rgba(0,0,0,0.22)]"
          : "border border-border bg-muted/20",
        className
      )}
    >
      {children}
    </div>
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
  enrollmentId = null,
  avatarUrl = null,
}: {
  profileHref?: string
  meetingHref?: string
  heroName?: string
  enrollmentId?: string | null
  // 自己上傳的／Google 的頭像。沒有就退回姓名第一個字的預設圖。
  avatarUrl?: string | null
} = {}) {
  const [totals, teamTotals, teamInfo, activeIgStories] = await Promise.all([
    getRegionTotals(),
    getTeamTotals(),
    getCampTeamInfo(enrollmentId),
    // 過期（上傳超過 24 小時）的限動先在伺服器端濾掉，client 不用自己重算。
    getActiveIgStories(),
  ])
  const { room: roomNumber, teamName, zone } = teamInfo
  // 還沒分到隊時 zone 是 null，withUserZoneInMiddle 找不到對應的 key 會
  // 原樣回傳（見它自己的 fallback），三區維持預設順序，不會炸。
  const zoneScores = withUserZoneInMiddle(
    ZONE_META.map((zoneMeta) => ({ ...zoneMeta, total: totals[zoneMeta.key] })),
    zone ?? ""
  )
  const squadCouragePoints = teamName ? (teamTotals[teamName] ?? 0) : 0
  // 只在 4 場正式 SESSION 裡挑，因為卡片點進去的 /camp/meeting 現在專門
  // 顯示這 4 場，兩邊的「下一場」要對得起來（大地競賽／辯論場／Podcast
  // 不算聚會，見 lib/opening-camp-content.ts 的 CAMP_MEETING_SESSION_IDS）。
  const nextSession = getNextCampMeetingSession()

  return (
    <ScrollBlackout>
    <main className="relative z-0 mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
      <CampLiquidGlassFilter filterId="camp-liquid-glass-filter" />
      <PassionLogoHeader
        logoTone="dark"
        sticky
        leftSlot={<CampSidebar roomNumber={roomNumber} />}
        rightSlot={
          <Link
            href={profileHref}
            aria-label="個人資料"
            className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI 頭像，next/image 優化不到 */}
            <img src={avatarUrl ?? heroAvatarDataUri(heroName)} alt="個人資料" className="size-full object-cover" />
          </Link>
        }
      />

      {/* 主視覺標題圖，跟 CONF 的 conference-title-visual.png 同一個放法：
          頁面最上面、logo 列下面，滿版寬度、正常隨頁面捲動。 */}
      <Image
        src="/images/camp-title-visual.webp"
        alt="PASSION CAMP"
        width={1400}
        height={1202}
        className="mt-6 h-auto w-full"
      />

      <CampZoneIcons zones={campZoneScreens} />

      <CampCountdownCard />

      <SectionCard variant="glass" className="mt-6">
        <SquadCourageCard squadName={teamName ?? UNASSIGNED_SQUAD_NAME} total={squadCouragePoints} />
      </SectionCard>

      <SectionCard variant="glass" className="mt-6 flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">各區目前積分</p>
        <ZoneScoreChart zones={zoneScores} />
      </SectionCard>

      {/* 背景只在「即將開始」那張卡片整個露出來（沒被 sticky logo 列蓋到、
          也沒被畫面下緣切到）時才變黑，只要卡片被切掉一點點就變回黃色
          （見 camp-scroll-blackout.tsx）。ScrollBlackoutTrigger 包在
          camp-meeting-sessions.tsx 裡面、只包住卡片本身。 */}
      <CampMeetingSessions nextSession={nextSession} meetingHref={meetingHref} />

      {/* 早晨靈修：首頁只留一個入口，進去之後用頁面裡的 DAY2／DAY3 玻璃
          切換按鈕切換（見 app/camp/devotion/[day]/layout.tsx 的
          CampDevotionDaySelect），不用在首頁放兩個按鈕。連到 /camp/devotion
          （會自動轉去目前這一天的正式網址）。aspect-[16/4] 用 CSS
          aspect-ratio，卡片寬度本來就跟著容器（max-w-2xl px-[6%]）縮放，
          高度自動跟著等比例變化，不用另外寫 media query。 */}
      <Link
        href="/camp/devotion"
        className="relative mt-6 flex aspect-[16/4] w-full items-center overflow-hidden rounded-3xl p-6"
      >
        <Image
          src="/images/camp-devotion-bg.webp"
          alt=""
          fill
          sizes="(min-width: 640px) 640px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="relative z-10 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {/* 16:4 是矮寬的橫幅，不是直式卡片，74% 寬度限制（給直式卡片
              斷行用的慣例）在這裡反而會逼標題硬換成兩行、擠壓矮版面。
              這裡橫向空間充足，不用限制寬度，維持一行。小標題貼在標題
              右邊、同一條基線，不是獨立一行；flex-wrap 是保險，字級再
              加大或標題變長時可以整排跳成兩行，不會硬擠。 */}
          <p className={`${genRyuMin.className} text-3xl whitespace-nowrap text-white sm:text-4xl`}>早晨靈修</p>
          <p className="text-sm whitespace-nowrap text-white/80">查看今天的靈修內容</p>
        </div>
      </Link>

      {activeIgStories.length > 0 && <IgStoriesSection stories={activeIgStories} className="mt-6" />}
    </main>
    </ScrollBlackout>
  )
}
