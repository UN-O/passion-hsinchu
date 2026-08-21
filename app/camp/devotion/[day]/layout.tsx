import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampDevotionDaySelect } from "@/components/camp-devotion-day-select"
import { DEVOTION_ENTRIES } from "@/lib/devotion-content"

// 頭部＋DAY2／DAY3 切換按鈕放在 layout（不是 page）：Next.js App Router
// 導頁在同一個 layout 底下切換動態區段（day2 → day3）不會整個卸載重掛，
// 只有 page.tsx 的內容會換掉。這個按鈕元件因此才是「同一個」DOM 節點
// 跨頁面存活，換頁時只是 activeId 這個 prop 變了，才吃得到玻璃滑動底那條
// CSS transition——如果放在 page.tsx 裡，每次換頁整個元件會重新掛載，
// 滑動底直接跳到新位置，沒有滑動過程。
export default async function CampDevotionDayLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ day: string }>
}) {
  const { day } = await params

  return (
    <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
      <PassionLogoHeader
        logoTone="dark"
        leftSlot={
          <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
            <Link href="/camp">
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <div className="mt-10 flex flex-col gap-10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">靈修內容</p>
          <CampDevotionDaySelect
            items={DEVOTION_ENTRIES.map((e) => ({ id: e.id, label: e.id.toUpperCase() }))}
            activeId={day}
          />
        </div>

        {children}
      </div>
    </main>
  )
}
