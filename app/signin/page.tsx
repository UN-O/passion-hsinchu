/**
 * Passion Camp 登入頁面
 * 支援學生和管理者登入，使用聖經章節作為密碼
 */

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/ui/header"

interface SigninForm {
  name: string
  password: string
}

export default function SigninPage() {
  const router = useRouter()
  const login = useAuth((state) => state.login)
  const [form, setForm] = useState<SigninForm>({
    name: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.name.trim() || !form.password.trim()) {
      setError("請填寫完整資訊")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          password: form.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "登入失敗")
        return
      }

      if (data.success && data.user) {
        login(data.user)

        // 根據用戶角色跳轉到對應頁面
        if (data.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("登入錯誤:", error)
      setError("登入失敗，請稍後再試")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-black text-white">
      <Header showBackButton={true} backHref="/" />

      <div className="flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">登入 Passion Camp</h1>
            <p className="text-white/70">使用您的聖經章節密碼登入</p>
          </div>

          <Card className="border-white/20 bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <LogIn className="w-5 h-5" />
                登入系統
              </CardTitle>
              <CardDescription className="text-white/70">輸入您的姓名和註冊時獲得的密碼</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 錯誤提示 */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* 姓名 */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    本名
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="請輸入您的真實姓名"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={isSubmitting}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                {/* 密碼 */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    密碼
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="請輸入密碼（Hint: 聖經章節）"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    disabled={isSubmitting}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <p className="text-xs text-white/50">密碼為註冊時顯示的聖經章節</p>
                </div>

                {/* 登入按鈕 */}
                <Button
                  type="submit"
                  className="w-full bg-[#eed688] text-black hover:bg-[#eed688]/90 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "登入中..." : "登入"}
                </Button>
              </form>

              {/* 註冊連結 */}
              <div className="mt-6 text-center">
                <p className="text-sm text-white/70">
                  還沒有帳號？
                  <Link href="/signup" className="text-[#eed688] hover:underline ml-1">
                    立即註冊
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
         
        </div>
      </div>
    </div>
  )
}
