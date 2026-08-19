"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const MENU_ITEMS = [
  { href: "/camp/schedule", label: "聚會流程表" },
  { href: "/camp/lodging", label: "住房資料" },
  { href: "/camp/devotion", label: "靈修內容" },
] as const

export function CampSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label="選單"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-background"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      {/* 側欄固定佔畫面 4/5、右側永遠留 1/5，覆寫 Sheet 預設的 w-3/4 + sm:max-w-sm。
          霧玻璃：半透明底 + backdrop-blur，讓底下主頁（被 SheetOverlay 壓暗）透出來。 */}
      <SheetContent
        side="left"
        showCloseButton={false}
        className="data-[side=left]:w-4/5 data-[side=left]:sm:max-w-none border-none bg-background/40 backdrop-blur-2xl"
      >
        <SheetHeader className="flex-row items-center justify-end">
          {/* 螢幕閱讀器仍需要標題，只是不顯示文字 */}
          <SheetTitle className="sr-only">選單</SheetTitle>
          <SheetClose className="text-foreground/80 hover:text-foreground">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </SheetClose>
        </SheetHeader>
        <nav className="flex flex-col gap-4 px-6 pb-6">
          {MENU_ITEMS.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className="rounded-full border border-white/15 bg-white/10 px-6 py-4 text-center text-base font-bold backdrop-blur-sm hover:bg-white/15"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
