import type React from "react"

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
        {/* 側邊欄在小螢幕收成 Sheet，這根 trigger 是打開它的唯一入口。 */}
        <div className="flex items-center border-b border-border px-4 py-3 md:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
