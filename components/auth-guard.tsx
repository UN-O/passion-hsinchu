/**
 * 認證守衛組件
 * 保護需要登入的頁面，未登入用戶會被重定向到登入頁
 */

"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAdmin = false, redirectTo = "/signin" }: AuthGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requireAdmin && user?.role !== "admin") {
        router.push("/dashboard")
        return
      }

      if (!requireAdmin && user?.role === "admin") {
        router.push("/admin")
        return
      }
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, router, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requireAdmin && user?.role !== "admin") {
    return null
  }

  if (!requireAdmin && user?.role === "admin") {
    return null
  }

  return <>{children}</>
}
