/**
 * 認證提供者組件
 * 在應用啟動時初始化認證狀態
 */

"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuth((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}
