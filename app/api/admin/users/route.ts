import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const teamStats = await sql`
      SELECT 
        team,
        region,
        COUNT(*) as user_count
      FROM users 
      WHERE role = 'student'
      GROUP BY team, region
      ORDER BY team
    `

    // Get random sample of user expectations
    const expectations = await sql`
      SELECT nickname, team, expectations
      FROM users 
      WHERE role = 'student' AND expectations IS NOT NULL AND expectations != ''
      ORDER BY RANDOM()
      LIMIT 10
    `

    return NextResponse.json({
      teamStats,
      expectations,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
  }
}
