import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { HERO_AVATAR_PLACEHOLDER_URI } from "@/lib/hero-card-visuals"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "個人資料",
  robots: { index: false, follow: false },
}

// 「勇者屬性」（開場測驗結果）目前不會存到資料庫，離開開場流程後就拿不到了，
// 這裡先放佔位文字，等測驗結果有地方持久化再換掉。
const PLACEHOLDER_HERO_TRAIT = "尚未設定"

export default async function CampProfilePage() {
  const session = await requireFlowAccess("camp")

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader />

      <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
        <Link href="/camp">
          <ArrowLeft />
        </Link>
      </Button>

      <div className="mt-10 flex flex-col items-center gap-6 text-center">
        <Image
          src={HERO_AVATAR_PLACEHOLDER_URI}
          alt="個人自拍照"
          width={160}
          height={160}
          className="size-40 rounded-full border border-border object-cover"
        />

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">勇者姓名</p>
          <p className="text-2xl font-bold">{session.user.name}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">勇者屬性</p>
          <p className="text-2xl font-bold">{PLACEHOLDER_HERO_TRAIT}</p>
        </div>
      </div>
    </main>
  )
}
