import Image from "next/image"
import Link from "next/link"

import { PassionLogoHeader } from "@/components/passion-logo-header"
import { getRegionTotals } from "@/lib/exp"
import { HERO_AVATAR_PLACEHOLDER_URI } from "@/lib/hero-card-visuals"

// 小隊資料目前後端還沒有這個模型（只有各區總分，沒有分小隊），
// 先放佔位內容做畫面，之後接上真正的小隊資料庫再換掉。
const PLACEHOLDER_SQUAD_NAME = "第一小隊"
const PLACEHOLDER_SQUAD_POINTS = 1280

// 對應 lib/exp-regions.ts 的 region key，但圖示／名稱沿用 onboarding 那邊
// 已經定案的三區吉祥物（土撥鼠區／小丑魚區／雄蜂區），維持前後一致。
const ZONE_META = [
  { key: "groundhog", title: "土撥鼠區", icon: "/images/zone-icon-1.png" },
  { key: "clownfish", title: "小丑魚區", icon: "/images/zone-icon-2.png" },
  { key: "bee", title: "雄蜂區", icon: "/images/zone-icon-3.png" },
] as const

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-border bg-muted/20 p-6 ${className}`}>{children}</div>
  )
}

export async function CampMissionHome({
  profileHref = "/camp/profile",
  meetingHref = "/camp/meeting",
}: {
  profileHref?: string
  meetingHref?: string
} = {}) {
  const totals = await getRegionTotals()
  const ranked = ZONE_META.map((zone) => ({ ...zone, total: totals[zone.key] })).sort(
    (a, b) => b.total - a.total
  )
  const max = Math.max(...ranked.map((zone) => zone.total), 0)

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader />

      <div className="relative mt-10">
        <SectionCard className="flex items-center justify-center gap-6">
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

        <Link
          href={profileHref}
          aria-label="個人資料"
          className="absolute -top-3 -right-3 flex size-12 items-center justify-center overflow-hidden rounded-full border border-border bg-background"
        >
          <Image src={HERO_AVATAR_PLACEHOLDER_URI} alt="個人資料" width={48} height={48} className="size-full object-cover" />
        </Link>
      </div>

      <SectionCard className="mt-6 flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">小隊名稱</p>
        <p className="text-xl font-bold">{PLACEHOLDER_SQUAD_NAME}</p>
      </SectionCard>

      <SectionCard className="mt-6 flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">小隊目前積分</p>
        <p className="text-3xl font-bold text-primary">
          {PLACEHOLDER_SQUAD_POINTS.toLocaleString("en-US")}
        </p>
      </SectionCard>

      <SectionCard className="mt-6 flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">各區目前積分</p>
        {max === 0 ? (
          <p className="text-base text-muted-foreground">還沒有開始計分。</p>
        ) : (
          <ol className="flex flex-col gap-5">
            {ranked.map((zone) => (
              <li key={zone.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Image src={zone.icon} alt={zone.title} width={48} height={48} className="size-6 rounded-full" />
                    <span className="text-base">{zone.title}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {zone.total.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="h-2 rounded-r-[4px] bg-white/5">
                  <div
                    className={`h-full rounded-r-[4px] bg-chart-1 ${zone.total > 0 ? "min-w-0.5" : ""}`}
                    style={{ width: `${(zone.total / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <Link href={meetingHref} className="mt-6 block">
        <SectionCard className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">聚會內容</p>
          <p className="text-xl font-bold">查看這場聚會的大綱與筆記</p>
        </SectionCard>
      </Link>

      <SectionCard className="mt-6 flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">下場聚會倒數</p>
        <p className="text-xl font-bold">時間尚未公布</p>
      </SectionCard>
    </main>
  )
}
