import { type NextRequest, NextResponse } from "next/server"
import { getUserById, getUserAchievements, getUserPuzzles, getTeamByName } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "無效的用戶 ID" }, { status: 400 })
    }

    const [user, achievements, puzzles] = await Promise.all([
      getUserById(userId),
      getUserAchievements(userId),
      getUserPuzzles(userId),
    ])

    if (!user) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 })
    }

    const teamStats = await getTeamByName(user.team)

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      achievements,
      puzzles,
      teamStats,
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "獲取用戶資訊失敗" }, { status: 500 })
  }
}
