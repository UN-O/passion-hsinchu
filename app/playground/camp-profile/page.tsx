import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { HERO_AVATAR_PLACEHOLDER_URI } from "@/lib/hero-card-visuals"

export default function CampProfilePlaygroundPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader
        leftSlot={
          <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
            <Link href="/playground/camp-mission-home">
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

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
          <p className="text-2xl font-bold">測試勇者</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">勇者屬性</p>
          <p className="text-2xl font-bold">尚未設定</p>
        </div>
      </div>
    </main>
  )
}
