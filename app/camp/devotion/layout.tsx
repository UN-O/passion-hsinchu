import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampDevotionDaySelect } from "@/components/camp-devotion-day-select"
import { DEVOTION_ENTRIES } from "@/lib/devotion-content"

// 頭部＋DAY2／DAY3 切換按鈕放在這一層（app/camp/devotion/layout.tsx），
// 不是 [day]/layout.tsx——這一層是靜態區段，不管切到 day2 還是 day3
// 在路由樹裡的位置都不變，Next.js 換頁時保證不會把它卸載重掛，玻璃
// 滑動底的 CSS transition 才吃得到「從哪裡滑到哪裡」，真的會動。之前
// 放在 [day]/layout.tsx 裡試過，那層本身架在會變動的動態區段上，
// 換頁時還是可能整層重新渲染，滑動效果會跳掉（實測過的真的問題）。
// 也因為這樣，這裡不能用 params 讀目前是哪一天（外層 layout 拿不到
// 更深的動態區段參數）——CampDevotionDaySelect 自己用 usePathname 判斷。
export default function CampDevotionLayout({ children }: { children: React.ReactNode }) {
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
          <CampDevotionDaySelect items={DEVOTION_ENTRIES.map((e) => ({ id: e.id, label: e.id.toUpperCase() }))} />
        </div>

        {children}
      </div>
    </main>
  )
}
