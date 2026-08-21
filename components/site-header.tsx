"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutDialog } from "@/components/opening/logout-dialog"

// 只取 header 真正要用的欄位，不要把整個 session 傳進 client component
export type HeaderSession = { name: string }

const navItems = [
  { href: "#about", label: "關於 PASSION" },
  { href: "#camp", label: "PASSION CAMP" },
  { href: "#conference", label: "PASSION CONFERENCE" },
  { href: "#video", label: "宣傳影片" },
  { href: "#gallery", label: "宣傳圖文" },
  { href: "#links", label: "相關連結" },
]

export function SiteHeader({ session }: { session: HeaderSession | null }) {
  const [open, setOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          aria-label={open ? "關閉選單" : "開啟選單"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground/40"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link href="#top" className="flex items-center">
          <Image
            src="/images/passion-logo.webp"
            alt="PASSION®"
            width={979}
            height={178}
            priority
            className="h-6 w-auto brightness-0 invert sm:h-7"
          />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <Button variant="outline" size="sm" onClick={() => setLogoutOpen(true)}>
              登出
            </Button>
          ) : (
            // 報名已結束，只留一顆登入按鈕（原本的「報到」與「立即報名」是重複的入口）
            <Button asChild size="sm">
              <Link href="/signin">登入系統</Link>
            </Button>
          )}
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {session && <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />}
    </header>
  )
}
