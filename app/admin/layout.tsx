import type React from "react"
import Link from "next/link"

import { requireStaff } from "@/lib/session"

// 後台的權限判斷不能放 proxy.ts —— 那裡讀不到 role，也不該查資料庫。
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff()

  return (
    <div className="min-h-svh">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link href="/admin/enrollment" className="text-sm font-medium">
            名冊管理
          </Link>
          <Link href="/admin/points" className="text-sm font-medium">
            CAMP 加分
          </Link>
          <span className="ml-auto text-sm text-muted-foreground">
            {session.user.name}（{session.user.role}）
          </span>
        </div>
      </header>
      {children}
    </div>
  )
}
