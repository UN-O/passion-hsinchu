import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { BibleFreeReader } from "@/components/bible/bible-free-reader"
import { QuoteDemo } from "./quote-demo"
import { ReadingModeDemo } from "./reading-mode-demo"

// 自建聖經模組的三種模式一次看：自由模式／閱讀模式／quote 模式。
// 純展示用，不接資料庫（跟真正的討論串／root post 整合還沒做——閱讀模式
// 的「管理者選段落」要存在 discussion 的 schema 裡，這件事要先跟你確認過
// 才會動 migration，這裡先用前端 state 模擬）。
export default function BibleModulePlaygroundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
        <PassionLogoHeader logoTone="dark" />
        <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
          <Link href="/playground/camp-mission-home">
            <ArrowLeft />
          </Link>
        </Button>

        <h1 className="mt-10 text-xl font-semibold">聖經模組</h1>

        <section className="mt-8 flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">自由模式——選書卷／章／版本，整章顯示，可以點選、標記、複製、比較版本</h2>
          <BibleFreeReader initialBook="NEH" initialChapter={2} />
        </section>

        <section className="mt-10 flex flex-col gap-3 border-t border-border pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">
            閱讀模式——只放在 root post，管理者選好固定段落，讀的人一樣可以點選互動
          </h2>
          <ReadingModeDemo />
        </section>

        <section className="mt-10 flex flex-col gap-3 border-t border-border pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Quote 模式——像加圖片一樣加經文，插入回覆內文</h2>
          <QuoteDemo />
        </section>
      </main>
    </div>
  )
}
