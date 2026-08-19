"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"

// 住房資料還沒有真的內容，先用佔位圖片頂著，等資料確定後換成真的圖片。
const PLACEHOLDER_IMAGE_SRC = "/images/camp-info-placeholder.jpg"

const IMAGE_MENU_ITEMS = [
  { key: "schedule", label: "聚會流程表", imageSrc: "/images/camp-schedule.jpg" },
  { key: "lodging", label: "住房資料", imageSrc: PLACEHOLDER_IMAGE_SRC },
] as const

type ImageMenuKey = (typeof IMAGE_MENU_ITEMS)[number]["key"]

export function CampSidebar() {
  const [open, setOpen] = useState(false)
  const [activeImage, setActiveImage] = useState<ImageMenuKey | null>(null)

  const activeItem = IMAGE_MENU_ITEMS.find((item) => item.key === activeImage)

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
            {IMAGE_MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setOpen(false)
                  setActiveImage(item.key)
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

      {/* 聚會流程表／住房資料：不跳頁，彈出圖片視窗，右上角用跟側邊欄一樣的 X 按鈕關閉。
          流程表圖片很長，加 max-h + overflow-y-auto，矮螢幕也看得到完整內容。 */}
      <Dialog open={activeImage !== null} onOpenChange={(next) => !next && setActiveImage(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[85vh] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-3xl border-none bg-transparent p-0 sm:max-w-sm"
        >
          <DialogTitle className="sr-only">{activeItem?.label ?? ""}</DialogTitle>
          <div className="sticky top-0 z-10 flex justify-end p-2">
            <DialogClose className="rounded-full bg-black/50 p-1 text-white/90 backdrop-blur-sm hover:text-white">
              <X className="size-5" />
              <span className="sr-only">關閉</span>
            </DialogClose>
          </div>
          {activeItem && (
            <Image
              src={activeItem.imageSrc}
              alt={activeItem.label}
              width={600}
              height={1472}
              className="h-auto w-full"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
