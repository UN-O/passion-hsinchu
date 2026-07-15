/**
 * Passion Camp 註冊頁面
 * 包含區域選擇、小隊選擇、邀請碼驗證和個人資訊填寫
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { REGIONS, TEAMS, INVITE_CODE } from "@/lib/constants"
import { getRegionById, getThemeClass } from "@/lib/utils"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/ui/header"

interface SignupForm {
  region: "R" | "G" | "O" | ""
  team: string
  inviteCode: string
  name: string
  nickname: string
  expectations: string
}

interface PasswordInfo {
  password: string
  verse: string
  reference: string
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<SignupForm>({
    region: "",
    team: "",
    inviteCode: "",
    name: "",
    nickname: "",
    expectations: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordInfo, setPasswordInfo] = useState<PasswordInfo | null>(null)

  // 根據選擇的區域過濾小隊
  const availableTeams = form.region ? TEAMS[form.region] || [] : []
  const selectedRegion = form.region ? getRegionById(form.region) : null

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!form.region) newErrors.region = "請選擇區域"
    if (!form.team) newErrors.team = "請選擇小隊"
    if (!form.inviteCode) newErrors.inviteCode = "請輸入邀請碼"
    else if (form.inviteCode !== INVITE_CODE) newErrors.inviteCode = "邀請碼錯誤"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = "請輸入本名"
    if (!form.nickname.trim()) newErrors.nickname = "請輸入稱呼"
    if (!form.expectations.trim()) newErrors.expectations = "請分享您對本次營會的期待"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          region: form.region,
          team: form.team,
          inviteCode: form.inviteCode,
          name: form.name,
          nickname: form.nickname,
          expectations: form.expectations,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ submit: data.error || "註冊失敗" })
        return
      }

      if (data.success && data.passwordInfo) {
        setPasswordInfo(data.passwordInfo)
        setStep(3)
      }
    } catch (error) {
      console.error("註冊失敗:", error)
      setErrors({ submit: "註冊失敗，請稍後再試" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  if (step === 3 && passwordInfo) {
    return <SignupSuccess region={selectedRegion!} passwordInfo={passwordInfo} />
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-black text-white">
      <Header showBackButton={true} backHref="/" />

      <div className="flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md space-y-6">

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 1 ? "bg-[#eed688] text-black" : "bg-white/20 text-white/50"
              }`}
            >
              1
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? "bg-[#eed688]" : "bg-white/20"}`} />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 2 ? "bg-[#eed688] text-black" : "bg-white/20 text-white/50"
              }`}
            >
              2
            </div>
          </div>

          <Card className="border-white/20 bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">{step === 1 ? "選擇你的隊伍" : "個人資訊"}</CardTitle>
              <CardDescription className="text-white/70">
                {step === 1 ? "選擇你的區域和小隊" : "告訴我們更多關於你的資訊"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.submit && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              {step === 1 ? (
                <>
                  {/* 區域選擇 */}
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-white">
                      區域
                    </Label>
                    <Select
                      value={form.region}
                      onValueChange={(value: "R" | "G" | "O") => {
                        setForm({ ...form, region: value, team: "" })
                        setErrors({ ...errors, region: "" })
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="選擇區域" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.region && <p className="text-sm text-red-400">{errors.region}</p>}
                  </div>

                  {/* 小隊選擇 */}
                  <div className="space-y-2">
                    <Label htmlFor="team" className="text-white">
                      小隊
                    </Label>
                    <Select
                      value={form.team}
                      onValueChange={(value) => {
                        setForm({ ...form, team: value })
                        setErrors({ ...errors, team: "" })
                      }}
                      disabled={!form.region}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder={form.region ? "選擇小隊" : "請先選擇區域"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeams.map((team) => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.team && <p className="text-sm text-red-400">{errors.team}</p>}
                  </div>

                  {/* 邀請碼 */}
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode" className="text-white">
                      邀請碼
                    </Label>
                    <Input
                      id="inviteCode"
                      type="text"
                      placeholder="輸入邀請碼"
                      value={form.inviteCode}
                      onChange={(e) => {
                        setForm({ ...form, inviteCode: e.target.value })
                        setErrors({ ...errors, inviteCode: "" })
                      }}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    {errors.inviteCode && <p className="text-sm text-red-400">{errors.inviteCode}</p>}
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full bg-[#eed688] text-black hover:bg-[#eed688]/90 font-semibold"
                    disabled={!form.region || !form.team || !form.inviteCode}
                  >
                    下一步
                  </Button>
                </>
              ) : (
                <>
                  {/* 本名 */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      本名
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="請輸入您的真實姓名"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value })
                        setErrors({ ...errors, name: "" })
                      }}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
                  </div>

                  {/* 稱呼 */}
                  <div className="space-y-2">
                    <Label htmlFor="nickname" className="text-white">
                      稱呼
                    </Label>
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="大家可以怎麼稱呼您？"
                      value={form.nickname}
                      onChange={(e) => {
                        setForm({ ...form, nickname: e.target.value })
                        setErrors({ ...errors, nickname: "" })
                      }}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    {errors.nickname && <p className="text-sm text-red-400">{errors.nickname}</p>}
                  </div>

                  {/* 期待 */}
                  <div className="space-y-2">
                    <Label htmlFor="expectations" className="text-white">
                      對本次營會的期待
                    </Label>
                    <Textarea
                      id="expectations"
                      placeholder="分享您對這次 Passion Camp 的期待..."
                      rows={4}
                      value={form.expectations}
                      onChange={(e) => {
                        setForm({ ...form, expectations: e.target.value })
                        setErrors({ ...errors, expectations: "" })
                      }}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    {errors.expectations && <p className="text-sm text-red-400">{errors.expectations}</p>}
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
                    >
                      上一步
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 bg-[#eed688] text-black hover:bg-[#eed688]/90 font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "註冊中..." : "完成註冊"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <div className="pt-2 flex justify-center">
            <Link href="/signin" className="text-sm text-white/70 hover:text-[#eed688] transition-colors duration-200">
              已經有帳戶？前往登入介面
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SignupSuccessProps {
  region: { id: "R" | "G" | "O"; name: string; password: string; verse: string; theme: string }
  passwordInfo: PasswordInfo
}

function SignupSuccess({ region, passwordInfo }: SignupSuccessProps) {
  const router = useRouter()
  const themeClass = getThemeClass(`${region.id}1`) // 使用第一個組別來獲取主題

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-8 h-8 text-[#eed688]" />
              <h1 className="text-3xl font-bold text-white">完成註冊</h1>
            </div>
            <p className="text-white/70">歡迎加入 {region.name}</p>
          </div>

          <Card className="border-white/20 bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">您的登入密碼</CardTitle>
              <CardDescription className="text-white/70">請截圖保存，登入時需要使用</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <p className="text-sm text-white/70">密碼</p>
                <p className="text-2xl font-mono font-bold text-[#eed688]">{passwordInfo.password}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-center">對應經文</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <p className="text-base leading-relaxed text-white">{passwordInfo.verse}</p>
              <p className="text-sm text-white/50">{passwordInfo.reference}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <p className="text-sm text-white/70 text-center">建議您截圖保存此頁面，然後前往登入</p>
            <Button
              onClick={() => router.push("/signin")}
              className="w-full bg-[#eed688] text-black hover:bg-[#eed688]/90 font-semibold"
            >
              前往登入
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
