import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { BibleFreeReader } from "@/components/bible/bible-free-reader"
import { BIBLE_VERSIONS, BOOK_BY_CODE } from "@/lib/bible"
import type { BibleVersionKey } from "@/lib/bible"
import { requireClaimedSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "自由模式",
  robots: { index: false, follow: false },
}

// 自由模式的正式頁面——只要求登入（requireClaimedSession），不綁 CAMP／
// CONFERENCE 哪一邊，純粹是「讀經」這個功能本身，跟活動流程無關。經文卡片
// 的「閱讀整章」按鈕（見 passage-card.tsx）會帶 book/chapter/version 連到
// 這裡，開新分頁接著往下讀。
export default async function BiblePage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; chapter?: string; version?: string }>
}) {
  await requireClaimedSession()
  const params = await searchParams

  const book = params.book && BOOK_BY_CODE.has(params.book) ? params.book : "JHN"
  const chapterNum = Number(params.chapter)
  const chapter = Number.isInteger(chapterNum) && chapterNum > 0 ? chapterNum : 3
  const version: BibleVersionKey = params.version && params.version in BIBLE_VERSIONS ? (params.version as BibleVersionKey) : "unv"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
        <PassionLogoHeader
          leftSlot={
            <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
          }
        />

        <h1 className="mt-10 text-xl font-semibold">自由模式</h1>

        <div className="mt-4">
          <BibleFreeReader initialBook={book} initialChapter={chapter} initialVersion={version} />
        </div>
      </main>
    </div>
  )
}
