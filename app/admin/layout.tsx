import type React from "react"
import Image from "next/image"
import Link from "next/link"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { requireStaff } from "@/lib/session"
import { AdminSidebar } from "./admin-sidebar"

// 後台的權限判斷不能放 proxy.ts —— 那裡讀不到 role，也不該查資料庫。
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff()

  return (
    <SidebarProvider>
      <AdminSidebar userName={session.user.name} userRole={session.user.role} />
      <SidebarInset>
        {/* 側邊欄在小螢幕收成 Sheet，這根 trigger 是打開它的唯一入口。logo
            另外放一份在這裡（不是只靠 AdminSidebar 裡那份）：小螢幕的 logo
            在 Sheet 收起來時看不到，要點開側邊欄才點得到，這排 bar 才是小
            螢幕唯一隨時看得到的地方。 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <SidebarTrigger />
          <Link href="/" className="flex items-center">
            <Image
              src="/images/passion-logo.webp"
              alt="PASSION®"
              width={979}
              height={178}
              className="h-5 w-auto brightness-0 invert"
            />
          </Link>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
