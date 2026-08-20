"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { CampLodgingInfo } from "@/components/camp-lodging-info"

const PANEL_MENU_ITEMS = [
  { key: "schedule", label: "聚會流程表", type: "image", imageSrc: "/images/camp-schedule.jpg" },
  { key: "lodging", label: "住房資料", type: "content" },
] as const

type PanelKey = (typeof PANEL_MENU_ITEMS)[number]["key"]

export function CampSidebar() {
  const [open, setOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null)

  const activeItem = PANEL_MENU_ITEMS.find((item) => item.key === activePanel)

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
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
          className="camp-theme data-[side=left]:w-4/5 data-[side=left]:sm:max-w-none border-none bg-background/40 backdrop-blur-2xl"
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
            {PANEL_MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setOpen(false)
                  setActivePanel(item.key)
                }}
                className="rounded-full border border-white/15 bg-white/10 px-6 py-4 text-center text-base font-bold backdrop-blur-sm hover:bg-white/15"
              >
                {item.label}
              </button>
            ))}
            <SheetClose asChild>
              <Link
                href="/camp/devotion"
                className="rounded-full border border-white/15 bg-white/10 px-6 py-4 text-center text-base font-bold backdrop-blur-sm hover:bg-white/15"
              >
                靈修內容
              </Link>
            </SheetClose>
          </nav>
        </SheetContent>
      </Sheet>

      {/* 聚會流程表（圖片）／住房資料（房號＋文字）：不跳頁，彈出視窗，右上角用跟側邊欄
          一樣的 X 按鈕關閉。內容可能比較長，加 max-h + overflow-y-auto。 */}
      <Dialog open={activePanel !== null} onOpenChange={(next) => !next && setActivePanel(null)}>
        <DialogContent
          showCloseButton={false}
          className="camp-theme max-h-[85vh] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-3xl border-none bg-transparent p-0 sm:max-w-sm"
        >
          <DialogTitle className="sr-only">{activeItem?.label ?? ""}</DialogTitle>
          <DialogClose className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1 text-white/90 backdrop-blur-sm hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>
          {activeItem?.type === "image" && (
            <Image
              src={activeItem.imageSrc}
              alt={activeItem.label}
              width={700}
              height={1718}
              className="block h-auto w-full"
            />
          )}
          {activeItem?.type === "content" && activeItem.key === "lodging" && (
            <div className="min-w-0 px-2 pb-2">
              <CampLodgingInfo />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
