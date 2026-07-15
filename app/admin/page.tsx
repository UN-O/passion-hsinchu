/**
 * 管理者後台主頁面
 * 自動重定向到經驗值管理頁面
 */

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/exp")
  }, [router])

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">載入管理介面...</p>
        </div>
      </div>
    </AuthGuard>
  )
}
