/**
 * 管理者頁面頭部組件
 * 手機版顯示標題和用戶資訊
 */

"use client"

import { useAuth } from "@/hooks/use-auth"
import { Crown } from "lucide-react"

export function AdminHeader() {
  const { user } = useAuth()

  return (
    <header className="bg-card border-b border-border p-4 pl-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Crown className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-semibold">Passion Camp 管理後台</h1>
            <p className="text-sm text-muted-foreground">{user?.nickname}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
