import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { GROUPS } from "@/lib/constants"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const totalAchievements = await sql`
      SELECT COUNT(*) as total_achievements
      FROM achievements
      WHERE is_active = true
    `

    const teamStats = await sql`
      SELECT 
        ts.team_name,
        ts.region,
        ts.total_exp,
        ts.level,
        ts.record_count,
        COALESCE(user_counts.member_count, 0) as member_count,
        COALESCE(achievement_counts.achievements_count, 0) as achievements_count
      FROM team_stats ts
      LEFT JOIN (
        SELECT team, COUNT(*) as member_count
        FROM users 
        WHERE role = 'student' AND team IS NOT NULL
        GROUP BY team
      ) user_counts ON ts.team_name = user_counts.team
      LEFT JOIN (
        SELECT team_name, COUNT(DISTINCT achievement_id) as achievements_count
        FROM team_achievements
        GROUP BY team_name
      ) achievement_counts ON ts.team_name = achievement_counts.team_name
      ORDER BY ts.total_exp DESC
    `

    const globalTotalAchievements = totalAchievements[0]?.total_achievements || 0

    const allTeams = GROUPS.map((group) => {
      const stat = teamStats.find((s) => s.team_name === group.name)

      return {
        team_name: group.name,
        region: group.region,
        color: group.color,
        total_exp: stat?.total_exp || 0,
        level: stat?.level || 1,
        record_count: stat?.record_count || 0,
        member_count: stat?.member_count || 0,
        achievements_count: stat?.achievements_count || 0,
        total_achievements: globalTotalAchievements, // Global total for all teams
      }
    })

    return NextResponse.json(allTeams)
  } catch (error) {
    console.error("獲取組別統計失敗:", error)
    return NextResponse.json({ error: "獲取組別統計失敗" }, { status: 500 })
  }
}
