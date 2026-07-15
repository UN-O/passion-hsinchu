import { type NextRequest, NextResponse } from "next/server"
import { getUserByNameAndPassword } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json()

    if (!name || !password) {
      return NextResponse.json({ error: "請輸入姓名和密碼" }, { status: 400 })
    }

    const user = await getUserByNameAndPassword(name, password)

    if (!user) {
      return NextResponse.json({ error: "姓名或密碼錯誤" }, { status: 401 })
    }

    // 移除密碼後返回用戶資訊
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "登入失敗，請稍後再試" }, { status: 500 })
  }
}
