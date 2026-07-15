/**
 * 管理者後台布局
 * 包含側邊欄導航和響應式設計
 */

"use client"

import type React from "react"

import { AuthGuard } from "@/components/auth-guard"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-black text-white">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <AdminHeader />
        </div>

        <div className="flex">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main Content */}
          <main className="flex-1 lg:ml-64">
            <div className="p-4 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
