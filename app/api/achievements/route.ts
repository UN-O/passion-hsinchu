import { NextResponse } from "next/server"
import { getAchievements } from "@/lib/database"

export async function GET() {
  try {
    const achievements = await getAchievements()

    return NextResponse.json({
      success: true,
      achievements,
    })
  } catch (error) {
    console.error("Get achievements error:", error)
    return NextResponse.json({ error: "獲取成就列表失敗" }, { status: 500 })
  }
}
