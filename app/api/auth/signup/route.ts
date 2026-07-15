import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/database"
import { REGIONS, TEAMS, PASSWORDS } from "@/lib/constants"

export async function POST(request: NextRequest) {
  try {
    const { region, team, inviteCode, name, nickname, expectations } = await request.json()

    // 驗證邀請碼
    if (inviteCode !== "#rebirth") {
      return NextResponse.json({ error: "邀請碼錯誤" }, { status: 400 })
    }

    // 驗證區域和小隊
    if (!REGIONS.find((r) => r.id === region) || !TEAMS[region]?.includes(team)) {
      return NextResponse.json({ error: "區域或小隊選擇錯誤" }, { status: 400 })
    }

    if (!name || !nickname) {
      return NextResponse.json({ error: "請填寫完整資訊" }, { status: 400 })
    }

    // 建立用戶
    const password = PASSWORDS[region as keyof typeof PASSWORDS]
    const user = await createUser({
      name,
      nickname,
      region: region as "R" | "G" | "O",
      team,
      expectations,
      password,
      role: "student",
    })

    // 移除密碼後返回用戶資訊和密碼資訊
    const { password: _, ...userWithoutPassword } = user
    const regionInfo = REGIONS.find((r) => r.id === region)

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      passwordInfo: {
        password,
        verse: regionInfo?.verse,
        reference: regionInfo?.reference,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "註冊失敗，請稍後再試" }, { status: 500 })
  }
}
