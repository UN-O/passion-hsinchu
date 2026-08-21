import Image from "next/image"
import Link from "next/link"
import { Instagram } from "lucide-react"

import { cn } from "@/lib/utils"
import { CampLiquidGlassFilter } from "@/components/camp-liquid-glass-filter"
import { ScrollBlackout, ScrollBlackoutTrigger } from "@/components/camp-scroll-blackout"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampSidebar } from "@/components/camp-sidebar"
import { CampZoneIcons } from "@/components/camp-zone-icons"
import { SquadCourageCard } from "@/components/squad-courage-card"
import { IgStoriesSection } from "@/components/ig-stories-section"
import { getActiveIgStories } from "@/lib/instagram-stories"
import { ZoneScoreChart } from "@/components/zone-score-chart"
import { CampCountdownCard } from "@/components/camp-countdown-card"
import { getRegionTotals } from "@/lib/exp"
import { heroAvatarDataUri } from "@/lib/hero-card-visuals"
import { getNextCampMeetingSession, campZoneScreens } from "@/lib/opening-camp-content"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

// 小隊資料目前後端還沒有這個模型（只有各區總分，沒有分小隊），
// 先放佔位內容做畫面，之後接上真正的小隊資料庫再換掉（之後會把全部名單分隊做進後台）。
// 六眼肥魚是小丑魚區的小隊。
const PLACEHOLDER_SQUAD_NAME = "六眼肥魚"
const PLACEHOLDER_SQUAD_COURAGE_POINTS = 1280
const PLACEHOLDER_USER_ZONE_KEY = "clownfish"

// 大方框、置底文字，跟 conference-mission-home.tsx 的聚會內容卡同一個格式。
// 場次名稱已經接上 campSessions／getNextCampSession 的真實場次資料。
const MEETING_CARD_LABEL = "聚會內容"

// 對應 lib/exp-regions.ts 的 region key，但圖示／名稱沿用 onboarding 那邊
// 已經定案的三區吉祥物（土撥鼠區／小丑魚區／熊蜂區），維持前後一致。
// color 用 dataviz skill 的分類色票，在深色底下跑過六項檢查（validate_palette.js
// --mode dark --surface "#0a0a0a" --pairs all）確認可分辨，對應各區 icon 的主色調。
const ZONE_META = [
  { key: "groundhog", title: "土撥鼠區", icon: "/images/zone-icon-1.webp", color: "#008300" },
  { key: "clownfish", title: "小丑魚區", icon: "/images/zone-icon-2.webp", color: "#9333ea" },
  { key: "bee", title: "熊蜂區", icon: "/images/zone-icon-3.webp", color: "#3987e5" },
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
  // 只在 4 場正式 SESSION 裡挑，因為卡片點進去的 /camp/meeting 現在專門
  // 顯示這 4 場，兩邊的「下一場」要對得起來（大地競賽／辯論場／Podcast
  // 不算聚會，見 lib/opening-camp-content.ts 的 CAMP_MEETING_SESSION_IDS）。
  const nextSession = getNextCampMeetingSession()
  // 過期（上傳超過 24 小時）的限動先在伺服器端濾掉，client 不用自己重算。
  const activeIgStories = getActiveIgStories()

  return (
    <ScrollBlackout>
    <main className="relative z-0 mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
      <CampLiquidGlassFilter filterId="camp-liquid-glass-filter" />
      <PassionLogoHeader
        logoTone="dark"
        sticky
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
        <SquadCourageCard squadName={PLACEHOLDER_SQUAD_NAME} total={PLACEHOLDER_SQUAD_COURAGE_POINTS} />
      </SectionCard>

      <SectionCard variant="glass" className="mt-6 flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">各區目前積分</p>
        <ZoneScoreChart zones={zoneScores} />
      </SectionCard>

      {/* 背景只在這張「開場聚會」卡片整個露出來（沒被 sticky logo 列蓋到、
          也沒被畫面下緣切到）時才變黑，只要卡片被切掉一點點就變回黃色
          （見 camp-scroll-blackout.tsx，量的是這個包住卡片的容器）。 */}
      <ScrollBlackoutTrigger>
        {/* 下場聚會視覺依場次換成 nextSession.image，跟 CONF 首頁聚會卡片
            同一個排版：滿版照片＋由下往上的黑色漸層，文字疊在上面維持可讀度。 */}
        <Link
          href={meetingHref}
          className="relative mt-6 flex aspect-[5/4] w-full flex-col justify-end overflow-hidden rounded-3xl p-6"
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
          <p className="relative z-10 text-sm text-white/80">{MEETING_CARD_LABEL}</p>
          <p className={`${genRyuMin.className} relative z-10 mt-2 w-[min(74%,28rem)] text-2xl text-white`}>
            {nextSession.label}
          </p>
        </Link>
      </ScrollBlackoutTrigger>

      {/* 早晨靈修：首頁只留一個入口，進去之後用頁面裡的 DAY2／DAY3 玻璃
          切換按鈕切換（見 app/camp/devotion/[day]/layout.tsx 的
          CampDevotionDaySelect），不用在首頁放兩個按鈕。連到 /camp/devotion
          （會自動轉去目前這一天的正式網址）。 */}
      <Link href="/camp/devotion" className="mt-6 block">
        <SectionCard variant="glass" className="flex flex-col gap-1">
          <p className={`${genRyuMin.className} w-[min(74%,28rem)] text-2xl text-white`}>早晨靈修</p>
          <p className="text-sm text-muted-foreground">查看今天的靈修內容</p>
        </SectionCard>
      </Link>

      {activeIgStories.length > 0 && (
        <SectionCard variant="glass" className="mt-6 flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Instagram className="size-4" />
            官方 IG 限時動態
          </p>
          <IgStoriesSection stories={activeIgStories} />
        </SectionCard>
      )}
    </main>
    </ScrollBlackout>
  )
}
